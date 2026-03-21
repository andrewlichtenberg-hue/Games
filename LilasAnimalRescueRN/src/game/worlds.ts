import { CellType, ObstacleType, World } from './types';
import * as A from './animals';

function buildGrid(
  size: number,
  obstacles: [number, number, ObstacleType][],
  stars: [number, number][],
  start: [number, number],
  habitat: [number, number],
): CellType[][] {
  const grid: CellType[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, (): CellType => ({ kind: 'empty' })),
  );
  grid[start[0]][start[1]] = { kind: 'animalStart' };
  grid[habitat[0]][habitat[1]] = { kind: 'habitat' };
  for (const [r, c, obs] of obstacles) {
    grid[r][c] = { kind: 'obstacle', obstacle: obs };
  }
  for (const [r, c] of stars) {
    grid[r][c] = { kind: 'star' };
  }
  return grid;
}

export const allWorlds: World[] = [
  // ─── WORLD 1: CITY PARK ───────────────────────────────────────
  {
    id: 'city-park', name: 'City Park', subtitle: 'Where urban animals live',
    emoji: '🌳',
    levels: [
      {
        id: 'cp-1', worldId: 'city-park', levelNumber: 1,
        title: "Sammy's Oak Tree", gridSize: 5, animal: A.squirrel,
        grid: buildGrid(5, [[1, 2, 'bush'], [2, 3, 'rock']], [[1, 3]], [0, 0], [4, 4]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 4, col: 4 },
        starPositions: [{ row: 1, col: 3 }], optimalPathLength: 8,
      },
      {
        id: 'cp-2', worldId: 'city-park', levelNumber: 2,
        title: "Pete's Rooftop", gridSize: 5, animal: A.pigeon,
        grid: buildGrid(5, [[0, 2, 'bush'], [1, 1, 'rock'], [3, 2, 'bush'], [3, 3, 'rock']], [[2, 0], [1, 4]], [0, 0], [4, 4]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 4, col: 4 },
        starPositions: [{ row: 2, col: 0 }, { row: 1, col: 4 }], optimalPathLength: 8,
      },
      {
        id: 'cp-3', worldId: 'city-park', levelNumber: 3,
        title: "Rosie's Burrow", gridSize: 5, animal: A.rabbit,
        grid: buildGrid(5, [[1, 0, 'bush'], [1, 1, 'rock'], [2, 3, 'bush'], [3, 1, 'rock'], [3, 4, 'bush']], [[0, 3], [4, 1]], [0, 0], [4, 4]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 4, col: 4 },
        starPositions: [{ row: 0, col: 3 }, { row: 4, col: 1 }], optimalPathLength: 8,
      },
      {
        id: 'cp-4', worldId: 'city-park', levelNumber: 4,
        title: "Theo's Pond", gridSize: 5, animal: A.turtle,
        grid: buildGrid(5,
          [[0, 3, 'water'], [1, 1, 'rock'], [1, 3, 'water'], [2, 1, 'bush'], [3, 0, 'rock'], [3, 3, 'bush'], [4, 2, 'rock']],
          [[2, 4], [1, 2]], [0, 0], [4, 4]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 4, col: 4 },
        starPositions: [{ row: 2, col: 4 }, { row: 1, col: 2 }], optimalPathLength: 8,
      },
      {
        id: 'cp-5', worldId: 'city-park', levelNumber: 5,
        title: "Rocky's Hideout", gridSize: 5, animal: A.raccoon,
        grid: buildGrid(5, [[1, 1, 'bush'], [1, 4, 'rock'], [2, 2, 'water'], [3, 3, 'bush']], [[1, 3], [4, 2]], [0, 0], [4, 4]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 4, col: 4 },
        starPositions: [{ row: 1, col: 3 }, { row: 4, col: 2 }], optimalPathLength: 8,
      },
    ],
    gradientTop: '#87CEEB', gradientBottom: '#5CB85C', cardColor: '#4CAF50',
  },

  // ─── WORLD 2: FOREST & MOUNTAINS ─────────────────────────────
  {
    id: 'forest', name: 'Forest & Mountains', subtitle: 'Deep woods and tall peaks',
    emoji: '🏔️',
    levels: [
      {
        id: 'fm-1', worldId: 'forest', levelNumber: 1,
        title: "Fern's Den", gridSize: 5, animal: A.fox,
        grid: buildGrid(5, [[1, 2, 'tree'], [2, 0, 'tree'], [2, 4, 'tree'], [3, 2, 'rock']], [[0, 4], [4, 0]], [0, 0], [4, 4]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 4, col: 4 },
        starPositions: [{ row: 0, col: 4 }, { row: 4, col: 0 }], optimalPathLength: 8,
      },
      {
        id: 'fm-2', worldId: 'forest', levelNumber: 2,
        title: "Bernadette's Cave", gridSize: 6, animal: A.bear,
        grid: buildGrid(6,
          [[0, 3, 'tree'], [1, 1, 'rock'], [1, 4, 'tree'], [2, 2, 'tree'], [3, 0, 'rock'], [3, 4, 'tree'], [4, 2, 'rock']],
          [[1, 5], [5, 0]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 1, col: 5 }, { row: 5, col: 0 }], optimalPathLength: 10,
      },
      {
        id: 'fm-3', worldId: 'forest', levelNumber: 3,
        title: "Ophelia's Hollow", gridSize: 6, animal: A.owl,
        grid: buildGrid(6,
          [[0, 2, 'tree'], [1, 0, 'rock'], [1, 4, 'tree'], [2, 2, 'rock'], [2, 5, 'tree'], [3, 1, 'tree'], [3, 3, 'rock'], [4, 5, 'tree']],
          [[0, 5], [4, 0], [2, 3]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 0, col: 5 }, { row: 4, col: 0 }, { row: 2, col: 3 }], optimalPathLength: 10,
      },
      {
        id: 'fm-4', worldId: 'forest', levelNumber: 4,
        title: "Bruno's Dam", gridSize: 6, animal: A.beaver,
        grid: buildGrid(6,
          [[0, 3, 'water'], [1, 1, 'tree'], [1, 3, 'water'], [2, 3, 'water'], [2, 5, 'rock'], [3, 0, 'tree'], [3, 3, 'water'], [4, 2, 'tree'], [4, 4, 'rock']],
          [[2, 1], [5, 1]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 2, col: 1 }, { row: 5, col: 1 }], optimalPathLength: 12,
      },
      {
        id: 'fm-5', worldId: 'forest', levelNumber: 5,
        title: "Daisy's Meadow", gridSize: 6, animal: A.deer,
        grid: buildGrid(6,
          [[0, 2, 'tree'], [1, 3, 'tree'], [2, 1, 'rock'], [3, 4, 'tree'], [4, 0, 'rock']],
          [[3, 2], [4, 5]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 3, col: 2 }, { row: 4, col: 5 }], optimalPathLength: 10,
      },
    ],
    gradientTop: '#2E7D32', gradientBottom: '#1B5E20', cardColor: '#388E3C',
  },

  // ─── WORLD 3: BEACH & OCEAN ──────────────────────────────────
  {
    id: 'beach', name: 'Beach & Ocean', subtitle: 'Sandy shores and deep seas',
    emoji: '🏖️',
    levels: [
      {
        id: 'bo-1', worldId: 'beach', levelNumber: 1,
        title: "Delphi's Reef", gridSize: 6, animal: A.dolphin,
        grid: buildGrid(6,
          [[1, 2, 'wave'], [2, 0, 'seaweed'], [2, 4, 'wave'], [3, 2, 'seaweed'], [4, 4, 'wave']],
          [[0, 5], [3, 1]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 0, col: 5 }, { row: 3, col: 1 }], optimalPathLength: 10,
      },
      {
        id: 'bo-2', worldId: 'beach', levelNumber: 2,
        title: "Shelly's Nesting Beach", gridSize: 6, animal: A.seaTurtle,
        grid: buildGrid(6,
          [[0, 3, 'wave'], [1, 1, 'seaweed'], [1, 4, 'wave'], [2, 2, 'wave'], [3, 0, 'seaweed'], [3, 4, 'wave'], [4, 2, 'seaweed']],
          [[1, 5], [4, 0]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 1, col: 5 }, { row: 4, col: 0 }], optimalPathLength: 10,
      },
      {
        id: 'bo-3', worldId: 'beach', levelNumber: 3,
        title: "Sunny's Rock", gridSize: 6, animal: A.seal,
        grid: buildGrid(6,
          [[0, 2, 'wave'], [1, 0, 'seaweed'], [1, 3, 'wave'], [1, 5, 'seaweed'], [2, 2, 'rock'], [3, 1, 'wave'], [3, 4, 'seaweed'], [4, 3, 'wave'], [4, 5, 'seaweed']],
          [[5, 0], [4, 2]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 5, col: 0 }, { row: 4, col: 2 }], optimalPathLength: 12,
      },
      {
        id: 'bo-4', worldId: 'beach', levelNumber: 4,
        title: "Flora's Lagoon", gridSize: 6, animal: A.flamingo,
        grid: buildGrid(6,
          [[0, 3, 'wave'], [0, 5, 'seaweed'], [1, 1, 'wave'], [2, 3, 'seaweed'], [2, 5, 'wave'], [3, 0, 'seaweed'], [3, 2, 'wave'], [4, 1, 'seaweed'], [4, 4, 'wave'], [5, 3, 'seaweed']],
          [[1, 4], [3, 5]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 1, col: 4 }, { row: 3, col: 5 }], optimalPathLength: 10,
      },
      {
        id: 'bo-5', worldId: 'beach', levelNumber: 5,
        title: "Pablo's Pier", gridSize: 6, animal: A.pelican,
        grid: buildGrid(6,
          [[0, 2, 'wave'], [1, 1, 'rock'], [1, 4, 'wave'], [2, 3, 'seaweed'], [3, 5, 'wave'], [4, 0, 'seaweed']],
          [[4, 4], [5, 1]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 4, col: 4 }, { row: 5, col: 1 }], optimalPathLength: 10,
      },
    ],
    gradientTop: '#0288D1', gradientBottom: '#F5DEB3', cardColor: '#0097A7',
  },

  // ─── WORLD 4: TROPICAL ADVENTURE ─────────────────────────────
  {
    id: 'tropical', name: 'Tropical Adventure', subtitle: 'Rainforests and rare creatures',
    emoji: '🌺',
    levels: [
      {
        id: 'ta-1', worldId: 'tropical', levelNumber: 1,
        title: "Polly's Canopy", gridSize: 6, animal: A.parrot,
        grid: buildGrid(6,
          [[1, 2, 'vine'], [2, 0, 'vine'], [2, 4, 'vine'], [3, 2, 'ruins'], [4, 4, 'vine']],
          [[0, 5], [5, 0]], [0, 0], [5, 5]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 5, col: 5 },
        starPositions: [{ row: 0, col: 5 }, { row: 5, col: 0 }], optimalPathLength: 10,
      },
      {
        id: 'ta-2', worldId: 'tropical', levelNumber: 2,
        title: "Jade's Territory", gridSize: 7, animal: A.jaguar,
        grid: buildGrid(7,
          [[0, 3, 'vine'], [1, 1, 'ruins'], [1, 5, 'vine'], [2, 3, 'vine'], [3, 0, 'vine'], [3, 4, 'ruins'], [4, 2, 'vine'], [4, 6, 'vine'], [5, 1, 'ruins'], [5, 4, 'vine']],
          [[1, 6], [6, 0]], [0, 0], [6, 6]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 6, col: 6 },
        starPositions: [{ row: 1, col: 6 }, { row: 6, col: 0 }], optimalPathLength: 12,
      },
      {
        id: 'ta-3', worldId: 'tropical', levelNumber: 3,
        title: "Eddie's Peak", gridSize: 7, animal: A.eagle,
        grid: buildGrid(7,
          [[0, 2, 'rock'], [1, 4, 'rock'], [2, 1, 'vine'], [3, 3, 'vine'], [4, 5, 'ruins'], [5, 0, 'vine']],
          [[1, 3], [5, 4]], [0, 0], [6, 6]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 6, col: 6 },
        starPositions: [{ row: 1, col: 3 }, { row: 5, col: 4 }], optimalPathLength: 12,
      },
      {
        id: 'ta-4', worldId: 'tropical', levelNumber: 4,
        title: "Ping's Sanctuary", gridSize: 7, animal: A.pangolin,
        grid: buildGrid(7,
          [[0, 3, 'vine'], [0, 5, 'ruins'], [1, 1, 'vine'], [1, 4, 'rock'],
           [2, 0, 'ruins'], [2, 3, 'vine'], [2, 6, 'rock'],
           [3, 2, 'rock'], [3, 5, 'vine'], [4, 0, 'vine'], [4, 4, 'ruins'],
           [5, 1, 'rock'], [5, 3, 'vine'], [5, 5, 'rock']],
          [[1, 6], [6, 0], [3, 3]], [0, 0], [6, 6]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 6, col: 6 },
        starPositions: [{ row: 1, col: 6 }, { row: 6, col: 0 }, { row: 3, col: 3 }], optimalPathLength: 14,
      },
      {
        id: 'ta-5', worldId: 'tropical', levelNumber: 5,
        title: "Mango's Treehouse", gridSize: 7, animal: A.monkey,
        grid: buildGrid(7,
          [[0, 3, 'vine'], [1, 1, 'ruins'], [1, 5, 'vine'], [2, 2, 'rock'],
           [3, 0, 'rock'], [3, 4, 'vine'], [4, 2, 'vine'], [4, 6, 'ruins'], [5, 3, 'rock']],
          [[3, 3], [5, 5]], [0, 0], [6, 6]),
        startPosition: { row: 0, col: 0 }, habitatPosition: { row: 6, col: 6 },
        starPositions: [{ row: 3, col: 3 }, { row: 5, col: 5 }], optimalPathLength: 12,
      },
    ],
    gradientTop: '#2E7D32', gradientBottom: '#FFD700', cardColor: '#689F38',
  },
];
