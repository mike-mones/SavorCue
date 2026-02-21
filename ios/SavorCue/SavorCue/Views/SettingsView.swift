import SwiftUI

struct SettingsView: View {
    @ObservedObject var mealVM: MealViewModel
    @State private var local: AppSettings = .default
    @State private var hasChanges = false
    @State private var saved = false
    
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Settings")
                        .font(.appTitle)
                        .foregroundColor(.appTextPrimary)
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    
                    // Prompt Timing
                    SettingsSection(title: "PROMPT TIMING (SECONDS)") {
                        // Presets
                        HStack(spacing: 8) {
                            PresetButton(label: "Gradual") {
                                applyPreset(["0":300,"1":300,"2":270,"3":240,"4":210,"5":180,"6":150,"7":120,"8":60,"9":0,"10":0])
                            }
                            PresetButton(label: "Steady") {
                                applyPreset(["0":180,"1":180,"2":180,"3":180,"4":180,"5":120,"6":120,"7":90,"8":60,"9":0,"10":0])
                            }
                            PresetButton(label: "Aggressive") {
                                applyPreset(["0":120,"1":120,"2":90,"3":90,"4":60,"5":60,"6":45,"7":30,"8":20,"9":0,"10":0])
                            }
                        }
                        .padding(.bottom, 8)
                        
                        ForEach(0...10, id: \.self) { i in
                            let val = local.promptScheduleByRating[String(i)] ?? 0
                            SettingsRow(label: "Fullness \(i)", detail: val == 0 ? "Done flow" : nil) {
                                StepperControl(value: Binding(
                                    get: { local.promptScheduleByRating[String(i)] ?? 0 },
                                    set: { local.promptScheduleByRating[String(i)] = $0; markChanged() }
                                ), step: 15, range: 0...600)
                            }
                        }
                    }
                    
                    // Thresholds
                    SettingsSection(title: "THRESHOLDS") {
                        SettingsRow(label: "High fullness", detail: "Unlock prompt") {
                            StepperControl(value: Binding(
                                get: { local.highFullnessThreshold },
                                set: { local.highFullnessThreshold = $0; markChanged() }
                            ), step: 1, range: 1...10)
                        }
                        SettingsRow(label: "Done threshold", detail: "Done flow") {
                            StepperControl(value: Binding(
                                get: { local.doneThreshold },
                                set: { local.doneThreshold = $0; markChanged() }
                            ), step: 1, range: 1...10)
                        }
                    }
                    
                    // Unlock
                    SettingsSection(title: "UNLOCK TO CONTINUE") {
                        SettingsRow(label: "Method") {
                            HStack(spacing: 6) {
                                ForEach(["tap", "hold", "type_code"], id: \.self) { m in
                                    let method = UnlockMethod(rawValue: m) ?? .typeCode
                                    let label = m == "type_code" ? "Type code" : m == "hold" ? "Hold 2s" : "Tap"
                                    Button(label) {
                                        local.unlockMethod = method
                                        markChanged()
                                    }
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(local.unlockMethod == method ? .white : Color(red: 90/255, green: 90/255, blue: 90/255))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(local.unlockMethod == method ? Color.appAccent : Color.appChip)
                                    .cornerRadius(10)
                                }
                            }
                        }
                        if local.unlockMethod == .typeCode {
                            SettingsRow(label: "Code") {
                                TextField("MORE", text: $local.unlockCode)
                                    .textInputAutocapitalization(.characters)
                                    .autocorrectionDisabled()
                                    .font(.system(size: 14, design: .monospaced))
                                    .multilineTextAlignment(.center)
                                    .frame(width: 80)
                                    .padding(8)
                                    .background(Color.appBackground)
                                    .cornerRadius(10)
                                    .onChange(of: local.unlockCode) { markChanged() }
                            }
                        }
                        SettingsRow(label: "Unlock window", detail: "Seconds after unlock") {
                            StepperControl(value: Binding(
                                get: { local.unlockWindowSec },
                                set: { local.unlockWindowSec = $0; markChanged() }
                            ), step: 15, range: 10...300)
                        }
                    }
                    
                    // Timers
                    SettingsSection(title: "TIMERS") {
                        SettingsRow(label: "Pause duration", detail: "Break length") {
                            StepperControl(value: Binding(
                                get: { local.doneFlowPauseSec },
                                set: { local.doneFlowPauseSec = $0; markChanged() }
                            ), step: 15, range: 10...600)
                        }
                        SettingsRow(label: "Re-prompt delay", detail: "If ignored") {
                            StepperControl(value: Binding(
                                get: { local.ignoredPromptRepromptSec },
                                set: { local.ignoredPromptRepromptSec = $0; markChanged() }
                            ), step: 5, range: 5...120)
                        }
                    }
                    
                    // Behavior
                    SettingsSection(title: "BEHAVIOR") {
                        SettingsRow(label: "Social mode", detail: "Gentler prompts") {
                            Toggle("", isOn: Binding(
                                get: { local.socialMode },
                                set: { local.socialMode = $0; markChanged() }
                            ))
                            .tint(.appAccent)
                        }
                    }
                    
                    Spacer(minLength: 120)
                }
            }
            
            // Save button
            if hasChanges || saved {
                VStack {
                    Spacer()
                    Button {
                        mealVM.updateSettings(local)
                        saved = true
                        hasChanges = false
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { saved = false }
                    } label: {
                        Text(saved ? "✓ Saved" : "Save Settings")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(saved ? Color.appAccent : .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(saved ? Color.appAccent.opacity(0.15) : Color.appAccent)
                            .cornerRadius(14)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 80)
                }
            }
        }
        .onAppear { local = mealVM.settings }
    }
    
    private func markChanged() { hasChanges = true; saved = false }
    
    private func applyPreset(_ vals: [String: Int]) {
        local.promptScheduleByRating = vals
        markChanged()
    }
}

// MARK: - Settings Components

struct SettingsSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(.appTextSecondary)
                .tracking(1.5)
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
            
            VStack(spacing: 0) {
                content
            }
            .padding(.horizontal, 16)
            .background(Color.appCard)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.04), radius: 3, y: 1)
            .padding(.horizontal, 16)
        }
    }
}

struct SettingsRow<Trailing: View>: View {
    let label: String
    var detail: String? = nil
    @ViewBuilder let trailing: Trailing
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.appTextPrimary)
                if let detail {
                    Text(detail)
                        .font(.system(size: 12))
                        .foregroundColor(.appTextSecondary)
                }
            }
            Spacer()
            trailing
        }
        .padding(.vertical, 12)
        .overlay(alignment: .bottom) {
            Divider().foregroundColor(Color.appChip)
        }
    }
}

struct StepperControl: View {
    @Binding var value: Int
    let step: Int
    let range: ClosedRange<Int>
    
    var body: some View {
        HStack(spacing: 4) {
            Button {
                value = max(range.lowerBound, value - step)
            } label: {
                Text("−")
                    .font(.system(size: 18, weight: .bold))
                    .frame(width: 32, height: 32)
                    .background(Color.appChip)
                    .cornerRadius(10)
                    .foregroundColor(.appTextPrimary)
            }
            
            Text("\(value)")
                .font(.system(size: 14, weight: .bold, design: .monospaced))
                .frame(width: 48)
                .foregroundColor(.appTextPrimary)
            
            Button {
                value = min(range.upperBound, value + step)
            } label: {
                Text("+")
                    .font(.system(size: 18, weight: .bold))
                    .frame(width: 32, height: 32)
                    .background(Color.appChip)
                    .cornerRadius(10)
                    .foregroundColor(.appTextPrimary)
            }
        }
    }
}

struct PresetButton: View {
    let label: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Color(red: 90/255, green: 90/255, blue: 90/255))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.appChip)
                .cornerRadius(10)
        }
    }
}
