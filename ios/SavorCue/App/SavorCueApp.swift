import SwiftUI

@main
struct SavorCueApp: App {
    @StateObject private var authVM = AuthViewModel()
    @StateObject private var mealVM = MealViewModel()
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authVM.isLoading {
                    LoadingView()
                } else if authVM.user == nil {
                    LoginView(authVM: authVM)
                } else {
                    MainTabView(mealVM: mealVM, authVM: authVM)
                }
            }
            .preferredColorScheme(.light)
        }
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            ProgressView()
                .tint(.appAccent)
        }
    }
}
