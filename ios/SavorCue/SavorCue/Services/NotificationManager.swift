import Foundation
import UserNotifications
import UIKit

/// Manages local notifications with escalating urgency.
/// Also schedules server-side notifications via Firestore for when the app is killed.
class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationManager()
    
    private var escalationTimer: Timer?
    private var escalationAttempt = 0
    private var activeSessionId: String?
    
    private let escalationMessages = [
        "How full are you right now?",
        "Don't forget to check in — how full are you?",
        "Still eating? Rate your fullness now.",
        "Hey! SavorCue needs your attention.",
        "REMINDER: Rate your fullness right now!",
    ]
    
    // Escalating sounds: default → triTone → repeated
    private let escalationSounds: [UNNotificationSound] = [
        .default,
        UNNotificationSound(named: UNNotificationSoundName("tri-tone")),
        .defaultCritical,
        .defaultCriticalSound(withAudioVolume: 0.8),
        .defaultCriticalSound(withAudioVolume: 1.0),
    ]
    
    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    // MARK: - Permission
    
    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge, .criticalAlert])
            return granted
        } catch {
            print("NotificationManager: Permission error: \(error)")
            return false
        }
    }
    
    // MARK: - Schedule Local Prompt
    
    func schedulePrompt(sessionId: String, delaySec: Int) {
        activeSessionId = sessionId
        escalationAttempt = 0
        
        // Clear any existing notifications
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        
        // Schedule the first notification
        scheduleLocalNotification(delaySec: delaySec, attempt: 0)
        
        // Also schedule server-side for when app is killed
        Task {
            await FirestoreService.shared.cancelNotifications(sessionId: sessionId)
            await FirestoreService.shared.scheduleNotification(
                sessionId: sessionId,
                delaySec: delaySec,
                ntfyTopic: nil // Will be read from settings if available
            )
        }
    }
    
    // MARK: - Escalation
    
    func startEscalation(sessionId: String) {
        activeSessionId = sessionId
        escalationAttempt = 0
        scheduleEscalatingNotification()
    }
    
    private func scheduleEscalatingNotification() {
        let attempt = min(escalationAttempt, escalationMessages.count - 1)
        let message = escalationMessages[attempt]
        let sound = escalationSounds[min(attempt, escalationSounds.count - 1)]
        
        let content = UNMutableNotificationContent()
        content.title = "SavorCue"
        content.body = message
        content.sound = sound
        content.badge = NSNumber(value: escalationAttempt + 1)
        content.interruptionLevel = attempt >= 3 ? .critical : .timeSensitive
        content.categoryIdentifier = "FULLNESS_PROMPT"
        
        // Schedule 30 seconds from now for re-prompt
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 30, repeats: false)
        let request = UNNotificationRequest(
            identifier: "escalation-\(escalationAttempt)",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request)
        escalationAttempt += 1
        
        // Schedule next escalation if under limit
        if escalationAttempt < 15 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 35) { [weak self] in
                guard let self, self.activeSessionId != nil else { return }
                self.scheduleEscalatingNotification()
            }
        }
    }
    
    // MARK: - Cancel
    
    func cancelAll(sessionId: String? = nil) {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        UIApplication.shared.applicationIconBadgeNumber = 0
        escalationAttempt = 0
        activeSessionId = nil
        
        if let sessionId {
            Task {
                await FirestoreService.shared.cancelNotifications(sessionId: sessionId)
            }
        }
    }
    
    // MARK: - Simple Local Notification
    
    private func scheduleLocalNotification(delaySec: Int, attempt: Int) {
        let content = UNMutableNotificationContent()
        content.title = "SavorCue"
        content.body = "How full are you right now?"
        content.sound = .default
        content.interruptionLevel = .timeSensitive
        content.categoryIdentifier = "FULLNESS_PROMPT"
        
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(max(1, delaySec)),
            repeats: false
        )
        
        let request = UNNotificationRequest(
            identifier: "prompt-\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request)
    }
    
    // MARK: - Haptic Feedback
    
    func triggerPromptHaptic(attempt: Int = 0) {
        let generator: UINotificationFeedbackGenerator
        switch attempt {
        case 0...1:
            generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.warning)
        case 2...3:
            generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.error)
            // Double buzz
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                generator.notificationOccurred(.error)
            }
        default:
            // Triple buzz for ignored prompts
            generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.error)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                generator.notificationOccurred(.error)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                generator.notificationOccurred(.error)
            }
        }
    }
    
    // MARK: - Setup Notification Actions
    
    func setupCategories() {
        let quickRateActions = (0...10).map { i in
            UNNotificationAction(
                identifier: "RATE_\(i)",
                title: "\(i)",
                options: []
            )
        }
        
        let category = UNNotificationCategory(
            identifier: "FULLNESS_PROMPT",
            actions: Array(quickRateActions.prefix(5)) + [
                UNNotificationAction(identifier: "RATE_5", title: "5", options: []),
                UNNotificationAction(identifier: "RATE_7", title: "7", options: []),
                UNNotificationAction(identifier: "RATE_8", title: "8", options: []),
                UNNotificationAction(identifier: "RATE_9", title: "9", options: []),
                UNNotificationAction(identifier: "RATE_10", title: "10", options: []),
            ],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([category])
    }
    
    // MARK: - UNUserNotificationCenterDelegate
    
    // Handle notification when app is in foreground
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }
    
    // Handle notification action (user tapped or used quick action)
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let actionId = response.actionIdentifier
        
        if actionId.hasPrefix("RATE_"), let rating = Int(actionId.replacingOccurrences(of: "RATE_", with: "")) {
            // User rated from notification action
            NotificationCenter.default.post(
                name: .init("SavorCueQuickRate"),
                object: nil,
                userInfo: ["rating": rating]
            )
        }
        
        completionHandler()
    }
}
