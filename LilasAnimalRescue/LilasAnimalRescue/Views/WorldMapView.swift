import SwiftUI

struct WorldMapView: View {
    @EnvironmentObject var game: GameState

    var body: some View {
        ZStack {
            BiomeColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("World Map")
                            .font(.title.weight(.bold))
                        Text("Choose your adventure!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    // Journal button
                    Button(action: {
                        Haptics.tap()
                        game.currentScreen = .journal
                    }) {
                        VStack(spacing: 2) {
                            Image(systemName: "book.fill")
                                .font(.title3)
                            Text("Journal")
                                .font(.caption2)
                        }
                        .foregroundColor(Color(hex: "#4CAF50"))
                        .padding(10)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.white)
                                .shadow(color: BiomeColors.cardShadow, radius: 4, y: 2)
                        )
                    }
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 12)

                // Rescue counter
                let totalRescued = game.progress.rescuedAnimalIds.count
                let totalAnimals = allWorlds.flatMap(\.levels).count
                HStack(spacing: 6) {
                    Text("🐾")
                    Text("\(totalRescued)/\(totalAnimals) animals rescued")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 16)

                // World cards
                ScrollView {
                    VStack(spacing: 16) {
                        ForEach(Array(allWorlds.enumerated()), id: \.element.id) { index, world in
                            let isUnlocked = game.progress.isWorldUnlocked(index, worlds: allWorlds)
                            WorldCardView(
                                world: world,
                                worldIndex: index,
                                isUnlocked: isUnlocked,
                                starsEarned: game.progress.starsForWorld(world.id, levels: world.levels),
                                totalStars: world.levels.count * 3,
                                completedLevels: game.progress.completedLevelsInWorld(world.id, levels: world.levels)
                            )
                            .onTapGesture {
                                guard isUnlocked else {
                                    Haptics.error()
                                    return
                                }
                                Haptics.tap()
                                game.selectWorld(index)
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

struct WorldCardView: View {
    let world: World
    let worldIndex: Int
    let isUnlocked: Bool
    let starsEarned: Int
    let totalStars: Int
    let completedLevels: Int

    var body: some View {
        HStack(spacing: 16) {
            // World emoji
            Text(world.emoji)
                .font(.system(size: 44))
                .frame(width: 64, height: 64)
                .background(
                    Circle()
                        .fill(
                            isUnlocked
                                ? BiomeColors.cardColor(for: world).opacity(0.2)
                                : Color.gray.opacity(0.15)
                        )
                )

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(world.name)
                    .font(.headline)
                    .foregroundColor(isUnlocked ? .primary : .gray)

                Text(world.subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)

                if isUnlocked {
                    HStack(spacing: 8) {
                        StarRatingView(stars: 0, maxStars: 0, size: 12)
                        Text("\(starsEarned)/\(totalStars) ⭐")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text("•")
                            .foregroundColor(.secondary)
                        Text("\(completedLevels)/\(world.levels.count) levels")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "lock.fill")
                            .font(.caption)
                        Text("Complete 3 levels in \(allWorlds[max(0, worldIndex - 1)].name)")
                            .font(.caption)
                    }
                    .foregroundColor(.gray)
                }
            }

            Spacer()

            // Arrow
            if isUnlocked {
                Image(systemName: "chevron.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(BiomeColors.cardColor(for: world))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(color: BiomeColors.cardShadow, radius: 6, y: 3)
        )
        .opacity(isUnlocked ? 1 : 0.7)
    }
}
