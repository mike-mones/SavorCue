import SwiftUI

struct WatchHomeView: View {
    @State private var fullness: Double = 5
    @State private var isInMeal = false
    @State private var elapsed = 0
    
    var body: some View {
        if isInMeal {
            WatchMealView(fullness: $fullness, elapsed: $elapsed, onEnd: { isInMeal = false })
        } else {
            VStack(spacing: 12) {
                Text("SavorCue")
                    .font(.headline)
                    .foregroundColor(.teal)
                
                Button {
                    isInMeal = true
                } label: {
                    Label("Start Meal", systemImage: "play.fill")
                        .font(.system(size: 14, weight: .semibold))
                }
                .tint(.teal)
            }
        }
    }
}

struct WatchMealView: View {
    @Binding var fullness: Double
    @Binding var elapsed: Int
    let onEnd: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Elapsed time
                Text(formatTime(elapsed))
                    .font(.system(size: 24, weight: .heavy, design: .monospaced))
                
                // Fullness slider
                VStack(spacing: 4) {
                    Text("Fullness")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Text("\(Int(fullness))")
                        .font(.system(size: 32, weight: .heavy))
                        .foregroundColor(.teal)
                    
                    Slider(value: $fullness, in: 0...10, step: 1)
                        .tint(.teal)
                }
                
                // Submit button
                Button("Submit") {
                    // Send rating via WC session
                    WKInterfaceDevice.current().play(.success)
                }
                .tint(.teal)
                
                Button("End Meal") {
                    onEnd()
                }
                .tint(.red)
                .font(.caption)
            }
        }
    }
    
    func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}
