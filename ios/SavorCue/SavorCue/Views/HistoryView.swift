import SwiftUI

struct HistoryView: View {
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("History")
                        .font(.appTitle)
                        .foregroundColor(.appTextPrimary)
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    
                    VStack(spacing: 8) {
                        Text("No meals tracked yet")
                            .font(.system(size: 16))
                            .foregroundColor(.appTextSecondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
                }
                .padding(.bottom, 100)
            }
        }
    }
}
