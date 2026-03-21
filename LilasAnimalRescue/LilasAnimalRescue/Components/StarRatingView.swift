import SwiftUI

struct StarRatingView: View {
    let stars: Int
    let maxStars: Int
    var size: CGFloat = 24
    var animated: Bool = false

    var body: some View {
        HStack(spacing: size * 0.15) {
            ForEach(0..<maxStars, id: \.self) { index in
                Image(systemName: index < stars ? "star.fill" : "star")
                    .font(.system(size: size))
                    .foregroundColor(index < stars ? BiomeColors.starGold : BiomeColors.starEmpty)
                    .scaleEffect(animated && index < stars ? 1.2 : 1.0)
                    .animation(
                        animated ? .spring(response: 0.4, dampingFraction: 0.5)
                            .delay(Double(index) * 0.3) : nil,
                        value: stars
                    )
            }
        }
    }
}
