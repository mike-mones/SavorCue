import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var mealVM: MealViewModel
    
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("History")
                        .font(.appTitle)
                        .foregroundColor(.appTextPrimary)
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    
                    if mealVM.allSessions.isEmpty {
                        VStack(spacing: 8) {
                            Text("No meals tracked yet")
                                .font(.system(size: 16))
                                .foregroundColor(.appTextSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                    } else {
                        ForEach(mealVM.allSessions) { session in
                            SessionCard(session: session) {
                                mealVM.deleteSession(session.id)
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                }
                .padding(.bottom, 100)
            }
        }
    }
}

struct SessionCard: View {
    let session: MealSession
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(session.startedAt, style: .date)
                    .font(.system(size: 13))
                    .foregroundColor(.appTextSecondary)
                Text(session.startedAt, style: .time)
                    .font(.system(size: 13))
                    .foregroundColor(.appTextSecondary)
                Spacer()
                Text(session.status.rawValue)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(session.status == .ended ? .appAccent : .appTextTertiary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(session.status == .ended ? Color.appAccent.opacity(0.1) : Color.appChip)
                    .cornerRadius(8)
            }
            
            HStack {
                Text(session.mode.rawValue.capitalized)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextPrimary)
                Spacer()
                if let end = session.endedAt {
                    let mins = Int(end.timeIntervalSince(session.startedAt) / 60)
                    Text("\(mins) min")
                        .font(.system(size: 13))
                        .foregroundColor(.appTextSecondary)
                }
            }
            
            if let fullness = session.finalSummary?.finalFullness {
                HStack(spacing: 4) {
                    Text("Fullness: \(fullness)/10")
                        .font(.system(size: 13))
                        .foregroundColor(.appTextSecondary)
                    if session.finalSummary?.overshot == true {
                        Text("overshot")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.orange)
                    }
                }
            }
            
            HStack {
                Spacer()
                Button("Delete") { onDelete() }
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.appDanger)
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 3, y: 1)
    }
}
