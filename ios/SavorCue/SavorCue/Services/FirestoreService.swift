import Foundation
import FirebaseFirestore
import FirebaseAuth

/// Handles all Firestore read/write operations, mirroring the web app's data structure.
/// Data lives at: users/{uid}/sessions, users/{uid}/events, users/{uid}/settings/app
class FirestoreService {
    static let shared = FirestoreService()
    private let db = Firestore.firestore()
    
    private var uid: String? {
        Auth.auth().currentUser?.uid
    }
    
    // MARK: - Settings
    
    func loadSettings() async -> AppSettings {
        guard let uid else { return .default }
        do {
            let doc = try await db.collection("users").document(uid).collection("settings").document("app").getDocument()
            if let data = doc.data() {
                return decodeSettings(data)
            }
        } catch {
            print("FirestoreService: Failed to load settings: \(error)")
        }
        return .default
    }
    
    func saveSettings(_ settings: AppSettings) async {
        guard let uid else { return }
        do {
            try await db.collection("users").document(uid).collection("settings").document("app").setData(encodeSettings(settings))
        } catch {
            print("FirestoreService: Failed to save settings: \(error)")
        }
    }
    
    // MARK: - Sessions
    
    func saveSession(_ session: MealSession) async {
        guard let uid else { return }
        do {
            let data = try JSONEncoder().encode(session)
            let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
            try await db.collection("users").document(uid).collection("sessions").document(session.id).setData(dict)
        } catch {
            print("FirestoreService: Failed to save session: \(error)")
        }
    }
    
    func deleteSession(_ sessionId: String) async {
        guard let uid else { return }
        do {
            try await db.collection("users").document(uid).collection("sessions").document(sessionId).delete()
            // Delete events for this session
            let events = try await db.collection("users").document(uid).collection("events")
                .whereField("sessionId", isEqualTo: sessionId).getDocuments()
            for doc in events.documents {
                try await doc.reference.delete()
            }
        } catch {
            print("FirestoreService: Failed to delete session: \(error)")
        }
    }
    
    func deleteSessionThrowing(_ sessionId: String) async throws {
        guard let uid else { return }
        try await db.collection("users").document(uid).collection("sessions").document(sessionId).delete()
        let events = try await db.collection("users").document(uid).collection("events")
            .whereField("sessionId", isEqualTo: sessionId).getDocuments()
        for doc in events.documents {
            try await doc.reference.delete()
        }
    }
    
    func getAllSessions() async -> [MealSession] {
        guard let uid else { return [] }
        do {
            let snap = try await db.collection("users").document(uid).collection("sessions")
                .order(by: "startedAt", descending: true).getDocuments()
            return snap.documents.compactMap { doc in
                decodeSession(doc.data())
            }
        } catch {
            print("FirestoreService: Failed to load sessions: \(error)")
            return []
        }
    }
    
    // MARK: - Events
    
    func saveEvent(_ event: MealEvent) async {
        guard let uid else { return }
        do {
            let data = try JSONEncoder().encode(event)
            let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
            try await db.collection("users").document(uid).collection("events").document(event.id).setData(dict)
        } catch {
            print("FirestoreService: Failed to save event: \(error)")
        }
    }
    
    func getEventsForSession(_ sessionId: String) async -> [MealEvent] {
        guard let uid else { return [] }
        do {
            let snap = try await db.collection("users").document(uid).collection("events")
                .whereField("sessionId", isEqualTo: sessionId)
                .order(by: "ts").getDocuments()
            return snap.documents.compactMap { doc in
                decodeEvent(doc.data())
            }
        } catch {
            print("FirestoreService: Failed to load events: \(error)")
            return []
        }
    }
    
    // MARK: - Push Token
    
    func saveAPNsToken(_ token: String) async {
        guard let uid else { return }
        do {
            try await db.collection("users").document(uid).setData([
                "apnsToken": token,
                "platform": "ios",
                "updatedAt": FieldValue.serverTimestamp()
            ], merge: true)
        } catch {
            print("FirestoreService: Failed to save APNs token: \(error)")
        }
    }
    
    // MARK: - Scheduled Notifications
    
    func scheduleNotification(sessionId: String, delaySec: Int, ntfyTopic: String?) async {
        guard let uid else { return }
        let sendAt = Date().addingTimeInterval(TimeInterval(delaySec))
        do {
            try await db.collection("scheduledNotifications").addDocument(data: [
                "uid": uid,
                "sessionId": sessionId,
                "sendAt": Timestamp(date: sendAt),
                "sent": false,
                "attempt": 0,
                "ntfyTopic": ntfyTopic ?? NSNull(),
                "createdAt": FieldValue.serverTimestamp()
            ])
        } catch {
            print("FirestoreService: Failed to schedule notification: \(error)")
        }
    }
    
    func cancelNotifications(sessionId: String) async {
        guard let uid else { return }
        do {
            let snap = try await db.collection("scheduledNotifications")
                .whereField("uid", isEqualTo: uid)
                .whereField("sessionId", isEqualTo: sessionId)
                .whereField("sent", isEqualTo: false)
                .getDocuments()
            for doc in snap.documents {
                try await doc.reference.delete()
            }
        } catch {
            print("FirestoreService: Failed to cancel notifications: \(error)")
        }
    }
    
    // MARK: - Encoding/Decoding Helpers
    
    private func encodeSettings(_ s: AppSettings) -> [String: Any] {
        var dict: [String: Any] = [
            "promptScheduleByRating": s.promptScheduleByRating,
            "highFullnessThreshold": s.highFullnessThreshold,
            "doneThreshold": s.doneThreshold,
            "unlockMethod": s.unlockMethod.rawValue,
            "unlockCode": s.unlockCode,
            "unlockWindowSec": s.unlockWindowSec,
            "doneFlowPauseSec": s.doneFlowPauseSec,
            "ignoredPromptRepromptSec": s.ignoredPromptRepromptSec,
            "socialMode": s.socialMode,
        ]
        if let topic = s.ntfyTopic { dict["ntfyTopic"] = topic }
        return dict
    }
    
    private func decodeSettings(_ data: [String: Any]) -> AppSettings {
        AppSettings(
            promptScheduleByRating: data["promptScheduleByRating"] as? [String: Int] ?? AppSettings.default.promptScheduleByRating,
            highFullnessThreshold: data["highFullnessThreshold"] as? Int ?? 7,
            doneThreshold: data["doneThreshold"] as? Int ?? 9,
            unlockMethod: UnlockMethod(rawValue: data["unlockMethod"] as? String ?? "type_code") ?? .typeCode,
            unlockCode: data["unlockCode"] as? String ?? "MORE",
            unlockWindowSec: data["unlockWindowSec"] as? Int ?? 60,
            doneFlowPauseSec: data["doneFlowPauseSec"] as? Int ?? 120,
            ignoredPromptRepromptSec: data["ignoredPromptRepromptSec"] as? Int ?? 10,
            socialMode: data["socialMode"] as? Bool ?? false,
            ntfyTopic: data["ntfyTopic"] as? String
        )
    }
    
    private func decodeSession(_ data: [String: Any]) -> MealSession? {
        guard let id = data["id"] as? String,
              let startedAt = data["startedAt"] as? String,
              let statusRaw = data["status"] as? String,
              let status = SessionStatus(rawValue: statusRaw) else { return nil }
        
        let mode = MealMode(rawValue: data["mode"] as? String ?? "quick") ?? .quick
        let startDate = ISO8601DateFormatter().date(from: startedAt) ?? Date()
        let endDate = (data["endedAt"] as? String).flatMap { ISO8601DateFormatter().date(from: $0) }
        
        var context: MealContext?
        if let ctx = data["context"] as? [String: Any] {
            context = MealContext(
                location: ctx["location"] as? String,
                social: ctx["social"] as? String,
                mealType: ctx["mealType"] as? String,
                mealSource: ctx["mealSource"] as? String,
                hungerBefore: ctx["hungerBefore"] as? Int,
                healthyIndulgent: ctx["healthyIndulgent"] as? String,
                alcohol: ctx["alcohol"] as? Bool
            )
        }
        
        var summary: FinalSummary?
        if let sum = data["finalSummary"] as? [String: Any] {
            summary = FinalSummary(
                finalFullness: sum["finalFullness"] as? Int,
                feelingAfter: sum["feelingAfter"] as? Int,
                overshot: sum["overshot"] as? Bool,
                discomfort: sum["discomfort"] as? Int,
                amountLeft: sum["amountLeft"] as? String,
                note: sum["note"] as? String
            )
        }
        
        return MealSession(id: id, startedAt: startDate, endedAt: endDate, mode: mode, context: context, finalSummary: summary, status: status)
    }
    
    private func decodeEvent(_ data: [String: Any]) -> MealEvent? {
        guard let id = data["id"] as? String,
              let sessionId = data["sessionId"] as? String,
              let tsStr = data["ts"] as? String,
              let typeRaw = data["type"] as? String,
              let type = MealEventType(rawValue: typeRaw) else { return nil }
        let ts = ISO8601DateFormatter().date(from: tsStr) ?? Date()
        return MealEvent(
            id: id, sessionId: sessionId, ts: ts, type: type,
            fullnessRating: data["fullnessRating"] as? Int,
            nextIntervalSec: data["nextIntervalSec"] as? Int,
            responseDelayMs: data["responseDelayMs"] as? Int
        )
    }
}
