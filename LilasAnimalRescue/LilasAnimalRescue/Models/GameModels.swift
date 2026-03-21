import Foundation

// MARK: - Grid Cell Types

enum CellType: Equatable {
    case empty
    case obstacle(ObstacleType)
    case animalStart
    case habitat
    case star
    case funFactToken
}

enum ObstacleType: String, CaseIterable {
    case rock = "🪨"
    case water = "💧"
    case tree = "🌲"
    case bush = "🌿"
    case wave = "🌊"
    case seaweed = "🌱"
    case vine = "🌴"
    case ruins = "🏛️"
}

// MARK: - Grid Position

struct GridPosition: Equatable, Hashable {
    let row: Int
    let col: Int

    func isAdjacent(to other: GridPosition) -> Bool {
        let dr = abs(row - other.row)
        let dc = abs(col - other.col)
        return (dr == 1 && dc == 0) || (dr == 0 && dc == 1)
    }
}

// MARK: - Animal

struct Animal: Identifiable {
    let id: String
    let name: String
    let emoji: String
    let funFact: String
    let greeting: String
}

// MARK: - Level

struct Level: Identifiable {
    let id: String
    let worldId: String
    let levelNumber: Int
    let title: String
    let gridSize: Int
    let animal: Animal
    let grid: [[CellType]]
    let startPosition: GridPosition
    let habitatPosition: GridPosition
    let starPositions: [GridPosition]
    let optimalPathLength: Int
}

// MARK: - World

struct World: Identifiable {
    let id: String
    let name: String
    let subtitle: String
    let emoji: String
    let levels: [Level]
    let gradientTop: String
    let gradientBottom: String
    let cardColor: String
}

// MARK: - Level Result

struct LevelResult {
    let starsEarned: Int // 1-3
    let collectedStars: Int
    let totalStars: Int
    let pathLength: Int
    let optimalPath: Int
}

// MARK: - Saved Progress

struct LevelProgress: Codable {
    let levelId: String
    var bestStars: Int
    var completed: Bool
}

struct GameProgress: Codable {
    var levelProgress: [String: LevelProgress]
    var rescuedAnimalIds: [String]

    static var empty: GameProgress {
        GameProgress(levelProgress: [:], rescuedAnimalIds: [])
    }

    func starsForWorld(_ worldId: String, levels: [Level]) -> Int {
        levels.filter { $0.worldId == worldId }
            .compactMap { levelProgress[$0.id]?.bestStars }
            .reduce(0, +)
    }

    func completedLevelsInWorld(_ worldId: String, levels: [Level]) -> Int {
        levels.filter { $0.worldId == worldId }
            .filter { levelProgress[$0.id]?.completed == true }
            .count
    }

    func isWorldUnlocked(_ worldIndex: Int, worlds: [World]) -> Bool {
        if worldIndex == 0 { return true }
        let previousWorld = worlds[worldIndex - 1]
        let completed = completedLevelsInWorld(previousWorld.id, levels: previousWorld.levels)
        return completed >= 3
    }
}
