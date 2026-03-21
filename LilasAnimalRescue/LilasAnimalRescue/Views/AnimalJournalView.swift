import SwiftUI

struct AnimalJournalView: View {
    @EnvironmentObject var game: GameState
    @State private var selectedAnimal: Animal?

    private var allAnimals: [Animal] {
        allWorlds.flatMap(\.levels).map(\.animal)
    }

    var body: some View {
        ZStack {
            BiomeColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: {
                        Haptics.tap()
                        game.goBack()
                    }) {
                        Image(systemName: "chevron.left")
                            .font(.title3.weight(.semibold))
                            .foregroundColor(.primary)
                            .padding(10)
                            .background(Circle().fill(Color.white).shadow(color: BiomeColors.cardShadow, radius: 3))
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Animal Journal")
                            .font(.title2.weight(.bold))
                        Text("\(game.progress.rescuedAnimalIds.count)/\(allAnimals.count) rescued")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Text("📖")
                        .font(.system(size: 32))
                }
                .padding(.horizontal)
                .padding(.top, 8)
                .padding(.bottom, 16)

                // Animal grid
                ScrollView {
                    // Group by world
                    ForEach(allWorlds) { world in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack(spacing: 8) {
                                Text(world.emoji)
                                Text(world.name)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal)

                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible()),
                                GridItem(.flexible()),
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 12) {
                                ForEach(world.levels) { level in
                                    let isRescued = game.progress.rescuedAnimalIds.contains(level.animal.id)
                                    AnimalCardView(animal: level.animal, isRescued: isRescued)
                                        .onTapGesture {
                                            if isRescued {
                                                Haptics.tap()
                                                selectedAnimal = level.animal
                                            }
                                        }
                                }
                            }
                            .padding(.horizontal)
                        }
                        .padding(.bottom, 20)
                    }
                }
            }

            // Detail overlay
            if let animal = selectedAnimal {
                ZStack {
                    Color.black.opacity(0.4)
                        .ignoresSafeArea()
                        .onTapGesture {
                            withAnimation(.spring(response: 0.3)) {
                                selectedAnimal = nil
                            }
                        }

                    FunFactCard(animal: animal)
                        .padding(32)
                        .transition(.scale.combined(with: .opacity))
                }
                .animation(.spring(response: 0.3), value: selectedAnimal?.id)
            }
        }
    }
}
