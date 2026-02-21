import SwiftUI

struct EndMealView: View {
    @ObservedObject var mealVM: MealViewModel
    @Environment(\.dismiss) private var dismiss
    
    @State private var finalFullness: Double
    @State private var feelingAfter: Double = 5
    @State private var discomfort: Double = 0
    @State private var overshot: Bool? = nil
    @State private var amountLeft = ""
    @State private var note = ""
    
    init(mealVM: MealViewModel) {
        self.mealVM = mealVM
        _finalFullness = State(initialValue: Double(mealVM.lastFullnessRating ?? 5))
    }
    
    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 16) {
                    Text("How was your meal?")
                        .font(.appHeading)
                        .foregroundColor(.appTextPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    
                    // Final fullness
                    SliderCard(
                        label: "Final fullness",
                        value: $finalFullness,
                        color: Color.fullnessColor(Int(finalFullness)),
                        leftLabel: "Empty",
                        rightLabel: "Stuffed"
                    )
                    
                    // How do you feel
                    SliderCard(
                        label: "How do you feel?",
                        value: $feelingAfter,
                        color: feelingColor(Int(feelingAfter)),
                        leftLabel: "Terrible",
                        rightLabel: "Great"
                    )
                    
                    // Discomfort
                    SliderCard(
                        label: "Discomfort",
                        value: $discomfort,
                        color: Int(discomfort) <= 3 ? .appAccent : Int(discomfort) <= 6 ? .yellow : .red,
                        leftLabel: "None",
                        rightLabel: "Severe"
                    )
                    
                    // Overshot
                    ChipQuestion(label: "Did you eat more than you wanted?", options: ["Yes", "No"], selection: Binding(
                        get: { overshot == true ? "Yes" : overshot == false ? "No" : "" },
                        set: { overshot = $0 == "Yes" ? true : $0 == "No" ? false : nil }
                    ))
                    
                    // Amount left
                    ChipQuestion(label: "Amount left", options: ["Nothing", "Few bites", "~25%", "50%+"], selection: $amountLeft)
                    
                    // Note
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notes (optional)")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.appTextPrimary)
                        TextField("Any thoughts?", text: $note, axis: .vertical)
                            .lineLimit(2...4)
                            .padding(12)
                            .background(Color.appBackground)
                            .cornerRadius(12)
                    }
                    .padding(16)
                    .background(Color.appCard)
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.04), radius: 3, y: 1)
                    .padding(.horizontal, 16)
                    
                    Spacer(minLength: 100)
                }
            }
            
            // Bottom buttons
            VStack {
                Spacer()
                HStack(spacing: 10) {
                    Button {
                        let amountLeftKey = ["Nothing": "none", "Few bites": "few_bites", "~25%": "25_percent", "50%+": "50_percent_plus"][amountLeft]
                        let summary = FinalSummary(
                            finalFullness: Int(finalFullness),
                            feelingAfter: Int(feelingAfter),
                            overshot: overshot,
                            discomfort: Int(discomfort),
                            amountLeft: amountLeftKey,
                            note: note.isEmpty ? nil : note
                        )
                        mealVM.endMeal(summary: summary)
                        dismiss()
                    } label: {
                        Text("Save & Finish")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Color.appAccent)
                            .cornerRadius(14)
                    }
                    
                    Button {
                        mealVM.endMeal()
                        dismiss()
                    } label: {
                        Text("Skip")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.appTextSecondary)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 15)
                            .background(Color.appChip)
                            .cornerRadius(14)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 28)
            }
        }
    }
    
    func feelingColor(_ v: Int) -> Color {
        switch v {
        case 0...2: return .red
        case 3...4: return .orange
        case 5...6: return .yellow
        case 7...8: return Color(red: 132/255, green: 204/255, blue: 22/255)
        default: return .appAccent
        }
    }
}

struct SliderCard: View {
    let label: String
    @Binding var value: Double
    let color: Color
    let leftLabel: String
    let rightLabel: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.appTextPrimary)
                Spacer()
                Text("\(Int(value))")
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundColor(color)
            }
            
            Slider(value: $value, in: 0...10, step: 1)
                .tint(color)
            
            HStack {
                Text(leftLabel).font(.system(size: 11)).foregroundColor(.appTextTertiary)
                Spacer()
                Text(rightLabel).font(.system(size: 11)).foregroundColor(.appTextTertiary)
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 3, y: 1)
        .padding(.horizontal, 16)
    }
}

struct ChipQuestion: View {
    let label: String
    let options: [String]
    @Binding var selection: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.appTextPrimary)
            HStack(spacing: 8) {
                ForEach(options, id: \.self) { opt in
                    Button {
                        selection = selection == opt ? "" : opt
                    } label: {
                        Text(opt)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(selection == opt ? .white : Color(red: 90/255, green: 90/255, blue: 90/255))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(selection == opt ? Color.appAccent : Color.appChip)
                            .cornerRadius(10)
                    }
                }
            }
        }
        .padding(16)
        .background(Color.appCard)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 3, y: 1)
        .padding(.horizontal, 16)
    }
}
