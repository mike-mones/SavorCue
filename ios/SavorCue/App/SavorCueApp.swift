import SwiftUI
import FirebaseCore

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        FirebaseApp.configure()
        return true
    }
}

@main
struct SavorCueApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
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
            .onAppear {
                PhoneSessionManager.shared.configure(mealVM: mealVM)
            }
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
