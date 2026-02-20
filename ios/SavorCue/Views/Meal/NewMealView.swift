import SwiftUI

struct NewMealView: View {
    @ObservedObject var mealVM: MealViewModel
    let onStart: () -> Void
    @Environment(\.dismiss) private var dismiss
    
    @State private var fullness: Double = 5
    @State private var hasSetFullness = false
    @State private var mealType = ""
    @State private var location = ""
    @State private var mealSource = ""
    @State private var social = ""
    @State private var foodVibe = ""
    @State private var alcohol = ""
    
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    HStack {
                        Text("New meal")
                            .font(.appHeading)
                            .foregroundColor(.appTextPrimary)
                        Spacer()
                        Button("Cancel") { dismiss() }
                            .foregroundColor(.appTextTertiary)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    
                    // Fullness slider
                    VStack(alignment: .leading, spacing: 12) {
                        Text("HOW FULL ARE YOU?")
                            .font(.appCaption)
                            .foregroundColor(.appTextSecondary)
                            .tracking(1.5)
                        
                        HStack(alignment: .firstTextBaseline, spacing: 12) {
                            Text(hasSetFullness ? "\(Int(fullness))" : "—")
                                .font(.appLargeNumber)
                                .foregroundColor(hasSetFullness ? Color.fullnessColor(Int(fullness)) : .appChip)
                            
                            Text(hasSetFullness ? fullnessLabel(Int(fullness)) : "Drag to set")
                                .font(.appBody)
                                .foregroundColor(.appTextSecondary)
                        }
                        
                        Slider(value: $fullness, in: 0...10, step: 1) {
                            Text("Fullness")
                        }
                        .tint(Color.fullnessColor(Int(fullness)))
                        .onChange(of: fullness) { hasSetFullness = true }
                        
                        HStack {
                            Text("Empty").font(.system(size: 11)).foregroundColor(.appTextTertiary)
                            Spacer()
                            Text("Neutral").font(.system(size: 11)).foregroundColor(.appTextTertiary)
                            Spacer()
                            Text("Stuffed").font(.system(size: 11)).foregroundColor(.appTextTertiary)
                        }
                    }
                    .padding(20)
                    .background(Color.appCard)
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
                    .padding(.horizontal, 20)
                    
                    // Options
                    VStack(spacing: 16) {
                        ChipGroup(label: "WHAT MEAL?", options: ["Breakfast", "Lunch", "Dinner", "Snack"], selection: $mealType)
                        ChipGroup(label: "WHERE?", options: ["Home", "Restaurant", "Other"], selection: $location)
                        if location == "Home" {
                            ChipGroup(label: "MEAL SOURCE", options: ["Homecooked", "Takeout"], selection: $mealSource)
                        }
                        ChipGroup(label: "WITH WHO?", options: ["Solo", "With others"], selection: $social)
                        ChipGroup(label: "FOOD VIBE", options: ["Healthy", "Mixed", "Indulgent"], selection: $foodVibe)
                        ChipGroup(label: "DRINKING?", options: ["Yes", "No"], selection: $alcohol)
                    }
                    .padding(.horizontal, 20)
                    
                    Spacer(minLength: 100)
                }
            }
            
            // Start button
            VStack {
                Spacer()
                Button {
                    let context = MealContext(
                        location: location.lowercased().isEmpty ? nil : location.lowercased(),
                        social: social == "Solo" ? "alone" : social == "With others" ? "with_people" : nil,
                        mealType: mealType.lowercased().isEmpty ? nil : mealType.lowercased(),
                        mealSource: mealSource.lowercased().isEmpty ? nil : mealSource.lowercased(),
                        hungerBefore: hasSetFullness ? Int(fullness) : nil,
                        healthyIndulgent: foodVibe.lowercased().isEmpty ? nil : foodVibe.lowercased(),
                        alcohol: alcohol == "Yes" ? true : alcohol == "No" ? false : nil
                    )
                    mealVM.startMeal(mode: .quick, context: context)
                    dismiss()
                    onStart()
                } label: {
                    Text(hasSetFullness ? "Start Meal" : "Set fullness to begin")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(hasSetFullness ? .white : .appTextTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(hasSetFullness ? Color.appAccent : Color.appChip)
                        .cornerRadius(16)
                }
                .disabled(!hasSetFullness)
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
            }
        }
    }
    
    func fullnessLabel(_ v: Int) -> String {
        switch v {
        case 0: return "Empty"
        case 1...2: return "Hungry"
        case 3...4: return "Slightly hungry"
        case 5: return "Neutral"
        case 6...7: return "Satisfied"
        case 8...9: return "Full"
        default: return "Stuffed"
        }
    }
}

struct ChipGroup: View {
    let label: String
    let options: [String]
    @Binding var selection: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label)
                .font(.appCaption)
                .foregroundColor(.appTextSecondary)
                .tracking(1.5)
            
            HStack(spacing: 8) {
                ForEach(options, id: \.self) { option in
                    let isSelected = selection == option
                    Button {
                        selection = isSelected ? "" : option
                    } label: {
                        Text(option)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(isSelected ? .white : Color(red: 90/255, green: 90/255, blue: 90/255))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(isSelected ? Color.appAccent : Color.appChip)
                            .cornerRadius(12)
                    }
                }
            }
        }
    }
}
