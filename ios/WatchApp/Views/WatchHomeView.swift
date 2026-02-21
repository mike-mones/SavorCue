import SwiftUI
import WatchKit

struct WatchHomeView: View {
    @State private var fullness: Double = 5
    @State private var isInMeal = false
    @State private var elapsed = 0
    @State private var showingPrompt = false
    @State private var timer: Timer?
    
    var body: some View {
        if isInMeal {
            WatchMealView(
                fullness: $fullness,
                elapsed: $elapsed,
                showingPrompt: $showingPrompt,
                onEnd: { isInMeal = false; timer?.invalidate() },
                onRate: { rating in
                    showingPrompt = false
                    // Haptic confirmation
                    WKInterfaceDevice.current().play(.success)
                }
            )
        } else {
            VStack(spacing: 16) {
                Text("SavorCue")
                    .font(.headline)
                    .foregroundColor(.teal)
                
                Button {
                    isInMeal = true
                    elapsed = 0
                    showingPrompt = false
                    startTimer()
                } label: {
                    Label("Start Meal", systemImage: "play.fill")
                        .font(.system(size: 14, weight: .semibold))
                }
                .tint(.teal)
            }
        }
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            elapsed += 1
        }
    }
}

struct WatchMealView: View {
    @Binding var fullness: Double
    @Binding var elapsed: Int
    @Binding var showingPrompt: Bool
    let onEnd: () -> Void
    let onRate: (Int) -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Timer
                Text(formatTime(elapsed))
                    .font(.system(size: 22, weight: .heavy, design: .monospaced))
                    .foregroundColor(.white)
                
                if showingPrompt {
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
                    Text("Eating...")
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
