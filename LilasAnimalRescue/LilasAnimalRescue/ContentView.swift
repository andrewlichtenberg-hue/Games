import SwiftUI

struct ContentView: View {
    @EnvironmentObject var game: GameState

    var body: some View {
        ZStack {
            switch game.currentScreen {
            case .splash:
                SplashView()
                    .transition(.opacity)
            case .worldMap:
                WorldMapView()
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing),
                        removal: .move(edge: .leading)
                    ))
            case .levelSelect:
                LevelSelectView()
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing),
                        removal: .move(edge: .leading)
                    ))
            case .puzzle:
                PuzzleView()
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing),
                        removal: .move(edge: .leading)
                    ))
            case .journal:
                AnimalJournalView()
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing),
                        removal: .move(edge: .leading)
                    ))
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.85), value: game.currentScreen)
    }
}
