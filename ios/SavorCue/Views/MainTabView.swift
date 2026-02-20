import SwiftUI

struct MainTabView: View {
    @ObservedObject var mealVM: MealViewModel
    @ObservedObject var authVM: AuthViewModel
    @State private var selectedTab = 0
    
    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                InsightsView(mealVM: mealVM)
                    .tag(0)
                HistoryView()
                    .tag(1)
                Color.clear // Placeholder for center button
                    .tag(2)
                SettingsView(mealVM: mealVM)
                    .tag(3)
                ProfileView(authVM: authVM)
                    .tag(4)
            }
            .tabViewStyle(.automatic)
            
            // Custom tab bar
            HStack(spacing: 0) {
                TabButton(icon: "chart.bar", label: "Insights", isActive: selectedTab == 0) { selectedTab = 0 }
                TabButton(icon: "clock.arrow.circlepath", label: "History", isActive: selectedTab == 1) { selectedTab = 1 }
                
                // Center play button
                Button {
                    selectedTab = 2
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color.appAccent)
                            .frame(width: 48, height: 48)
                            .shadow(color: .appAccent.opacity(0.35), radius: 10, y: 4)
                        
                        Image(systemName: "play.fill")
                            .font(.system(size: 18))
                            .foregroundColor(.white)
                            .offset(x: 1)
                    }
                }
                .offset(y: -10)
                
                TabButton(icon: "gearshape", label: "Settings", isActive: selectedTab == 3) { selectedTab = 3 }
                TabButton(icon: "person", label: "Profile", isActive: selectedTab == 4) { selectedTab = 4 }
            }
            .padding(.horizontal, 8)
            .padding(.top, 8)
            .padding(.bottom, 4)
            .background(
                Color.white
                    .shadow(color: .black.opacity(0.06), radius: 12, y: -1)
                    .ignoresSafeArea()
            )
        }
        .sheet(isPresented: Binding(
            get: { selectedTab == 2 },
            set: { if !$0 { selectedTab = 0 } }
        )) {
            NewMealView(mealVM: mealVM, onStart: { selectedTab = 0 })
        }
        .fullScreenCover(isPresented: Binding(
            get: { mealVM.state != .idle },
            set: { _ in }
        )) {
            ActiveMealView(mealVM: mealVM)
        }
    }
}

struct TabButton: View {
    let icon: String
    let label: String
    let isActive: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: isActive ? .semibold : .regular))
                Text(label)
                    .font(.system(size: 10, weight: isActive ? .bold : .medium))
            }
            .foregroundColor(isActive ? .appAccent : .appTextTertiary)
            .frame(maxWidth: .infinity)
        }
    }
}
