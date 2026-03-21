import SwiftUI

struct GridCellView: View {
    let position: GridPosition
    let cellType: CellType
    let isOnPath: Bool
    let isAnimated: Bool // Animal has walked through this cell
    let isCollectedStar: Bool
    let level: Level
    let cellSize: CGFloat

    var body: some View {
        ZStack {
            // Background
            RoundedRectangle(cornerRadius: 6)
                .fill(backgroundColor)
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(borderColor, lineWidth: isOnPath ? 2 : 0.5)
                )

            // Content
            Text(cellContent)
                .font(.system(size: cellSize * 0.55))
                .scaleEffect(isAnimated && cellType == .animalStart ? 0 : 1)

            // Animal walking animation
            if isAnimated && position != level.habitatPosition {
                Text(level.animal.emoji)
                    .font(.system(size: cellSize * 0.45))
                    .transition(.scale)
            }
        }
        .frame(width: cellSize, height: cellSize)
        .shadow(color: isOnPath ? BiomeColors.pathColor.opacity(0.3) : .clear, radius: 3)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isOnPath)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isAnimated)
    }

    private var backgroundColor: Color {
        if position == level.startPosition {
            return BiomeColors.animalHighlight
        }
        if position == level.habitatPosition {
            return BiomeColors.habitatHighlight
        }
        if isOnPath {
            return BiomeColors.pathColor.opacity(0.6)
        }
        return Color.white.opacity(0.9)
    }

    private var borderColor: Color {
        if isOnPath {
            return BiomeColors.pathStroke
        }
        return Color.gray.opacity(0.2)
    }

    private var cellContent: String {
        switch cellType {
        case .animalStart:
            return level.animal.emoji
        case .habitat:
            return "🏠"
        case .obstacle(let obs):
            return obs.rawValue
        case .star:
            return isCollectedStar ? "" : "⭐"
        case .funFactToken:
            return "❓"
        case .empty:
            return ""
        }
    }
}
