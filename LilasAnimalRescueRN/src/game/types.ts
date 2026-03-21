export type ObstacleType = 'rock' | 'water' | 'tree' | 'bush' | 'wave' | 'seaweed' | 'vine' | 'ruins';

export type CellType =
  | { kind: 'empty' }
  | { kind: 'obstacle'; obstacle: ObstacleType }
  | { kind: 'animalStart' }
  | { kind: 'habitat' }
  | { kind: 'star' };

export interface GridPosition {
  row: number;
  col: number;
}

export interface Animal {
  id: string;
  name: string;
  emoji: string;
  funFact: string;
  greeting: string;
}

export interface Level {
  id: string;
  worldId: string;
  levelNumber: number;
  title: string;
  gridSize: number;
  animal: Animal;
  grid: CellType[][];
  startPosition: GridPosition;
  habitatPosition: GridPosition;
  starPositions: GridPosition[];
  optimalPathLength: number;
}

export interface World {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  levels: Level[];
  gradientTop: string;
  gradientBottom: string;
  cardColor: string;
}

export interface LevelResult {
  starsEarned: number;
  collectedStars: number;
  totalStars: number;
  pathLength: number;
  optimalPath: number;
}

export interface LevelProgress {
  levelId: string;
  bestStars: number;
  completed: boolean;
}

export interface GameProgress {
  levelProgress: Record<string, LevelProgress>;
  rescuedAnimalIds: string[];
}

export function isAdjacent(a: GridPosition, b: GridPosition): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

export function posEqual(a: GridPosition, b: GridPosition): boolean {
  return a.row === b.row && a.col === b.col;
}

export function posKey(p: GridPosition): string {
  return `${p.row},${p.col}`;
}

export const OBSTACLE_EMOJI: Record<ObstacleType, string> = {
  rock: '🪨',
  water: '💧',
  tree: '🌲',
  bush: '🌿',
  wave: '🌊',
  seaweed: '🌱',
  vine: '🌴',
  ruins: '🏛️',
};
