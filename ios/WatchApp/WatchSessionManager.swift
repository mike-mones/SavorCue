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
        let session = WCSession.default
        guard session.activationState == .activated else {
            print("[WatchSync] Cannot send rating — session not activated")
            return
        }
        let message: [String: Any] = ["type": "rate_fullness", "rating": rating]
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("[WatchSync] sendRating failed: \(error.localizedDescription) — falling back to transferUserInfo")
                session.transferUserInfo(message)
            }
        } else {
            print("[WatchSync] iPhone not reachable — using transferUserInfo for rating")
            session.transferUserInfo(message)
        }
    }

    func sendEndMeal() {
        let session = WCSession.default
        guard session.activationState == .activated else {
            print("[WatchSync] Cannot send end_meal — session not activated")
            return
        }
        let message: [String: Any] = ["type": "end_meal"]
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                print("[WatchSync] sendEndMeal failed: \(error.localizedDescription) — falling back to transferUserInfo")
                session.transferUserInfo(message)
            }
        } else {
            print("[WatchSync] iPhone not reachable — using transferUserInfo for end_meal")
            session.transferUserInfo(message)
        }
    }
}

extension WatchSessionManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: (any Error)?) {
        if let error {
            print("[WatchSync] Activation failed: \(error.localizedDescription)")
        } else {
            print("[WatchSync] Watch session activated — state: \(activationState.rawValue)")
        }
    }

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
