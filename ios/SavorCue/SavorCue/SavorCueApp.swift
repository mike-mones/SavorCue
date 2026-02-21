import SwiftUI
import FirebaseCore
import FirebaseMessaging
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, MessagingDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        FirebaseApp.configure()
        
        // Set up notifications
        NotificationManager.shared.setupCategories()
        Messaging.messaging().delegate = self
        WatchConnectivityManager.shared.activate()
        
        // Request notification permission
        Task {
            let granted = await NotificationManager.shared.requestPermission()
            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
        
        return true
    }
    
    // APNs token received
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        Task {
            await FirestoreService.shared.saveAPNsToken(token)
        }
    }
    
    // FCM token received
    nonisolated func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let fcmToken else { return }
        print("FCM Token: \(fcmToken)")
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
                        .task {
                            await mealVM.loadData()
                        }
                        .onReceive(NotificationCenter.default.publisher(for: .init("SavorCueQuickRate"))) { notification in
                            if let rating = notification.userInfo?["rating"] as? Int {
                                mealVM.rateFullness(rating)
                            }
                        }
                        .onReceive(NotificationCenter.default.publisher(for: .init("SavorCueWatchEndMeal"))) { _ in
                            mealVM.endMeal()
                        }
                        .onReceive(NotificationCenter.default.publisher(for: .init("SavorCueStartPause"))) { _ in
                            if mealVM.state == .doneFlow {
                                mealVM.startPause()
                            }
                        }
                        .onReceive(NotificationCenter.default.publisher(for: .init("SavorCueContinueEating"))) { _ in
                            if mealVM.state == .doneFlow {
                                mealVM.continueFromDone()
                            }
                        }
                }
            }
            .environmentObject(mealVM)
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
