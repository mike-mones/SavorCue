import Foundation
import WatchConnectivity

final class WatchSessionManager: NSObject, ObservableObject {
    @Published var mealState: String = "idle"
    @Published var elapsedSeconds: Int = 0
    @Published var countdownSeconds: Int = 0
    @Published var lastFullnessRating: Int? = nil

    static let shared = WatchSessionManager()

    private override init() {
        super.init()
        activate()
    }

    func activate() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    func sendRating(_ rating: Int) {
        guard WCSession.default.isReachable else { return }
        WCSession.default.sendMessage([
            "type": "rate_fullness",
            "rating": rating,
        ], replyHandler: nil, errorHandler: nil)
    }

    func sendEndMeal() {
        guard WCSession.default.isReachable else { return }
        WCSession.default.sendMessage([
            "type": "end_meal",
        ], replyHandler: nil, errorHandler: nil)
    }
}

extension WatchSessionManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: (any Error)?) {}

    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        applyMessage(message)
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        applyMessage(applicationContext)
    }

    private func applyMessage(_ message: [String: Any]) {
        guard let type = message["type"] as? String, type == "meal_state" else { return }
        DispatchQueue.main.async {
            self.mealState = message["state"] as? String ?? "idle"
            self.elapsedSeconds = message["elapsedSeconds"] as? Int ?? 0
            self.countdownSeconds = message["countdownSeconds"] as? Int ?? 0
            self.lastFullnessRating = message["lastFullnessRating"] as? Int
        }
    }
}
