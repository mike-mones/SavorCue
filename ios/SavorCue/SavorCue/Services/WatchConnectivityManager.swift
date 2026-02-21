import Foundation
import WatchConnectivity

final class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()

    private override init() {
        super.init()
    }

    func activate() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    func sendMealState(
        state: SessionState,
        elapsedSeconds: Int,
        countdownSeconds: Int,
        lastFullnessRating: Int?
    ) {
        guard WCSession.isSupported() else { return }
        let payload: [String: Any] = [
            "type": "meal_state",
            "state": state.rawValue,
            "elapsedSeconds": elapsedSeconds,
            "countdownSeconds": countdownSeconds,
            "lastFullnessRating": lastFullnessRating as Any,
        ]

        let session = WCSession.default
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil, errorHandler: nil)
        } else {
            try? session.updateApplicationContext(payload)
        }
    }
}

extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: (any Error)?) {}

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }

    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        guard let type = message["type"] as? String else { return }

        switch type {
        case "rate_fullness":
            if let rating = message["rating"] as? Int {
                NotificationCenter.default.post(name: .init("SavorCueQuickRate"), object: nil, userInfo: ["rating": rating])
            }
        case "end_meal":
            NotificationCenter.default.post(name: .init("SavorCueWatchEndMeal"), object: nil)
        default:
            break
        }
    }
}
