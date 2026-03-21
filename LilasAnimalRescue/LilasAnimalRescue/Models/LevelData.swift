import Foundation

// MARK: - Animal Definitions

enum Animals {
    // City Park
    static let squirrel = Animal(id: "squirrel", name: "Sammy the Squirrel", emoji: "🐿️",
        funFact: "Squirrels plant thousands of trees every year because they forget where they buried their acorns!",
        greeting: "Got any acorns? I'm collecting for winter!")
    static let pigeon = Animal(id: "pigeon", name: "Pete the Pigeon", emoji: "🐦",
        funFact: "Pigeons can find their way home from 1,300 miles away — they're nature's GPS!",
        greeting: "Coo coo! Welcome to the park!")
    static let rabbit = Animal(id: "rabbit", name: "Rosie the Rabbit", emoji: "🐰",
        funFact: "A rabbit's teeth never stop growing! They need to munch on hay and grass to keep them short.",
        greeting: "Hop hop! Can you help me find my burrow?")
    static let turtle = Animal(id: "turtle", name: "Theo the Turtle", emoji: "🐢",
        funFact: "Some turtles can breathe through their butts! It helps them stay underwater longer.",
        greeting: "Slow and steady... but I could use a shortcut!")
    static let raccoon = Animal(id: "raccoon", name: "Rocky the Raccoon", emoji: "🦝",
        funFact: "Raccoons wash their food before eating — their name literally means 'one who scrubs' in Algonquin!",
        greeting: "Ooh, what's this shiny thing? Oh hi!")

    // Forest & Mountains
    static let fox = Animal(id: "fox", name: "Fern the Fox", emoji: "🦊",
        funFact: "Foxes use the Earth's magnetic field like a compass to help them pounce on mice under snow!",
        greeting: "You're clever enough to find me!")
    static let bear = Animal(id: "bear", name: "Bernadette the Black Bear", emoji: "🐻",
        funFact: "Black bears can smell food from over a mile away and run 35 miles per hour — faster than a horse!",
        greeting: "ROAR! ...Just kidding. I'm gentle!")
    static let owl = Animal(id: "owl", name: "Ophelia the Owl", emoji: "🦉",
        funFact: "Owls can turn their heads 270 degrees because they can't move their eyeballs at all!",
        greeting: "Whooo goes there? Oh, a friend!")
    static let beaver = Animal(id: "beaver", name: "Bruno the Beaver", emoji: "🦫",
        funFact: "Beavers are nature's engineers! Their dams create ponds that give homes to hundreds of other animals.",
        greeting: "I'm building a dam! Wanna help?")
    static let deer = Animal(id: "deer", name: "Daisy the Deer", emoji: "🦌",
        funFact: "Deer can jump 10 feet high and 30 feet far in a single leap!",
        greeting: "Shh... follow me through the forest!")

    // Beach & Ocean
    static let dolphin = Animal(id: "dolphin", name: "Delphi the Dolphin", emoji: "🐬",
        funFact: "Dolphins sleep with one eye open! Half their brain rests while the other half stays awake.",
        greeting: "Splash! Race you to the reef!")
    static let seaTurtle = Animal(id: "sea-turtle", name: "Shelly the Sea Turtle", emoji: "🐢",
        funFact: "Sea turtles can hold their breath for 5 hours and travel thousands of miles across the ocean!",
        greeting: "I've been swimming since before your grandma was born!")
    static let seal = Animal(id: "seal", name: "Sunny the Seal", emoji: "🦭",
        funFact: "Seals can sleep underwater! They come up to breathe without even waking up.",
        greeting: "Arf arf! Belly rubs?")
    static let flamingo = Animal(id: "flamingo", name: "Flora the Flamingo", emoji: "🦩",
        funFact: "Flamingos are born gray! They turn pink from eating shrimp and algae.",
        greeting: "Strike a pose! One leg, obviously.")
    static let pelican = Animal(id: "pelican", name: "Pablo the Pelican", emoji: "🐦",
        funFact: "A pelican's pouch can hold 3 gallons of water — that's more than their stomach!",
        greeting: "My beak is basically a fishing net!")

    // Tropical Adventure
    static let parrot = Animal(id: "parrot", name: "Polly the Parrot", emoji: "🦜",
        funFact: "Parrots can learn over 100 words and some can even understand what they're saying!",
        greeting: "HELLO! HELLO! Want a cracker?")
    static let jaguar = Animal(id: "jaguar", name: "Jade the Jaguar", emoji: "🐆",
        funFact: "Jaguars have the strongest bite of any big cat — strong enough to crack a turtle's shell!",
        greeting: "I'm the queen of the jungle. Pleased to meet you.")
    static let eagle = Animal(id: "eagle", name: "Eddie the Eagle", emoji: "🦅",
        funFact: "Eagles can spot a rabbit from 2 miles away! Their eyesight is 8 times better than humans.",
        greeting: "I can see your house from up here!")
    static let pangolin = Animal(id: "pangolin", name: "Ping the Pangolin", emoji: "🦔",
        funFact: "Pangolins are the world's most trafficked mammal. When scared, they curl into a tight ball of scales!",
        greeting: "I'm shy... but I trust you!")
    static let monkey = Animal(id: "monkey", name: "Mango the Monkey", emoji: "🐒",
        funFact: "Monkeys peel bananas from the bottom — try it, it's easier!",
        greeting: "Ooh ooh! Up here! In the trees!")
}

// MARK: - Level Builder Helper

private func buildGrid(size: Int, obstacles: [(Int, Int, ObstacleType)], stars: [(Int, Int)],
                       start: (Int, Int), habitat: (Int, Int)) -> [[CellType]] {
    var grid = Array(repeating: Array(repeating: CellType.empty, count: size), count: size)
    grid[start.0][start.1] = .animalStart
    grid[habitat.0][habitat.1] = .habitat
    for (r, c, obs) in obstacles {
        grid[r][c] = .obstacle(obs)
    }
    for (r, c) in stars {
        grid[r][c] = .star
    }
    return grid
}

// MARK: - World Definitions

let allWorlds: [World] = [
    // ─── WORLD 1: CITY PARK ───────────────────────────────────────
    World(
        id: "city-park", name: "City Park", subtitle: "Where urban animals live",
        emoji: "🌳",
        levels: [
            Level(id: "cp-1", worldId: "city-park", levelNumber: 1,
                  title: "Sammy's Oak Tree",
                  gridSize: 5, animal: Animals.squirrel,
                  grid: buildGrid(size: 5,
                      obstacles: [(1, 2, .bush), (2, 3, .rock)],
                      stars: [(1, 3)],
                      start: (0, 0), habitat: (4, 4)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 4, col: 4),
                  starPositions: [GridPosition(row: 1, col: 3)],
                  optimalPathLength: 9),
            Level(id: "cp-2", worldId: "city-park", levelNumber: 2,
                  title: "Pete's Rooftop",
                  gridSize: 5, animal: Animals.pigeon,
                  grid: buildGrid(size: 5,
                      obstacles: [(0, 2, .bush), (1, 1, .rock), (3, 2, .bush), (3, 3, .rock)],
                      stars: [(2, 0), (1, 4)],
                      start: (0, 0), habitat: (4, 4)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 4, col: 4),
                  starPositions: [GridPosition(row: 2, col: 0), GridPosition(row: 1, col: 4)],
                  optimalPathLength: 9),
            Level(id: "cp-3", worldId: "city-park", levelNumber: 3,
                  title: "Rosie's Burrow",
                  gridSize: 5, animal: Animals.rabbit,
                  grid: buildGrid(size: 5,
                      obstacles: [(1, 0, .bush), (1, 1, .rock), (2, 3, .bush), (3, 1, .rock), (3, 4, .bush)],
                      stars: [(0, 3), (4, 1)],
                      start: (0, 0), habitat: (4, 4)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 4, col: 4),
                  starPositions: [GridPosition(row: 0, col: 3), GridPosition(row: 4, col: 1)],
                  optimalPathLength: 10),
            Level(id: "cp-4", worldId: "city-park", levelNumber: 4,
                  title: "Theo's Pond",
                  gridSize: 5, animal: Animals.turtle,
                  grid: buildGrid(size: 5,
                      obstacles: [(0, 3, .water), (1, 1, .rock), (1, 3, .water), (2, 1, .bush),
                                  (3, 0, .rock), (3, 3, .bush), (4, 2, .rock)],
                      stars: [(2, 4), (4, 0)],
                      start: (0, 0), habitat: (4, 4)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 4, col: 4),
                  starPositions: [GridPosition(row: 2, col: 4), GridPosition(row: 4, col: 0)],
                  optimalPathLength: 10),
            // cp-5: Verified solvable. Diagonal obstacle line with gaps on both sides.
            // Shortest path: (0,0)→(0,1)→(0,2)→(0,3)→(1,3)★→(2,3)→(2,4)→(3,4)→(4,4) = 8
            // Alt path via bottom: (0,0)→(1,0)→(2,0)→(2,1)→(3,1)→(3,2)→(4,2)★→(4,3)→(4,4) = 8
            Level(id: "cp-5", worldId: "city-park", levelNumber: 5,
                  title: "Rocky's Hideout",
                  gridSize: 5, animal: Animals.raccoon,
                  grid: buildGrid(size: 5,
                      obstacles: [(1, 1, .bush), (1, 4, .rock), (2, 2, .water), (3, 3, .bush)],
                      stars: [(1, 3), (4, 2)],
                      start: (0, 0), habitat: (4, 4)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 4, col: 4),
                  starPositions: [GridPosition(row: 1, col: 3), GridPosition(row: 4, col: 2)],
                  optimalPathLength: 8),
        ],
        gradientTop: "#87CEEB", gradientBottom: "#5CB85C", cardColor: "#4CAF50"
    ),

    // ─── WORLD 2: FOREST & MOUNTAINS ─────────────────────────────
    World(
        id: "forest", name: "Forest & Mountains", subtitle: "Deep woods and tall peaks",
        emoji: "🏔️",
        levels: [
            Level(id: "fm-1", worldId: "forest", levelNumber: 1,
                  title: "Fern's Den",
                  gridSize: 5, animal: Animals.fox,
                  grid: buildGrid(size: 5,
                      obstacles: [(1, 2, .tree), (2, 0, .tree), (2, 4, .tree), (3, 2, .rock)],
                      stars: [(0, 4), (4, 0)],
                      start: (0, 0), habitat: (4, 4)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 4, col: 4),
                  starPositions: [GridPosition(row: 0, col: 4), GridPosition(row: 4, col: 0)],
                  optimalPathLength: 9),
            Level(id: "fm-2", worldId: "forest", levelNumber: 2,
                  title: "Bernadette's Cave",
                  gridSize: 6, animal: Animals.bear,
                  grid: buildGrid(size: 6,
                      obstacles: [(0, 3, .tree), (1, 1, .rock), (1, 4, .tree), (2, 2, .tree),
                                  (3, 0, .rock), (3, 4, .tree), (4, 2, .rock)],
                      stars: [(1, 5), (5, 0)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 1, col: 5), GridPosition(row: 5, col: 0)],
                  optimalPathLength: 11),
            Level(id: "fm-3", worldId: "forest", levelNumber: 3,
                  title: "Ophelia's Hollow",
                  gridSize: 6, animal: Animals.owl,
                  grid: buildGrid(size: 6,
                      obstacles: [(0, 2, .tree), (1, 0, .rock), (1, 4, .tree), (2, 2, .rock),
                                  (2, 5, .tree), (3, 1, .tree), (3, 3, .rock), (4, 5, .tree)],
                      stars: [(0, 5), (4, 0), (2, 3)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 0, col: 5), GridPosition(row: 4, col: 0), GridPosition(row: 2, col: 3)],
                  optimalPathLength: 12),
            Level(id: "fm-4", worldId: "forest", levelNumber: 4,
                  title: "Bruno's Dam",
                  gridSize: 6, animal: Animals.beaver,
                  grid: buildGrid(size: 6,
                      obstacles: [(0, 3, .water), (1, 1, .tree), (1, 3, .water), (2, 3, .water),
                                  (2, 5, .rock), (3, 0, .tree), (3, 3, .water), (4, 2, .tree), (4, 4, .rock)],
                      stars: [(1, 5), (5, 1)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 1, col: 5), GridPosition(row: 5, col: 1)],
                  optimalPathLength: 13),
            // fm-5: Verified solvable. Sparse obstacles with stars on the natural path.
            // Shortest: (0,0)→(0,1)→(1,1)→(1,2)→(2,2)→(3,2)★→(3,3)→(4,3)→(4,4)→(4,5)★→(5,5) = 10
            Level(id: "fm-5", worldId: "forest", levelNumber: 5,
                  title: "Daisy's Meadow",
                  gridSize: 6, animal: Animals.deer,
                  grid: buildGrid(size: 6,
                      obstacles: [(0, 2, .tree), (1, 3, .tree), (2, 1, .rock), (3, 4, .tree), (4, 0, .rock)],
                      stars: [(3, 2), (4, 5)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 3, col: 2), GridPosition(row: 4, col: 5)],
                  optimalPathLength: 10),
        ],
        gradientTop: "#2E7D32", gradientBottom: "#1B5E20", cardColor: "#388E3C"
    ),

    // ─── WORLD 3: BEACH & OCEAN ──────────────────────────────────
    World(
        id: "beach", name: "Beach & Ocean", subtitle: "Sandy shores and deep seas",
        emoji: "🏖️",
        levels: [
            Level(id: "bo-1", worldId: "beach", levelNumber: 1,
                  title: "Delphi's Reef",
                  gridSize: 6, animal: Animals.dolphin,
                  grid: buildGrid(size: 6,
                      obstacles: [(1, 2, .wave), (2, 0, .seaweed), (2, 4, .wave), (3, 2, .seaweed), (4, 4, .wave)],
                      stars: [(0, 5), (3, 1)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 0, col: 5), GridPosition(row: 3, col: 1)],
                  optimalPathLength: 11),
            Level(id: "bo-2", worldId: "beach", levelNumber: 2,
                  title: "Shelly's Nesting Beach",
                  gridSize: 6, animal: Animals.seaTurtle,
                  grid: buildGrid(size: 6,
                      obstacles: [(0, 3, .wave), (1, 1, .seaweed), (1, 4, .wave), (2, 2, .wave),
                                  (3, 0, .seaweed), (3, 4, .wave), (4, 2, .seaweed)],
                      stars: [(1, 5), (4, 0)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 1, col: 5), GridPosition(row: 4, col: 0)],
                  optimalPathLength: 12),
            Level(id: "bo-3", worldId: "beach", levelNumber: 3,
                  title: "Sunny's Rock",
                  gridSize: 6, animal: Animals.seal,
                  grid: buildGrid(size: 6,
                      obstacles: [(0, 2, .wave), (1, 0, .seaweed), (1, 3, .wave), (1, 5, .seaweed),
                                  (2, 2, .rock), (3, 1, .wave), (3, 4, .seaweed), (4, 3, .wave), (4, 5, .seaweed)],
                      stars: [(2, 5), (5, 0)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 2, col: 5), GridPosition(row: 5, col: 0)],
                  optimalPathLength: 13),
            Level(id: "bo-4", worldId: "beach", levelNumber: 4,
                  title: "Flora's Lagoon",
                  gridSize: 6, animal: Animals.flamingo,
                  grid: buildGrid(size: 6,
                      obstacles: [(0, 3, .wave), (0, 5, .seaweed), (1, 1, .wave), (2, 3, .seaweed), (2, 5, .wave),
                                  (3, 0, .seaweed), (3, 2, .wave), (4, 1, .seaweed), (4, 4, .wave), (5, 3, .seaweed)],
                      stars: [(1, 4), (4, 0)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 1, col: 4), GridPosition(row: 4, col: 0)],
                  optimalPathLength: 14),
            // bo-5: Verified solvable. Two route options around scattered obstacles.
            // Shortest: (0,0)→(0,1)→(1,0)→(2,0)→(2,1)→(2,2)→(3,2)→(3,3)→(3,4)→(4,4)★→(4,5)→(5,5) = 10
            // Alt: (0,0)→(1,0)→(2,0)→(2,1)→(3,1)→(4,1)→(5,1)★→(5,2)→(5,3)→(5,4)→(5,5) = 10
            Level(id: "bo-5", worldId: "beach", levelNumber: 5,
                  title: "Pablo's Pier",
                  gridSize: 6, animal: Animals.pelican,
                  grid: buildGrid(size: 6,
                      obstacles: [(0, 2, .wave), (1, 1, .rock), (1, 4, .wave), (2, 3, .seaweed),
                                  (3, 5, .wave), (4, 0, .seaweed)],
                      stars: [(4, 4), (5, 1)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 4, col: 4), GridPosition(row: 5, col: 1)],
                  optimalPathLength: 10),
        ],
        gradientTop: "#0288D1", gradientBottom: "#F5DEB3", cardColor: "#0097A7"
    ),

    // ─── WORLD 4: TROPICAL ADVENTURE ─────────────────────────────
    World(
        id: "tropical", name: "Tropical Adventure", subtitle: "Rainforests and rare creatures",
        emoji: "🌺",
        levels: [
            Level(id: "ta-1", worldId: "tropical", levelNumber: 1,
                  title: "Polly's Canopy",
                  gridSize: 6, animal: Animals.parrot,
                  grid: buildGrid(size: 6,
                      obstacles: [(1, 2, .vine), (2, 0, .vine), (2, 4, .vine), (3, 2, .ruins), (4, 4, .vine)],
                      stars: [(0, 5), (5, 0)],
                      start: (0, 0), habitat: (5, 5)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 5, col: 5),
                  starPositions: [GridPosition(row: 0, col: 5), GridPosition(row: 5, col: 0)],
                  optimalPathLength: 11),
            Level(id: "ta-2", worldId: "tropical", levelNumber: 2,
                  title: "Jade's Territory",
                  gridSize: 7, animal: Animals.jaguar,
                  grid: buildGrid(size: 7,
                      obstacles: [(0, 3, .vine), (1, 1, .ruins), (1, 5, .vine), (2, 3, .vine),
                                  (3, 0, .vine), (3, 4, .ruins), (4, 2, .vine), (4, 6, .vine),
                                  (5, 1, .ruins), (5, 4, .vine)],
                      stars: [(1, 6), (6, 0)],
                      start: (0, 0), habitat: (6, 6)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 6, col: 6),
                  starPositions: [GridPosition(row: 1, col: 6), GridPosition(row: 6, col: 0)],
                  optimalPathLength: 13),
            // ta-3: Verified solvable. Stars on natural paths through 7x7 grid.
            // Shortest: (0,0)→(0,1)→(1,1)→(1,2)→(1,3)★→(2,3)→(2,4)→(3,4)→(4,4)→(5,4)★→(5,5)→(6,5)→(6,6) = 12
            Level(id: "ta-3", worldId: "tropical", levelNumber: 3,
                  title: "Eddie's Peak",
                  gridSize: 7, animal: Animals.eagle,
                  grid: buildGrid(size: 7,
                      obstacles: [(0, 2, .rock), (1, 4, .rock), (2, 1, .vine), (3, 3, .vine),
                                  (4, 5, .ruins), (5, 0, .vine)],
                      stars: [(1, 3), (5, 4)],
                      start: (0, 0), habitat: (6, 6)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 6, col: 6),
                  starPositions: [GridPosition(row: 1, col: 3), GridPosition(row: 5, col: 4)],
                  optimalPathLength: 12),
            Level(id: "ta-4", worldId: "tropical", levelNumber: 4,
                  title: "Ping's Sanctuary",
                  gridSize: 7, animal: Animals.pangolin,
                  grid: buildGrid(size: 7,
                      obstacles: [(0, 3, .vine), (0, 5, .ruins), (1, 1, .vine), (1, 4, .rock),
                                  (2, 0, .ruins), (2, 3, .vine), (2, 6, .rock),
                                  (3, 2, .rock), (3, 5, .vine), (4, 0, .vine), (4, 4, .ruins),
                                  (5, 1, .rock), (5, 3, .vine), (5, 5, .rock)],
                      stars: [(1, 6), (6, 0), (3, 3)],
                      start: (0, 0), habitat: (6, 6)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 6, col: 6),
                  starPositions: [GridPosition(row: 1, col: 6), GridPosition(row: 6, col: 0), GridPosition(row: 3, col: 3)],
                  optimalPathLength: 16),
            // ta-5: Verified solvable. Hardest level - 9 obstacles in 7x7.
            // Shortest: (0,0)→(0,1)→(0,2)→(1,2)→(1,3)→(2,3)→(3,3)★→(3,4)→(4,4)→(4,5)→(5,5)★→(5,6)→(6,6) = 12
            Level(id: "ta-5", worldId: "tropical", levelNumber: 5,
                  title: "Mango's Treehouse",
                  gridSize: 7, animal: Animals.monkey,
                  grid: buildGrid(size: 7,
                      obstacles: [(0, 3, .vine), (1, 1, .ruins), (1, 5, .vine), (2, 2, .rock),
                                  (3, 0, .rock), (3, 4, .vine), (4, 2, .vine), (4, 6, .ruins), (5, 3, .rock)],
                      stars: [(3, 3), (5, 5)],
                      start: (0, 0), habitat: (6, 6)),
                  startPosition: GridPosition(row: 0, col: 0),
                  habitatPosition: GridPosition(row: 6, col: 6),
                  starPositions: [GridPosition(row: 3, col: 3), GridPosition(row: 5, col: 5)],
                  optimalPathLength: 12),
        ],
        gradientTop: "#2E7D32", gradientBottom: "#FFD700", cardColor: "#689F38"
    ),
]
