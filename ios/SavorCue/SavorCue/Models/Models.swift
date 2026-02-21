import Foundation

// MARK: - Session

enum MealMode: String, Codable {
    case quick, restaurant, snack, social, custom
}

enum SessionStatus: String, Codable {
    case active, paused, ended, abandoned
}

struct MealContext: Codable {
    var location: String?
    var social: String?
    var mealType: String?
    var mealSource: String?
    var hungerBefore: Int?
    var healthyIndulgent: String?
    var alcohol: Bool?
}

struct FinalSummary: Codable {
    var finalFullness: Int?
    var feelingAfter: Int?
    var overshot: Bool?
    var discomfort: Int?
    var amountLeft: String?
    var note: String?
}

struct MealSession: Codable, Identifiable {
    let id: String
    let startedAt: Date
    var endedAt: Date?
    var mode: MealMode
    var context: MealContext?
    var finalSummary: FinalSummary?
    var status: SessionStatus
}

// MARK: - Events

enum MealEventType: String, Codable {
    case sessionStarted = "session_started"
    case promptShown = "prompt_shown"
    case fullnessRated = "fullness_rated"
    case promptIgnored = "prompt_ignored"
    case unlockPromptShown = "unlock_prompt_shown"
    case unlockAttempt = "unlock_attempt"
    case unlockSuccess = "unlock_success"
    case unlockDenied = "unlock_denied"
    case pauseStarted = "pause_started"
    case pauseEnded = "pause_ended"
    case doneFlowShown = "done_flow_shown"
    case overeatingReasonSelected = "overeating_reason_selected"
    case sessionEnded = "session_ended"
    case settingsApplied = "settings_applied"
}

struct MealEvent: Codable, Identifiable {
    let id: String
    let sessionId: String
    let ts: Date
    let type: MealEventType
    var fullnessRating: Int?
    var nextIntervalSec: Int?
    var responseDelayMs: Int?
    var overeatingReason: String?
}

// MARK: - Settings

enum UnlockMethod: String, Codable {
    case tap, hold, typeCode = "type_code"
}

struct AppSettings: Codable {
    var promptScheduleByRating: [String: Int]
    var highFullnessThreshold: Int
    var doneThreshold: Int
    var unlockMethod: UnlockMethod
    var unlockCode: String
    var unlockWindowSec: Int
    var doneFlowPauseSec: Int
    var ignoredPromptRepromptSec: Int
    var socialMode: Bool
    var ntfyTopic: String?
    
    static let `default` = AppSettings(
        promptScheduleByRating: [
            "0": 300, "1": 300, "2": 300, "3": 240, "4": 180,
            "5": 150, "6": 120, "7": 60, "8": 45, "9": 0, "10": 0
        ],
        highFullnessThreshold: 7,
        doneThreshold: 9,
        unlockMethod: .typeCode,
        unlockCode: "MORE",
        unlockWindowSec: 60,
        doneFlowPauseSec: 120,
        ignoredPromptRepromptSec: 10,
        socialMode: false,
        ntfyTopic: nil
    )
    
    func intervalForRating(_ rating: Int) -> Int {
        promptScheduleByRating[String(rating)] ?? 300
    }
}

// MARK: - Session State

enum SessionState: String {
    case idle
    case preMeal = "pre_meal"
    case waitingForPrompt = "active_waiting_for_prompt_time"
    case waitingForInput = "active_waiting_for_fullness_input"
    case highFullnessUnlock = "active_high_fullness_unlock"
    case pause
    case doneFlow = "done_flow"
    case ended
}
