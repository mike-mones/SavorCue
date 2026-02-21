import SwiftUI

extension Color {
    static let appBackground = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 18/255, green: 18/255, blue: 18/255, alpha: 1)
            : UIColor(red: 250/255, green: 249/255, blue: 247/255, alpha: 1)
    })
    static let appAccent = Color(red: 13/255, green: 148/255, blue: 136/255)
    static let appCard = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 28/255, green: 28/255, blue: 30/255, alpha: 1)
            : UIColor.white
    })
    static let appChip = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 44/255, green: 44/255, blue: 46/255, alpha: 1)
            : UIColor(red: 240/255, green: 238/255, blue: 235/255, alpha: 1)
    })
    static let appTextPrimary = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor.white
            : UIColor(red: 26/255, green: 26/255, blue: 26/255, alpha: 1)
    })
    static let appTextSecondary = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 160/255, green: 160/255, blue: 160/255, alpha: 1)
            : UIColor(red: 138/255, green: 138/255, blue: 138/255, alpha: 1)
    })
    static let appTextTertiary = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 120/255, green: 120/255, blue: 120/255, alpha: 1)
            : UIColor(red: 176/255, green: 173/255, blue: 168/255, alpha: 1)
    })
    static let appDanger = Color(red: 212/255, green: 117/255, blue: 107/255)
    
    static func fullnessColor(_ value: Int) -> Color {
        switch value {
        case 0...2: return Color(red: 13/255, green: 148/255, blue: 136/255)
        case 3...4: return Color(red: 132/255, green: 204/255, blue: 22/255)
        case 5: return Color(red: 234/255, green: 179/255, blue: 8/255)
        case 6...7: return Color(red: 249/255, green: 115/255, blue: 22/255)
        default: return Color(red: 239/255, green: 68/255, blue: 68/255)
        }
    }
}

extension Font {
    static let appTitle = Font.system(size: 24, weight: .heavy)
    static let appHeading = Font.system(size: 20, weight: .bold)
    static let appBody = Font.system(size: 15, weight: .regular)
    static let appCaption = Font.system(size: 11, weight: .semibold)
    static let appLargeNumber = Font.system(size: 48, weight: .heavy, design: .default)
    static let appMono = Font.system(size: 28, weight: .heavy, design: .monospaced)
}
