import SwiftUI

struct SettingsView: View {
    @ObservedObject var mealVM: MealViewModel
    
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Settings")
                        .font(.appTitle)
                        .foregroundColor(.appTextPrimary)
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    
                    Text("Settings will be synced from your web app.")
                        .font(.system(size: 14))
                        .foregroundColor(.appTextSecondary)
                        .padding(.horizontal, 20)
                }
                .padding(.bottom, 100)
            }
        }
    }
}
