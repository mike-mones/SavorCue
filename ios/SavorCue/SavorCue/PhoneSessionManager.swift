import Foundation
import Combine
import WatchConnectivity

/// Manages WatchConnectivity on the iPhone side.
/// Pushes meal state to the Watch and handles incoming actions (rate fullness, end meal).
final class PhoneSessionManager: NSObject, ObservableObject {
    static let shared = PhoneSessionManager()

    private weak var mealVM: MealViewModel?
    private var cancellables = Set<AnyCancellable>()

    private override init() {
        super.init()
    }

    /// Call once at app startup to wire up the session with the meal view model.
    func configure(mealVM: MealViewModel) {
        self.mealVM = mealVM
        activate()
        observeMealVM(mealVM)
    }

    // MARK: - Activation

    private func activate() {
        guard WCSession.isSupported() else {
            print("[WatchSync] WCSession not supported on this device")
            return
        }
        // WCSession delegate and activation are managed centrally (e.g., by WatchConnectivityManager).
        // This manager assumes the session is already active and configured elsewhere.
    }

    // MARK: - Observe MealViewModel

    private func observeMealVM(_ vm: MealViewModel) {
        vm.objectWillChange
            .sink { [weak self] _ in
                // objectWillChange fires before the change, so delay one tick
                DispatchQueue.main.async { self?.pushMealState() }
            }
            .store(in: &cancellables)
    }

    // MARK: - Push state to Watch

    func pushMealState() {
        guard let vm = mealVM else { return }

        let session = WCSession.default
        guard session.activationState == .activated else {
            print("[WatchSync] Session not yet activated — skipping push")
            return
        }

        var payload: [String: Any] = [
            "type": "meal_state",
            "state": vm.state.rawValue,
            "elapsedSeconds": vm.elapsedSeconds,
            "countdownSeconds": vm.countdownSeconds,
        ]
        if let rating = vm.lastFullnessRating {
            payload["lastFullnessRating"] = rating
        }

        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { [weak self] error in
                print("[WatchSync] sendMessage failed: \(error.localizedDescription) — falling back to application context")
                self?.updateContext(payload)
            }
        } else {
            updateContext(payload)
        }
    }

    private func updateContext(_ payload: [String: Any]) {
        do {
            try WCSession.default.updateApplicationContext(payload)
        } catch {
            print("[WatchSync] updateApplicationContext failed: \(error.localizedDescription)")
        }
    }

    // MARK: - Handle Watch messages

    private func handleMessage(_ message: [String: Any]) {
        guard let type = message["type"] as? String else { return }
        print("[WatchSync] Received message from Watch — type: \(type)")

        DispatchQueue.main.async { [weak self] in
            guard let self, let vm = self.mealVM else { return }
            switch type {
            case "rate_fullness":
                if let rating = message["rating"] as? Int {
                    vm.rateFullness(rating)
                } else {
                    print("[WatchSync] rate_fullness missing rating value")
                }
            case "end_meal":
                vm.endMeal()
            default:
                print("[WatchSync] Unknown message type from Watch: \(type)")
            }
        }
    }
}

// MARK: - WCSessionDelegate

extension PhoneSessionManager: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: (any Error)?
    ) {
        if let error {
            print("[WatchSync] Activation failed: \(error.localizedDescription)")
        } else {
            print("[WatchSync] Session activated — state: \(activationState.rawValue)")
            pushMealState()
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {
        print("[WatchSync] Session became inactive")
    }

    func sessionDidDeactivate(_ session: WCSession) {
        print("[WatchSync] Session deactivated — reactivating")
        WCSession.default.activate()
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleMessage(message)
    }

    func session(
        _ session: WCSession,
        didReceiveMessage message: [String: Any],
        replyHandler: @escaping ([String: Any]) -> Void
    ) {
        handleMessage(message)
        replyHandler(["status": "ok"])
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        handleMessage(userInfo)
    }
}
