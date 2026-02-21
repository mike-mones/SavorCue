import SwiftUI

struct LoginView: View {
    @ObservedObject var authVM: AuthViewModel
    @State private var isSigningIn = false
    
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            VStack(spacing: 0) {
                Spacer()
                
                // Logo
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.appAccent)
                    .frame(width: 64, height: 64)
                    .overlay(
                        Image(systemName: "clock")
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundColor(.white)
                    )
                    .padding(.bottom, 20)
                
                Text("SavorCue")
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundColor(.appTextPrimary)
                
                Text("Mindful meal pacing")
                    .font(.system(size: 14))
                    .foregroundColor(.appTextSecondary)
                    .padding(.bottom, 40)
                
                // Google sign-in button
                Button {
                    isSigningIn = true
                    Task {
                        await authVM.signInWithGoogle()
                        isSigningIn = false
                    }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "person.circle")
                            .font(.system(size: 18))
                        Text(isSigningIn ? "Signing in..." : "Sign in with Google")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundColor(.appTextPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.appCard)
                    .cornerRadius(16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.appChip, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
                }
                .padding(.horizontal, 32)
                .disabled(isSigningIn)
                
                Spacer()
                
                Text("Sign in to sync your meals across devices.")
                    .font(.system(size: 12))
                    .foregroundColor(.appTextTertiary)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 40)
            }
        }
        .alert("Sign-in failed", isPresented: Binding(get: {
            authVM.authErrorMessage != nil
        }, set: { _ in
            authVM.authErrorMessage = nil
        })) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(authVM.authErrorMessage ?? "Unknown error")
        }
    }
}
