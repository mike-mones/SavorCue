import SwiftUI

struct InsightsView: View {
    @ObservedObject var mealVM: MealViewModel
    
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
                }
                .padding(.bottom, 100)
            }
        }
    }
}
