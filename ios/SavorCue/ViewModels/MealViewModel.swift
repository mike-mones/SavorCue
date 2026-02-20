import SwiftUI
import Foundation

@MainActor
class MealViewModel: ObservableObject {
    @Published var state: SessionState = .idle
    @Published var session: MealSession?
    @Published var lastFullnessRating: Int?
    @Published var settings: AppSettings = .default
    @Published var elapsedSeconds: Int = 0
    @Published var countdownSeconds: Int = 0
    
    private var timer: Timer?
    private var nextPromptAt: Date?
    private var pauseEndsAt: Date?
    
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
        
        let interval = settings.intervalForRating(context?.hungerBefore ?? 0)
        scheduleNextPrompt(in: interval)
        startTimer()
    }
    
    // MARK: - Rate Fullness
    
    func rateFullness(_ rating: Int) {
        lastFullnessRating = rating
        let interval = settings.intervalForRating(rating)
        
        if rating >= settings.doneThreshold {
            state = .doneFlow
        } else if rating >= settings.highFullnessThreshold {
            state = .highFullnessUnlock
        } else {
            state = .waitingForPrompt
            scheduleNextPrompt(in: interval)
        }
    }
    
    // MARK: - Ignore Prompt
    
    func ignorePrompt() {
        let delay = settings.socialMode
            ? settings.ignoredPromptRepromptSec * 3
            : settings.ignoredPromptRepromptSec
        state = .waitingForPrompt
        scheduleNextPrompt(in: delay)
    }
    
    // MARK: - Unlock
    
    func attemptUnlock(input: String? = nil) -> Bool {
        switch settings.unlockMethod {
        case .tap:
            grantUnlockWindow()
            return true
        case .hold:
            grantUnlockWindow()
            return true
        case .typeCode:
            if input?.uppercased() == settings.unlockCode.uppercased() {
                grantUnlockWindow()
                return true
            }
            return false
        }
    }
    
    private func grantUnlockWindow() {
        state = .waitingForPrompt
        scheduleNextPrompt(in: settings.unlockWindowSec)
    }
    
    // MARK: - Pause
    
    func startPause() {
        state = .pause
        pauseEndsAt = Date().addingTimeInterval(TimeInterval(settings.doneFlowPauseSec))
        nextPromptAt = nil
    }
    
    func endPause() {
        state = .waitingForInput
        pauseEndsAt = nil
    }
    
    // MARK: - Done Flow
    
    func continueFromDone() {
        state = .highFullnessUnlock
    }
    
    // MARK: - End Meal
    
    func endMeal(summary: FinalSummary? = nil) {
        session?.endedAt = Date()
        session?.status = .ended
        session?.finalSummary = summary
        // TODO: Save to Firestore
        cleanup()
    }
    
    func deleteMeal() {
        // TODO: Delete from Firestore
        cleanup()
    }
    
    private func cleanup() {
        stopTimer()
        session = nil
        state = .idle
        lastFullnessRating = nil
        nextPromptAt = nil
        pauseEndsAt = nil
        elapsedSeconds = 0
        countdownSeconds = 0
    }
    
    // MARK: - Timer
    
    private func scheduleNextPrompt(in seconds: Int) {
        guard seconds > 0 else {
            state = .doneFlow
            return
        }
        nextPromptAt = Date().addingTimeInterval(TimeInterval(seconds))
        countdownSeconds = seconds
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.tick()
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
        
        // Check if prompt time arrived
        if state == .waitingForPrompt, let target = nextPromptAt {
            let remaining = Int(target.timeIntervalSinceNow)
            countdownSeconds = max(0, remaining)
            if remaining <= 0 {
                state = .waitingForInput
                nextPromptAt = nil
                // TODO: Trigger haptic + notification
            }
        }
        
        // Check if pause ended
        if state == .pause, let target = pauseEndsAt {
            let remaining = Int(target.timeIntervalSinceNow)
            countdownSeconds = max(0, remaining)
            if remaining <= 0 {
                endPause()
            }
        }
    }
}
