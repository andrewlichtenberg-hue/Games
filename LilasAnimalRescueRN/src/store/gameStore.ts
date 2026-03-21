import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GridPosition, LevelProgress, LevelResult,
  isAdjacent, posEqual, posKey,
} from '../game/types';
import { allWorlds } from '../game/worlds';

interface GameState {
  // Persisted
  levelProgress: Record<string, LevelProgress>;
  rescuedAnimalIds: string[];

  // Transient puzzle state
  selectedWorldIndex: number;
  selectedLevelIndex: number;
  path: GridPosition[];
  collectedStars: string[]; // posKey strings
  isAnimatingPath: boolean;
  animationStep: number;
  showLevelComplete: boolean;
  lastResult: LevelResult | null;

  // Actions
  selectWorld: (index: number) => void;
  selectLevel: (index: number) => void;
  tapCell: (position: GridPosition) => void;
  resetPuzzle: () => void;
  animatePath: () => void;
  completeLevel: () => void;
  nextLevel: () => void;

  // Queries
  starsForWorld: (worldId: string) => number;
  completedLevelsInWorld: (worldId: string) => number;
  isWorldUnlocked: (worldIndex: number) => boolean;
  isLevelUnlocked: (worldIndex: number, levelIndex: number) => boolean;
  isPathComplete: () => boolean;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Persisted state
      levelProgress: {},
      rescuedAnimalIds: [],

      // Transient state
      selectedWorldIndex: 0,
      selectedLevelIndex: 0,
      path: [],
      collectedStars: [],
      isAnimatingPath: false,
      animationStep: 0,
      showLevelComplete: false,
      lastResult: null,

      // Actions
      selectWorld: (index) => set({ selectedWorldIndex: index }),

      selectLevel: (index) => {
        set({
          selectedLevelIndex: index,
          path: [],
          collectedStars: [],
          isAnimatingPath: false,
          animationStep: 0,
          showLevelComplete: false,
          lastResult: null,
        });
      },

      tapCell: (position) => {
        const state = get();
        if (state.isAnimatingPath) return;

        const world = allWorlds[state.selectedWorldIndex];
        const level = world.levels[state.selectedLevelIndex];
        const cellType = level.grid[position.row][position.col];

        // Can't tap obstacles or start position
        if (cellType.kind === 'obstacle') return;
        if (cellType.kind === 'animalStart') return;

        const { path, collectedStars } = state;

        // Tap last cell = undo
        if (path.length > 0 && posEqual(path[path.length - 1], position)) {
          const newPath = path.slice(0, -1);
          const newStars = collectedStars.filter(k => k !== posKey(position));
          set({ path: newPath, collectedStars: newStars });
          return;
        }

        // Tap cell already in path = truncate
        const existingIndex = path.findIndex(p => posEqual(p, position));
        if (existingIndex >= 0) {
          const removed = path.slice(existingIndex);
          const removedKeys = new Set(removed.map(p => posKey(p)));
          const newStars = collectedStars.filter(k => !removedKeys.has(k));
          set({ path: path.slice(0, existingIndex), collectedStars: newStars });
          return;
        }

        // Check adjacency
        const anchor = path.length > 0 ? path[path.length - 1] : level.startPosition;
        if (!isAdjacent(position, anchor)) return;

        // Add to path
        const newPath = [...path, position];
        const newStars = [...collectedStars];

        // Collect star if present
        if (level.starPositions.some(sp => posEqual(sp, position))) {
          const key = posKey(position);
          if (!newStars.includes(key)) {
            newStars.push(key);
          }
        }

        set({ path: newPath, collectedStars: newStars });
      },

      resetPuzzle: () => {
        set({
          path: [],
          collectedStars: [],
          isAnimatingPath: false,
          animationStep: 0,
          showLevelComplete: false,
          lastResult: null,
        });
      },

      animatePath: () => {
        const state = get();
        if (!state.isPathComplete() || state.isAnimatingPath) return;

        set({ isAnimatingPath: true, animationStep: 0 });

        const animateStep = () => {
          const current = get();
          if (current.animationStep >= current.path.length) {
            current.completeLevel();
            return;
          }
          set({ animationStep: current.animationStep + 1 });
          setTimeout(animateStep, 150);
        };

        setTimeout(animateStep, 150);
      },

      completeLevel: () => {
        const state = get();
        const world = allWorlds[state.selectedWorldIndex];
        const level = world.levels[state.selectedLevelIndex];

        const collected = state.collectedStars.length;
        const total = level.starPositions.length;
        const pathLen = state.path.length;

        let stars = 1; // Always 1 for completing
        if (collected === total) stars += 1;
        if (pathLen <= level.optimalPathLength + 2) stars += 1;

        const result: LevelResult = {
          starsEarned: stars,
          collectedStars: collected,
          totalStars: total,
          pathLength: pathLen,
          optimalPath: level.optimalPathLength,
        };

        const existing = state.levelProgress[level.id];
        const bestStars = Math.max(existing?.bestStars ?? 0, stars);

        const newProgress = {
          ...state.levelProgress,
          [level.id]: { levelId: level.id, bestStars, completed: true },
        };

        const newRescued = state.rescuedAnimalIds.includes(level.animal.id)
          ? state.rescuedAnimalIds
          : [...state.rescuedAnimalIds, level.animal.id];

        set({
          lastResult: result,
          showLevelComplete: true,
          levelProgress: newProgress,
          rescuedAnimalIds: newRescued,
        });
      },

      nextLevel: () => {
        const state = get();
        const world = allWorlds[state.selectedWorldIndex];
        if (state.selectedLevelIndex < world.levels.length - 1) {
          get().selectLevel(state.selectedLevelIndex + 1);
        } else {
          set({ showLevelComplete: false });
        }
      },

      // Queries
      starsForWorld: (worldId) => {
        const state = get();
        const world = allWorlds.find(w => w.id === worldId);
        if (!world) return 0;
        return world.levels.reduce((sum, level) => {
          return sum + (state.levelProgress[level.id]?.bestStars ?? 0);
        }, 0);
      },

      completedLevelsInWorld: (worldId) => {
        const state = get();
        const world = allWorlds.find(w => w.id === worldId);
        if (!world) return 0;
        return world.levels.filter(level =>
          state.levelProgress[level.id]?.completed === true,
        ).length;
      },

      isWorldUnlocked: (worldIndex) => {
        if (worldIndex === 0) return true;
        const prevWorld = allWorlds[worldIndex - 1];
        return get().completedLevelsInWorld(prevWorld.id) >= 3;
      },

      isLevelUnlocked: (worldIndex, levelIndex) => {
        if (levelIndex === 0) return true;
        const world = allWorlds[worldIndex];
        const prevLevel = world.levels[levelIndex - 1];
        return get().levelProgress[prevLevel.id]?.completed === true;
      },

      isPathComplete: () => {
        const state = get();
        if (state.path.length === 0) return false;
        const world = allWorlds[state.selectedWorldIndex];
        const level = world.levels[state.selectedLevelIndex];
        return posEqual(state.path[state.path.length - 1], level.habitatPosition);
      },
    }),
    {
      name: 'lilas-animal-rescue-save-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        levelProgress: state.levelProgress,
        rescuedAnimalIds: state.rescuedAnimalIds,
      }),
    },
  ),
);
