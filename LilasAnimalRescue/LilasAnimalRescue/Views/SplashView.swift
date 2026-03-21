import SwiftUI

struct SplashView: View {
    @EnvironmentObject var game: GameState
    @State private var titleScale: CGFloat = 0.5
    @State private var titleOpacity: Double = 0
    @State private var animalsOpacity: Double = 0
    @State private var buttonOpacity: Double = 0
    @State private var animalBounce: CGFloat = 0

    private let splashAnimals = ["🐿️", "🦊", "🐬", "🦜", "🐻", "🦉", "🐢", "🦩"]

    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [Color(hex: "#4CAF50"), Color(hex: "#81C784"), Color(hex: "#A5D6A7")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                // Title
                VStack(spacing: 8) {
                    Text("🌿")
                        .font(.system(size: 48))

                    Text("Lila's")
                        .font(.system(size: 28, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.9))

                    Text("Animal Rescue")
                        .font(.system(size: 38, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }
                .scaleEffect(titleScale)
                .opacity(titleOpacity)

                // Floating animals
                HStack(spacing: 12) {
                    ForEach(Array(splashAnimals.enumerated()), id: \.offset) { index, emoji in
                        Text(emoji)
                            .font(.system(size: 32))
                            .offset(y: animalBounce * (index.isMultiple(of: 2) ? 1 : -1))
                    }
                }
                .opacity(animalsOpacity)

                Spacer()

                // Play button
                Button(action: {
                    Haptics.success()
                    withAnimation(.spring(response: 0.4)) {
                        game.goToWorldMap()
                    }
                }) {
                    HStack(spacing: 10) {
                        Image(systemName: "pawprint.fill")
                        Text("Start Rescuing!")
                    }
                    .font(.title3.weight(.bold))
                    .foregroundColor(Color(hex: "#2E7D32"))
                    .padding(.horizontal, 40)
                    .padding(.vertical, 16)
                    .background(
                        Capsule()
                            .fill(Color.white)
                            .shadow(color: Color.black.opacity(0.15), radius: 10, y: 5)
                    )
                }
                .opacity(buttonOpacity)

                Spacer()
                    .frame(height: 40)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.6)) {
                titleScale = 1.0
                titleOpacity = 1.0
            }
            withAnimation(.easeInOut(duration: 0.6).delay(0.4)) {
                animalsOpacity = 1.0
            }
            withAnimation(.easeInOut(duration: 0.5).delay(0.8)) {
                buttonOpacity = 1.0
            }
            // Gentle floating animation
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true).delay(0.5)) {
                animalBounce = 8
            }
        }
    }
}
