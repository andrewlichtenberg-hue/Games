import SwiftUI

struct LevelSelectView: View {
    @EnvironmentObject var game: GameState

    var world: World { game.currentWorld }

    var body: some View {
        ZStack {
            BiomeColors.gradient(for: world)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                // Header
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
                        Text(world.name)
                            .font(.title2.weight(.bold))
                            .foregroundColor(.white)
                        Text(world.subtitle)
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }

                    Spacer()

                    Text(world.emoji)
                        .font(.system(size: 36))
                }
                .padding(.horizontal)
                .padding(.top, 8)

                // Star count
                let totalStars = game.progress.starsForWorld(world.id, levels: world.levels)
                let maxStars = world.levels.count * 3
                HStack(spacing: 6) {
                    Text("⭐ \(totalStars)/\(maxStars)")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.white.opacity(0.2)))

                // Level cards
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(Array(world.levels.enumerated()), id: \.element.id) { index, level in
                            let progress = game.progress.levelProgress[level.id]
                            let isCompleted = progress?.completed ?? false
                            let bestStars = progress?.bestStars ?? 0
                            let isLocked = index > 0 && !(game.progress.levelProgress[world.levels[index - 1].id]?.completed ?? false)
                            // First level is always unlocked
                            let canPlay = index == 0 || !isLocked

                            LevelCardView(
                                level: level,
                                isCompleted: isCompleted,
                                bestStars: bestStars,
                                isLocked: !canPlay
                            )
                            .onTapGesture {
                                guard canPlay else {
                                    Haptics.error()
                                    return
                                }
                                Haptics.tap()
                                game.selectLevel(index)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
            }
        }
    }
}

struct LevelCardView: View {
    let level: Level
    let isCompleted: Bool
    let bestStars: Int
    let isLocked: Bool

    var body: some View {
        HStack(spacing: 14) {
            // Animal
            Text(isLocked ? "🔒" : level.animal.emoji)
                .font(.system(size: 36))
                .frame(width: 52, height: 52)
                .background(
                    Circle()
                        .fill(isLocked ? Color.gray.opacity(0.2) : Color.white.opacity(0.3))
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(level.title)
                    .font(.headline)
                    .foregroundColor(isLocked ? .gray : .primary)

                if isLocked {
                    Text("Complete previous level to unlock")
                        .font(.caption)
                        .foregroundColor(.gray)
                } else {
                    Text("Help \(level.animal.name.components(separatedBy: " ").first ?? "") get home!")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            if isCompleted {
                StarRatingView(stars: bestStars, maxStars: 3, size: 14)
            } else if !isLocked {
                Text("Play")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.green)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(isLocked ? 0.6 : 0.95))
                .shadow(color: BiomeColors.cardShadow, radius: 4, y: 2)
        )
        .opacity(isLocked ? 0.6 : 1)
    }
}
