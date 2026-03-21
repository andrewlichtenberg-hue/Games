import SwiftUI

struct PuzzleView: View {
    @EnvironmentObject var game: GameState

    var level: Level { game.currentLevel }
    var world: World { game.currentWorld }

    var body: some View {
        ZStack {
            // Background gradient
            BiomeColors.gradient(for: world)
                .ignoresSafeArea()

            VStack(spacing: 12) {
                // Header
                headerBar

                // Animal greeting
                animalGreeting

                // Grid
                puzzleGrid
                    .padding(.horizontal, 8)

                // Controls
                controlBar

                Spacer(minLength: 0)
            }
            .padding(.top, 8)

            // Level Complete overlay
            if game.showLevelComplete, let result = game.lastResult {
                LevelCompleteView(result: result, animal: level.animal)
                    .transition(.opacity.combined(with: .scale(scale: 0.9)))
            }
        }
        .animation(.spring(response: 0.4), value: game.showLevelComplete)
    }

    // MARK: - Header

    private var headerBar: some View {
        HStack {
            Button(action: {
                Haptics.tap()
                game.goBack()
            }) {
                Image(systemName: "chevron.left")
                    .font(.title3.weight(.semibold))
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Circle().fill(Color.white.opacity(0.2)))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(level.title)
                    .font(.headline)
                    .foregroundColor(.white)
                Text("Level \(level.levelNumber) • \(world.name)")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
            }

            Spacer()

            // Stars collected indicator
            HStack(spacing: 4) {
                Text("⭐")
                Text("\(game.collectedStars.count)/\(level.starPositions.count)")
                    .font(.subheadline.weight(.bold))
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Capsule().fill(Color.white.opacity(0.2)))
        }
        .padding(.horizontal)
    }

    // MARK: - Animal Greeting

    private var animalGreeting: some View {
        HStack(spacing: 10) {
            Text(level.animal.emoji)
                .font(.system(size: 32))

            Text(level.animal.greeting)
                .font(.subheadline)
                .foregroundColor(.white)
                .italic()
                .lineLimit(2)

            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.15))
        .cornerRadius(12)
        .padding(.horizontal)
    }

    // MARK: - Grid

    private var puzzleGrid: some View {
        GeometryReader { geo in
            let gridPadding: CGFloat = 8
            let availableWidth = geo.size.width - gridPadding * 2
            let availableHeight = geo.size.height
            let maxDimension = min(availableWidth, availableHeight)
            let cellSize = (maxDimension - CGFloat(level.gridSize - 1) * 3) / CGFloat(level.gridSize)

            VStack(spacing: 3) {
                ForEach(0..<level.gridSize, id: \.self) { row in
                    HStack(spacing: 3) {
                        ForEach(0..<level.gridSize, id: \.self) { col in
                            let pos = GridPosition(row: row, col: col)
                            let pathIndex = game.path.firstIndex(of: pos)
                            let isOnPath = pathIndex != nil
                            let isAnimated = game.isAnimatingPath && pathIndex != nil
                                && (pathIndex! < game.animationStep)

                            GridCellView(
                                position: pos,
                                cellType: level.grid[row][col],
                                isOnPath: isOnPath,
                                isAnimated: isAnimated,
                                isCollectedStar: game.collectedStars.contains(pos),
                                level: level,
                                cellSize: cellSize
                            )
                            .onTapGesture {
                                Haptics.tap()
                                game.tapCell(at: pos)
                            }
                        }
                    }
                }
            }
            .padding(gridPadding)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white.opacity(0.95))
                    .shadow(color: BiomeColors.cardShadow, radius: 10, y: 5)
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .aspectRatio(1, contentMode: .fit)
    }

    // MARK: - Controls

    private var controlBar: some View {
        HStack(spacing: 16) {
            // Reset button
            Button(action: {
                Haptics.tap()
                game.resetPuzzle()
            }) {
                Label("Reset", systemImage: "arrow.counterclockwise")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(Capsule().fill(Color.white.opacity(0.25)))
            }
            .disabled(game.isAnimatingPath)

            // Go button
            Button(action: {
                Haptics.success()
                game.animatePath()
            }) {
                Label("Go!", systemImage: "pawprint.fill")
                    .font(.headline)
                    .foregroundColor(game.isPathComplete ? .white : .white.opacity(0.5))
                    .padding(.horizontal, 32)
                    .padding(.vertical, 14)
                    .background(
                        Capsule()
                            .fill(game.isPathComplete
                                  ? Color.green
                                  : Color.white.opacity(0.15))
                    )
                    .shadow(color: game.isPathComplete ? Color.green.opacity(0.4) : .clear, radius: 8, y: 4)
            }
            .disabled(!game.isPathComplete || game.isAnimatingPath)
            .animation(.spring(response: 0.3), value: game.isPathComplete)
        }
        .padding(.horizontal)
    }
}
