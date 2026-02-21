import SwiftUI
import Combine
import Foundation

@MainActor
class MealViewModel: ObservableObject {
    @Published var state: SessionState = .idle
    @Published var session: MealSession?
    @Published var lastFullnessRating: Int?
    @Published var settings: AppSettings = .default
    @Published var elapsedSeconds: Int = 0
    @Published var countdownSeconds: Int = 0
    @Published var allSessions: [MealSession] = []
    
    private var timer: Timer?
    private var nextPromptAt: Date?
    private var pauseEndsAt: Date?
    private var promptShownAt: Date?
    private var ignoreCount: Int = 0
    private let firestore = FirestoreService.shared
    private let notifications = NotificationManager.shared
    
    // MARK: - Init
    
    func loadData() async {
        settings = await firestore.loadSettings()
        allSessions = await firestore.getAllSessions()
    }
    
    // MARK: - Start Meal
    
    func startMeal(mode: MealMode, context: MealContext?) {
        let newSession = MealSession(
            id: UUID().uuidString,
            startedAt: Date(),
            mode: mode,
            context: context,
            status: .active
        )
        session = newSession
        state = .waitingForPrompt
        lastFullnessRating = nil
        ignoreCount = 0
        
        // Save + log
        Task {
            await firestore.saveSession(newSession)
            await logEvent(type: .sessionStarted)
        }
        
        let interval = settings.intervalForRating(context?.hungerBefore ?? 0)
        scheduleNextPrompt(in: interval)
        startTimer()
    }
    
    // MARK: - Rate Fullness
    
    func rateFullness(_ rating: Int) {
        let responseDelay = promptShownAt.map { Int(Date().timeIntervalSince($0) * 1000) }
        lastFullnessRating = rating
        ignoreCount = 0
        let interval = settings.intervalForRating(rating)
        
        // Cancel escalation
        if let sid = session?.id {
            notifications.cancelAll(sessionId: sid)
        }
        
        // Log event
        Task {
            await logEvent(type: .fullnessRated, fullnessRating: rating, nextIntervalSec: interval, responseDelayMs: responseDelay)
        }
        
        if rating >= settings.doneThreshold {
            triggerDoneFlow()
        } else if rating >= settings.highFullnessThreshold {
            triggerUnlockPrompt()
        } else {
            state = .waitingForPrompt
            scheduleNextPrompt(in: interval)
        }
    }
    
    // MARK: - Show Prompt
    
    private func showPrompt() {
        state = .waitingForInput
        promptShownAt = Date()
        nextPromptAt = nil
        
        // Haptic
        notifications.triggerPromptHaptic(attempt: ignoreCount)
        
        // Start escalation if user doesn't respond
        if let sid = session?.id {
            notifications.startEscalation(sessionId: sid)
        }
        
        Task {
            await logEvent(type: .promptShown)
        }
    }
    
    // MARK: - Ignore Prompt
    
    func ignorePrompt() {
        ignoreCount += 1
        let delay = settings.socialMode
            ? settings.ignoredPromptRepromptSec * 3
            : settings.ignoredPromptRepromptSec
        state = .waitingForPrompt
        
        Task { await logEvent(type: .promptIgnored) }
        
        scheduleNextPrompt(in: delay)
    }
    
    // MARK: - Unlock
    
    func attemptUnlock(input: String? = nil) -> Bool {
        Task { await logEvent(type: .unlockAttempt) }
        
        var success = false
        switch settings.unlockMethod {
        case .tap:
            success = true
        case .hold:
            success = true
        case .typeCode:
            success = input?.uppercased() == settings.unlockCode.uppercased()
        }
        
        if success {
            Task { await logEvent(type: .unlockSuccess) }
            grantUnlockWindow()
        } else {
            Task { await logEvent(type: .unlockDenied) }
        }
        return success
    }
    
    private func grantUnlockWindow() {
        state = .waitingForPrompt
        scheduleNextPrompt(in: settings.unlockWindowSec)
    }
    
    // MARK: - Unlock Prompt
    
    private func triggerUnlockPrompt() {
        state = .highFullnessUnlock
        Task { await logEvent(type: .unlockPromptShown) }
    }
    
    // MARK: - Done Flow
    
    private func triggerDoneFlow() {
        state = .doneFlow
        Task { await logEvent(type: .doneFlowShown) }
    }
    
    func continueFromDone() {
        state = .highFullnessUnlock
    }
    
    // MARK: - Pause
    
    func startPause() {
        state = .pause
        pauseEndsAt = Date().addingTimeInterval(TimeInterval(settings.doneFlowPauseSec))
        nextPromptAt = nil
        
        if let sid = session?.id {
            notifications.cancelAll(sessionId: sid)
        }
        
        Task { await logEvent(type: .pauseStarted) }
    }
    
    func endPause() {
        state = .waitingForInput
        pauseEndsAt = nil
        promptShownAt = Date()
        
        notifications.triggerPromptHaptic()
        if let sid = session?.id {
            notifications.startEscalation(sessionId: sid)
        }
        
        Task { await logEvent(type: .pauseEnded) }
    }
    
    // MARK: - End Meal
    
    func endMeal(summary: FinalSummary? = nil) {
        guard var s = session else { return }
        s.endedAt = Date()
        s.status = .ended
        s.finalSummary = summary
        session = s
        
        if let sid = session?.id {
            notifications.cancelAll(sessionId: sid)
        }
        
        Task {
            await logEvent(type: .sessionEnded)
            await firestore.saveSession(s)
            await MainActor.run { self.allSessions.insert(s, at: 0) }
        }
        
        cleanup()
    }
    
    func deleteMeal() {
        guard let sid = session?.id else { return }
        notifications.cancelAll(sessionId: sid)
        Task { await firestore.deleteSession(sid) }
        cleanup()
    }
    
    private func cleanup() {
        stopTimer()
        session = nil
        state = .idle
        lastFullnessRating = nil
        nextPromptAt = nil
        pauseEndsAt = nil
        promptShownAt = nil
        elapsedSeconds = 0
        countdownSeconds = 0
        ignoreCount = 0
    }
    
    // MARK: - Settings
    
    func updateSettings(_ newSettings: AppSettings) {
        settings = newSettings
        Task { await firestore.saveSettings(newSettings) }
    }
    
    // MARK: - Timer
    
    private func scheduleNextPrompt(in seconds: Int) {
        guard seconds > 0 else {
            triggerDoneFlow()
            return
        }
        nextPromptAt = Date().addingTimeInterval(TimeInterval(seconds))
        countdownSeconds = seconds
        
        // Schedule notification for when app is backgrounded
        if let sid = session?.id {
            notifications.schedulePrompt(sessionId: sid, delaySec: seconds)
        }
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task {
                await MainActor.run {
                    self.tick()
                }
            }
        }
    }
    
    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
    
    private func tick() {
        guard let session else { return }
        
        elapsedSeconds = Int(Date().timeIntervalSince(session.startedAt))
        
        if state == .waitingForPrompt, let target = nextPromptAt {
            let remaining = Int(target.timeIntervalSinceNow)
            countdownSeconds = max(0, remaining)
            if remaining <= 0 {
                showPrompt()
            }
        }
        
        if state == .pause, let target = pauseEndsAt {
            let remaining = Int(target.timeIntervalSinceNow)
            countdownSeconds = max(0, remaining)
            if remaining <= 0 {
                endPause()
            }
        }
    }
    
    // MARK: - Event Logging
    
    private func logEvent(type: MealEventType, fullnessRating: Int? = nil, nextIntervalSec: Int? = nil, responseDelayMs: Int? = nil) async {
        guard let sid = session?.id else { return }
        let event = MealEvent(
            id: UUID().uuidString,
            sessionId: sid,
            ts: Date(),
            type: type,
            fullnessRating: fullnessRating,
            nextIntervalSec: nextIntervalSec,
            responseDelayMs: responseDelayMs
        )
        await firestore.saveEvent(event)
    }
}
