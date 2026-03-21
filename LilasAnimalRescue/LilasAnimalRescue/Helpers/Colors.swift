import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

enum BiomeColors {
    static func gradient(for world: World) -> LinearGradient {
        LinearGradient(
            colors: [Color(hex: world.gradientTop), Color(hex: world.gradientBottom)],
            startPoint: .top, endPoint: .bottom
        )
    }

    static func cardColor(for world: World) -> Color {
        Color(hex: world.cardColor)
    }

    // Generic app colors
    static let background = Color(hex: "#F5F0E8")
    static let cardShadow = Color.black.opacity(0.1)
    static let starGold = Color(hex: "#FFD700")
    static let starEmpty = Color(hex: "#D3D3D3")
    static let pathColor = Color(hex: "#FFB74D")
    static let pathStroke = Color(hex: "#FF9800")
    static let animalHighlight = Color(hex: "#FFF9C4")
    static let habitatHighlight = Color(hex: "#A5D6A7")
}
