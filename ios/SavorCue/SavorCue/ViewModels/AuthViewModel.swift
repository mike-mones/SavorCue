import SwiftUI
import Combine
import FirebaseAuth

@MainActor
class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = true
    @Published var authErrorMessage: String?
    
    private var handle: AuthStateDidChangeListenerHandle?
    
    init() {
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.user = user
            self?.isLoading = false
        }
    }
    
    func signInWithGoogle() async {
        do {
            let provider = OAuthProvider(providerID: "google.com")
            let credential = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<AuthCredential, Error>) in
                provider.getCredentialWith(nil) { credential, error in
                    if let error {
                        continuation.resume(throwing: error)
                        return
                    }
                    guard let credential else {
                        continuation.resume(throwing: NSError(domain: "SavorCueAuth", code: -1, userInfo: [NSLocalizedDescriptionKey: "No credential returned from Google sign-in."]))
                        return
                    }
                    continuation.resume(returning: credential)
                }
            }

            _ = try await Auth.auth().signIn(with: credential)
            authErrorMessage = nil
        } catch {
            authErrorMessage = error.localizedDescription
        }
    }
    
    func signOut() {
        try? Auth.auth().signOut()
    }
    
    deinit {
        if let handle { Auth.auth().removeStateDidChangeListener(handle) }
    }
}
