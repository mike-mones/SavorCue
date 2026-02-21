import SwiftUI

struct ActiveMealView: View {
    @ObservedObject var mealVM: MealViewModel
    @State private var sliderValue: Double = 5
    @State private var unlockInput = ""
    @State private var unlockError = false
    @State private var showEndMeal = false
    
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("ELAPSED")
                            .font(.appCaption)
                            .foregroundColor(.appTextSecondary)
                            .tracking(1)
                        Text(formatTime(mealVM.elapsedSeconds))
                            .font(.appMono)
                            .foregroundColor(.appTextPrimary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("FULLNESS")
                            .font(.appCaption)
                            .foregroundColor(.appTextSecondary)
                            .tracking(1)
                        if let rating = mealVM.lastFullnessRating {
                            Text("\(rating)/10")
                                .font(.appMono)
                                .foregroundColor(Color.fullnessColor(rating))
                        } else {
                            Text("—")
                                .font(.appMono)
                                .foregroundColor(.appChip)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                
                // State badge
                HStack {
                    Spacer()
                    Text(stateLabel)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(stateForeground)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(stateBackground)
                        .cornerRadius(20)
                    Spacer()
                }
                .padding(.top, 12)
                
                Spacer()
                
                // Content based on state
                switch mealVM.state {
                case .waitingForPrompt:
                    countdownView
                case .waitingForInput:
                    fullnessInputView
                case .highFullnessUnlock:
                    unlockView
                case .pause:
                    pauseView
                case .doneFlow:
                    doneFlowView
                default:
                    EmptyView()
                }
                
                Spacer()
                
                // Bottom buttons
                HStack(spacing: 10) {
                    Button {
                        showEndMeal = true
                    } label: {
                        Text("End meal")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Color(red: 90/255, green: 90/255, blue: 90/255))
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(Color.appChip)
                            .cornerRadius(12)
                    }
                    
                    Button {
                        mealVM.deleteMeal()
                    } label: {
                        Text("Delete meal")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.appDanger)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(Color.red.opacity(0.08))
                            .cornerRadius(12)
                    }
                }
                .padding(.bottom, 28)
            }
        }
        .sheet(isPresented: $showEndMeal) {
            EndMealView(mealVM: mealVM)
        }
    }
    
    // MARK: - Subviews
    
    var countdownView: some View {
        VStack(spacing: 4) {
            Text("Next check-in")
                .font(.system(size: 13))
                .foregroundColor(.appTextSecondary)
            Text(formatTime(mealVM.countdownSeconds))
                .font(.system(size: 56, weight: .heavy, design: .monospaced))
                .foregroundColor(.appTextPrimary)
        }
    }
    
    var fullnessInputView: some View {
        VStack(spacing: 16) {
            VStack(spacing: 12) {
                Text("How full are you right now?")
                    .font(.system(size: 16, weight: .semibold))
                
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Text("\(Int(sliderValue))")
                        .font(.system(size: 56, weight: .heavy))
                        .foregroundColor(Color.fullnessColor(Int(sliderValue)))
                }
                
                Slider(value: $sliderValue, in: 0...10, step: 1)
                    .tint(Color.fullnessColor(Int(sliderValue)))
                    .padding(.horizontal, 20)
                
                HStack {
                    Text("Empty"); Spacer(); Text("Neutral"); Spacer(); Text("Stuffed")
                }
                .font(.system(size: 11))
                .foregroundColor(.appTextTertiary)
                .padding(.horizontal, 20)
            }
            .padding(24)
            .background(Color.appCard)
            .cornerRadius(20)
            .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
            .padding(.horizontal, 20)
            
            Button {
                mealVM.rateFullness(Int(sliderValue))
            } label: {
                Text("Submit")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.appAccent)
                    .cornerRadius(14)
            }
            .padding(.horizontal, 20)
            
            Button("Not now") { mealVM.ignorePrompt() }
                .font(.system(size: 14))
                .foregroundColor(.appTextTertiary)
        }
    }
    
    var unlockView: some View {
        VStack(spacing: 24) {
            Text("Do you want to keep eating?")
                .font(.system(size: 18, weight: .semibold))
            Text("Leftovers are always okay.")
                .font(.system(size: 14))
                .foregroundColor(.appTextSecondary)
            
            Button {
                mealVM.startPause()
            } label: {
                Text("Pause now")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.appAccent)
                    .cornerRadius(14)
            }
            .padding(.horizontal, 20)
            
            // Type code unlock
            if mealVM.settings.unlockMethod == .typeCode {
                VStack(spacing: 8) {
                    Text("Type **\(mealVM.settings.unlockCode)** to continue")
                        .font(.system(size: 13))
                        .foregroundColor(.appTextSecondary)
                    HStack(spacing: 8) {
                        TextField("Type here", text: $unlockInput)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                            .font(.system(size: 16, design: .monospaced))
                            .multilineTextAlignment(.center)
                            .padding(14)
                            .background(Color.appCard)
                            .cornerRadius(14)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(unlockError ? Color.red : Color.appChip, lineWidth: 2))
                        
                        Button("Go") {
                            if !mealVM.attemptUnlock(input: unlockInput) {
                                unlockError = true
                                unlockInput = ""
                                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { unlockError = false }
                            }
                        }
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 14)
                        .background(Color.orange)
                        .cornerRadius(14)
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }
    
    var pauseView: some View {
        VStack(spacing: 24) {
            Text("Take a breath.")
                .font(.system(size: 18, weight: .semibold))
            Text("Move the plate away if you can.")
                .font(.system(size: 14))
                .foregroundColor(.appTextSecondary)
            Text(formatTime(mealVM.countdownSeconds))
                .font(.system(size: 56, weight: .heavy, design: .monospaced))
                .foregroundColor(.yellow)
            Button("Re-check") { mealVM.endPause() }
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.appAccent)
                .cornerRadius(14)
                .padding(.horizontal, 20)
        }
    }
    
    var doneFlowView: some View {
        VStack(spacing: 24) {
            Text("You're done eating")
                .font(.system(size: 22, weight: .heavy))
            Text("Take a 2-minute pause and move the plate away.")
                .font(.system(size: 14))
                .foregroundColor(.appTextSecondary)
                .multilineTextAlignment(.center)
            
            Button {
                mealVM.startPause()
            } label: {
                Text("Start 2-minute pause")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.appAccent)
                    .cornerRadius(14)
            }
            .padding(.horizontal, 20)
            
            Button("I want to continue") { mealVM.continueFromDone() }
                .font(.system(size: 14))
                .foregroundColor(.appTextTertiary)
        }
    }
    
    // MARK: - Helpers
    
    var stateLabel: String {
        switch mealVM.state {
        case .waitingForPrompt: return "Eating"
        case .waitingForInput: return "Check in"
        case .highFullnessUnlock: return "Continue?"
        case .pause: return "Paused"
        case .doneFlow: return "You're done"
        default: return ""
        }
    }
    
    var stateBackground: Color {
        switch mealVM.state {
        case .pause: return Color.yellow.opacity(0.15)
        case .doneFlow: return Color.red.opacity(0.1)
        default: return Color.appAccent.opacity(0.12)
        }
    }
    
    var stateForeground: Color {
        switch mealVM.state {
        case .pause: return .orange
        case .doneFlow: return .red
        default: return .appAccent
        }
    }
    
    func formatTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }
}

