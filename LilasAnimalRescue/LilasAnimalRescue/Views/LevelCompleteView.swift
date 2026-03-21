import SwiftUI

struct LevelCompleteView: View {
    let result: LevelResult
    let animal: Animal
    @EnvironmentObject var game: GameState
    @State private var showStars = false
    @State private var showFact = false
    @State private var showButtons = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture {} // Prevent taps through

            VStack(spacing: 20) {
                // Title
                Text("Rescued!")
                    .font(.largeTitle.weight(.bold))
                    .foregroundColor(.green)

                // Animal
                Text(animal.emoji)
                    .font(.system(size: 80))
                    .shadow(color: .black.opacity(0.2), radius: 4, y: 2)

                // Stars
                if showStars {
                    StarRatingView(stars: result.starsEarned, maxStars: 3, size: 36, animated: true)
                        .transition(.scale.combined(with: .opacity))
                }

                // Stats
                if showStars {
                    HStack(spacing: 24) {
                        statItem(icon: "arrow.right.circle", label: "Steps", value: "\(result.pathLength)")
                        statItem(icon: "star.circle", label: "Stars", value: "\(result.collectedStars)/\(result.totalStars)")
                    }
                    .transition(.opacity)
                }

                // Fun Fact
                if showFact {
                    FunFactCard(animal: animal)
                        .padding(.horizontal, 8)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }

                // Buttons
                if showButtons {
                    VStack(spacing: 10) {
                        Button(action: {
                            Haptics.success()
                            game.nextLevel()
                        }) {
                            Text("Next Level")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(Color.green)
                                )
                        }

                        Button(action: {
                            Haptics.tap()
                            game.resetPuzzle()
                        }) {
                            Text("Try Again")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 8)
                    .transition(.opacity)
                }
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color(hex: "#FFFEF5"))
                    .shadow(color: .black.opacity(0.2), radius: 20, y: 10)
            )
            .padding(24)
        }
        .onAppear {
            withAnimation(.spring(response: 0.5).delay(0.2)) {
                showStars = true
            }
            withAnimation(.spring(response: 0.5).delay(0.8)) {
                showFact = true
            }
            withAnimation(.spring(response: 0.4).delay(1.3)) {
                showButtons = true
            }
            Haptics.success()
        }
    }

    private func statItem(icon: String, label: String, value: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.orange)
            Text(value)
                .font(.headline)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
