import SwiftUI

struct ProfileView: View {
    @ObservedObject var authVM: AuthViewModel
    
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            VStack(spacing: 24) {
                Text("Profile")
                    .font(.appTitle)
                    .foregroundColor(.appTextPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                
                if let user = authVM.user {
                    HStack(spacing: 16) {
                        // Photo placeholder
                        Circle()
                            .fill(Color.appAccent.opacity(0.2))
                            .frame(width: 52, height: 52)
                            .overlay(
                                Text(String(user.displayName?.prefix(1) ?? "?"))
                                    .font(.system(size: 20, weight: .bold))
                                    .foregroundColor(.appAccent)
                            )
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(user.displayName ?? "User")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.appTextPrimary)
                            Text(user.email ?? "")
                                .font(.system(size: 13))
                                .foregroundColor(.appTextSecondary)
                        }
                        Spacer()
                    }
                    .padding(24)
                    .background(Color.appCard)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
                    .padding(.horizontal, 20)
                }
                
                Button {
                    authVM.signOut()
                } label: {
                    Text("Sign Out")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.appDanger)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.appCard)
                        .cornerRadius(14)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.appChip, lineWidth: 1))
                }
                .padding(.horizontal, 20)
                
                Spacer()
            }
        }
    }
}
