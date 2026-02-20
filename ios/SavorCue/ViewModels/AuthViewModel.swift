import SwiftUI
import FirebaseAuth

@MainActor
class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = true
    
    private var handle: AuthStateDidChangeListenerHandle?
    
    init() {
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.user = user
            self?.isLoading = false
        }
    }
    
    func signInWithGoogle() async throws {
        // Google Sign-In implementation will go here
        // Requires GoogleSignIn SDK
    }
    
    func signOut() {
        try? Auth.auth().signOut()
    }
    
    deinit {
        if let handle { Auth.auth().removeStateDidChangeListener(handle) }
    }
}
