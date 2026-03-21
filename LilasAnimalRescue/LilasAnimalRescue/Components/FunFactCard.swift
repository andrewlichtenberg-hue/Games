import SwiftUI

struct FunFactCard: View {
    let animal: Animal
    var compact: Bool = false

    var body: some View {
        VStack(spacing: compact ? 8 : 12) {
            Text(animal.emoji)
                .font(.system(size: compact ? 40 : 60))

            Text(animal.name)
                .font(compact ? .subheadline : .title3)
                .fontWeight(.bold)
                .foregroundColor(.primary)
                .multilineTextAlignment(.center)

            if !compact {
                Text("Did you know?")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.orange)
                    .textCase(.uppercase)
            }

            Text(animal.funFact)
                .font(compact ? .caption : .body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(compact ? 3 : nil)
        }
        .padding(compact ? 12 : 20)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(color: BiomeColors.cardShadow, radius: 8, y: 4)
        )
    }
}

struct AnimalCardView: View {
    let animal: Animal
    let isRescued: Bool

    var body: some View {
        VStack(spacing: 6) {
            Text(isRescued ? animal.emoji : "❓")
                .font(.system(size: 36))
                .frame(width: 56, height: 56)
                .background(
                    Circle()
                        .fill(isRescued ? Color.white : Color.gray.opacity(0.2))
                        .shadow(color: BiomeColors.cardShadow, radius: 3, y: 2)
                )

            Text(isRescued ? animal.name.components(separatedBy: " ").first ?? "" : "???")
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(isRescued ? .primary : .gray)
                .lineLimit(1)
        }
        .opacity(isRescued ? 1 : 0.5)
    }
}
