import SwiftUI

@MainActor
class GameState: ObservableObject {
    @Published var progress: GameProgress {
        didSet { save() }
    }

    @Published var currentScreen: Screen = .splash
    @Published var selectedWorldIndex: Int = 0
    @Published var selectedLevelIndex: Int = 0

    // Puzzle state
    @Published var path: [GridPosition] = []
    @Published var collectedStars: Set<GridPosition> = []
    @Published var isAnimatingPath: Bool = false
    @Published var animationStep: Int = 0
    @Published var showLevelComplete: Bool = false
    @Published var lastResult: LevelResult?

    private let storageKey = "LilasAnimalRescueProgress"

    enum Screen: Equatable {
        case splash
        case worldMap
        case levelSelect
        case puzzle
        case journal
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let decoded = try? JSONDecoder().decode(GameProgress.self, from: data) {
            self.progress = decoded
        } else {
            self.progress = .empty
        }
    }

    private func save() {
        if let encoded = try? JSONEncoder().encode(progress) {
            UserDefaults.standard.set(encoded, forKey: storageKey)
        }
    }

    // MARK: - Navigation

    var currentWorld: World {
        allWorlds[selectedWorldIndex]
    }

    var currentLevel: Level {
        currentWorld.levels[selectedLevelIndex]
    }

    func goToWorldMap() {
        currentScreen = .worldMap
    }

    func selectWorld(_ index: Int) {
        selectedWorldIndex = index
        currentScreen = .levelSelect
    }

    func selectLevel(_ index: Int) {
        selectedLevelIndex = index
        resetPuzzle()
        currentScreen = .puzzle
    }

    func goBack() {
        switch currentScreen {
        case .levelSelect:
            currentScreen = .worldMap
        case .puzzle:
            currentScreen = .levelSelect
            showLevelComplete = false
        case .journal:
            currentScreen = .worldMap
        default:
            break
        }
    }

    // MARK: - Puzzle Logic

    func resetPuzzle() {
        path = []
        collectedStars = []
        isAnimatingPath = false
        animationStep = 0
        showLevelComplete = false
        lastResult = nil
    }

    func tapCell(at position: GridPosition) {
        guard !isAnimatingPath else { return }
        let level = currentLevel

        // Can't tap obstacles, start, or habitat directly (habitat is the goal)
        let cellType = level.grid[position.row][position.col]
        if case .obstacle = cellType { return }
        if cellType == .animalStart { return }

        // If tapping the last cell in the path, remove it (undo)
        if let lastPos = path.last, lastPos == position {
            path.removeLast()
            collectedStars.remove(position)
            return
        }

        // If tapping a cell already in the path (not the last), truncate
        if let index = path.firstIndex(of: position) {
            let removed = path.suffix(from: index)
            for pos in removed {
                collectedStars.remove(pos)
            }
            path = Array(path.prefix(index))
            return
        }

        // Check adjacency: must connect to last path cell, or to start if path is empty
        let anchor = path.last ?? level.startPosition
        guard position.isAdjacent(to: anchor) else { return }

        // Add to path
        path.append(position)

        // Collect star if present
        if level.starPositions.contains(position) {
            collectedStars.insert(position)
        }
    }

    var isPathComplete: Bool {
        guard let lastPos = path.last else { return false }
        return lastPos == currentLevel.habitatPosition
    }

    func animatePath() {
        guard isPathComplete, !isAnimatingPath else { return }
        isAnimatingPath = true
        animationStep = 0

        // Animate step by step
        animateNextStep()
    }

    private func animateNextStep() {
        guard animationStep < path.count else {
            // Animation complete — show results
            completeLevel()
            return
        }

        animationStep += 1

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
            self?.animateNextStep()
        }
    }

    private func completeLevel() {
        let level = currentLevel
        let collected = collectedStars.count
        let total = level.starPositions.count
        let pathLen = path.count

        var stars = 1 // Always get 1 star for completing
        if collected == total { stars += 1 } // Collected all stars
        if pathLen <= level.optimalPathLength + 2 { stars += 1 } // Near-optimal path

        lastResult = LevelResult(
            starsEarned: stars,
            collectedStars: collected,
            totalStars: total,
            pathLength: pathLen,
            optimalPath: level.optimalPathLength
        )

        // Update progress
        let existing = progress.levelProgress[level.id]
        let bestStars = max(existing?.bestStars ?? 0, stars)
        progress.levelProgress[level.id] = LevelProgress(
            levelId: level.id, bestStars: bestStars, completed: true
        )

        // Add rescued animal
        if !progress.rescuedAnimalIds.contains(level.animal.id) {
            progress.rescuedAnimalIds.append(level.animal.id)
        }

        showLevelComplete = true
    }

    func nextLevel() {
        showLevelComplete = false
        if selectedLevelIndex < currentWorld.levels.count - 1 {
            selectLevel(selectedLevelIndex + 1)
        } else {
            currentScreen = .levelSelect
        }
    }

    func resetAllProgress() {
        progress = .empty
    }
}
