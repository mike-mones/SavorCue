import SwiftUI

struct InsightsView: View {
    @ObservedObject var mealVM: MealViewModel

    private var completedSessions: [MealSession] {
        mealVM.allSessions.filter { $0.status == .ended }
    }

    private var averageFullness: Double? {
        let ratings = completedSessions.compactMap { $0.finalSummary?.finalFullness }
        guard !ratings.isEmpty else { return nil }
        return Double(ratings.reduce(0, +)) / Double(ratings.count)
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Insights")
                        .font(.appTitle)
                        .foregroundColor(.appTextPrimary)
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    
                    if mealVM.allSessions.isEmpty {
                        // Empty state
                        VStack(spacing: 8) {
                            Text("No meals tracked yet")
                                .font(.system(size: 16))
                                .foregroundColor(.appTextSecondary)
                            Text("Start your first meal to see insights!")
                                .font(.system(size: 14))
                                .foregroundColor(.appTextTertiary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                    } else {
                        HStack(spacing: 12) {
                            InsightCard(title: "Total Meals", value: "\(mealVM.allSessions.count)")
                            InsightCard(title: "Completed", value: "\(completedSessions.count)")
                        }
                        .padding(.horizontal, 16)

                        if let avg = averageFullness {
                            InsightCard(title: "Avg Final Fullness", value: String(format: "%.1f / 10", avg))
                                .padding(.horizontal, 16)
                        }
                    }
                }
                .padding(.bottom, 100)
            }
        }
    }
}

struct InsightCard: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.appTextSecondary)
            Text(value)
                .font(.system(size: 28, weight: .heavy))
                .foregroundColor(.appTextPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 3, y: 1)
    }
}
