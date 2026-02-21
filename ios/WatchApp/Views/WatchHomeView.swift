import SwiftUI
import WatchKit

struct WatchHomeView: View {
    @StateObject private var session = WatchSessionManager.shared
    @State private var fullness: Double = 5
    
    var body: some View {
        if session.mealState != "idle" {
            WatchMealView(
                fullness: $fullness,
                mealState: session.mealState,
                elapsed: session.elapsedSeconds,
                countdown: session.countdownSeconds,
                lastRating: session.lastFullnessRating,
                onEnd: { session.sendEndMeal() },
                onRate: { rating in
                    session.sendRating(rating)
                    // Haptic confirmation
                    WKInterfaceDevice.current().play(.success)
                }
            )
        } else {
            VStack(spacing: 16) {
                Text("SavorCue")
                    .font(.headline)
                    .foregroundColor(.teal)

                Text("Start a meal on iPhone")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct WatchMealView: View {
    @Binding var fullness: Double
    let mealState: String
    let elapsed: Int
    let countdown: Int
    let lastRating: Int?
    let onEnd: () -> Void
    let onRate: (Int) -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Timer
                Text(formatTime(elapsed))
                    .font(.system(size: 22, weight: .heavy, design: .monospaced))
                    .foregroundColor(.white)

                if mealState == "active_waiting_for_prompt_time" {
                    Text("Next check-in")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(formatTime(countdown))
                        .font(.system(size: 16, weight: .bold, design: .monospaced))
                        .foregroundColor(.teal)
                }
                
                if mealState == "active_waiting_for_fullness_input" {
                    // Fullness prompt
                    Text("How full?")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.teal)
                    
                    Text("\(Int(fullness))")
                        .font(.system(size: 36, weight: .heavy))
                        .foregroundColor(fullnessColor(Int(fullness)))
                    
                    Slider(value: $fullness, in: 0...10, step: 1)
                        .tint(fullnessColor(Int(fullness)))
                    
                    Button("Submit") {
                        onRate(Int(fullness))
                    }
                    .tint(.teal)
                    .font(.system(size: 14, weight: .bold))
                } else {
                    Text(lastRating == nil ? "Eating..." : "Last: \(lastRating!)/10")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                
                Divider()
                
                Button("End Meal") { onEnd() }
                    .tint(.red)
                    .font(.system(size: 12))
            }
            .padding(.horizontal, 4)
        }
    }
    
    func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
    
    func fullnessColor(_ v: Int) -> Color {
        switch v {
        case 0...2: return .teal
        case 3...4: return .green
        case 5: return .yellow
        case 6...7: return .orange
        default: return .red
        }
    }
}

// MARK: - Watch Haptic Manager

class WatchHapticManager {
    static let shared = WatchHapticManager()
    
    /// Escalating haptic patterns based on attempt number
    func triggerEscalatingHaptic(attempt: Int) {
        switch attempt {
        case 0:
            // Single gentle tap
            WKInterfaceDevice.current().play(.notification)
        case 1:
            // Double tap
            WKInterfaceDevice.current().play(.notification)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                WKInterfaceDevice.current().play(.notification)
            }
        case 2:
            // Triple strong tap
            WKInterfaceDevice.current().play(.directionUp)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                WKInterfaceDevice.current().play(.directionUp)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                WKInterfaceDevice.current().play(.directionUp)
            }
        default:
            // Aggressive repeated tapping
            for i in 0..<5 {
                DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.15) {
                    WKInterfaceDevice.current().play(.retry)
                }
            }
        }
    }
}
