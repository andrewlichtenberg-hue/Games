import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLevelFromXp,
  getRewardForLevel,
  MAX_FRIENDSHIP,
} from '../game/progression';

// IDs of all power-up items — kept here to avoid circular import
const POWERUP_IDS = [
  'powerup-binoculars',
  'powerup-rain-boots',
  'powerup-lantern',
  'powerup-journal-upgrade',
];

export interface GameState {
  // ── Player identity ─────────────────────────────────────────
  playerName: string;
  hairColor: string;
  skinTone: string;
  outfitColor: string;
  isCharacterCreated: boolean;

  // ── Progression ─────────────────────────────────────────────
  level: number;
  xp: number;
  pendingLevelUp: number | null; // level just reached, needs to show modal

  // ── World ────────────────────────────────────────────────────
  unlockedLocations: string[];
  visitedLocations: string[];

  // ── Animals ──────────────────────────────────────────────────
  discoveredAnimals: string[];
  companionAnimals: string[];
  animalFriendship: Record<string, number>;

  // ── Inventory ────────────────────────────────────────────────
  ownedItems: string[];
  equippedHat: string | null;
  equippedOutfit: string | null;
  equippedAccessory: string | null;
  ownedPowerups: string[];

  // ── Journal ──────────────────────────────────────────────────
  journalEntries: string[]; // animal ids in discovery order
  claimedLocationBonuses: string[]; // locationIds whose completion XP was collected

  // ── Actions ──────────────────────────────────────────────────
  createCharacter: (name: string, hairColor: string, skinTone: string, outfitColor: string) => void;
  gainXP: (amount: number) => void;
  clearPendingLevelUp: () => void;
  discoverAnimal: (animalId: string) => void;
  increaseFriendship: (animalId: string) => void;
  visitLocation: (locationId: string) => void;
  claimLocationBonus: (locationId: string, xp: number) => void;
  equipItem: (itemId: string, slot: 'hat' | 'outfit' | 'accessory') => void;
  unequipItem: (slot: 'hat' | 'outfit' | 'accessory') => void;
  unlockItem: (itemId: string) => void;
  resetGame: () => void;
}

const DEFAULT_UNLOCKED = ['prospect-park'];
const DEFAULT_OWNED_ITEMS = ['hat-explorer', 'outfit-garden'];

const INITIAL_STATE = {
  playerName: '',
  hairColor: '#F4D03F',
  skinTone: '#F1C27D',
  outfitColor: '#FF6B9D',
  isCharacterCreated: false,
  level: 1,
  xp: 0,
  pendingLevelUp: null,
  unlockedLocations: DEFAULT_UNLOCKED,
  visitedLocations: [],
  discoveredAnimals: [],
  companionAnimals: [],
  animalFriendship: {},
  ownedItems: DEFAULT_OWNED_ITEMS,
  equippedHat: 'hat-explorer',
  equippedOutfit: 'outfit-garden',
  equippedAccessory: null,
  ownedPowerups: [],
  journalEntries: [],
  claimedLocationBonuses: [],
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      createCharacter: (name, hairColor, skinTone, outfitColor) =>
        set({
          playerName: name,
          hairColor,
          skinTone,
          outfitColor,
          isCharacterCreated: true,
        }),

      gainXP: (amount) => {
        const state = get();
        const newXp = state.xp + amount;
        const newLevel = getLevelFromXp(newXp);
        const didLevelUp = newLevel > state.level;

        if (didLevelUp) {
          const reward = getRewardForLevel(newLevel);
          const newUnlocked = reward?.locationUnlocked
            ? [...state.unlockedLocations, reward.locationUnlocked]
            : state.unlockedLocations;
          const newItems = reward?.items
            ? [...new Set([...state.ownedItems, ...reward.items])]
            : state.ownedItems;

          // Also populate ownedPowerups when level rewards include powerup IDs
          const rewardPowerups = (reward?.items ?? []).filter(id =>
            POWERUP_IDS.includes(id)
          );
          const newOwnedPowerups = rewardPowerups.length > 0
            ? [...new Set([...state.ownedPowerups, ...rewardPowerups])]
            : state.ownedPowerups;

          set({
            xp: newXp,
            level: newLevel,
            pendingLevelUp: newLevel,
            unlockedLocations: newUnlocked,
            ownedItems: newItems,
            ownedPowerups: newOwnedPowerups,
          });
        } else {
          set({ xp: newXp });
        }
      },

      clearPendingLevelUp: () => set({ pendingLevelUp: null }),

      discoverAnimal: (animalId) => {
        const { discoveredAnimals, journalEntries } = get();
        if (!discoveredAnimals.includes(animalId)) {
          set({
            discoveredAnimals: [...discoveredAnimals, animalId],
            journalEntries: [...journalEntries, animalId],
          });
        }
      },

      increaseFriendship: (animalId) => {
        const { animalFriendship, companionAnimals } = get();
        const current = animalFriendship[animalId] ?? 0;
        const next = Math.min(current + 1, MAX_FRIENDSHIP);
        const newFriendship = { ...animalFriendship, [animalId]: next };
        const newCompanions =
          next >= MAX_FRIENDSHIP && !companionAnimals.includes(animalId)
            ? [...companionAnimals, animalId]
            : companionAnimals;
        set({ animalFriendship: newFriendship, companionAnimals: newCompanions });
      },

      visitLocation: (locationId) => {
        const { visitedLocations } = get();
        if (!visitedLocations.includes(locationId)) {
          set({ visitedLocations: [...visitedLocations, locationId] });
        }
      },

      equipItem: (itemId, slot) => {
        if (slot === 'hat') set({ equippedHat: itemId });
        if (slot === 'outfit') set({ equippedOutfit: itemId });
        if (slot === 'accessory') set({ equippedAccessory: itemId });
      },

      unequipItem: (slot) => {
        if (slot === 'hat') set({ equippedHat: null });
        if (slot === 'outfit') set({ equippedOutfit: null });
        if (slot === 'accessory') set({ equippedAccessory: null });
      },

      unlockItem: (itemId) => {
        const { ownedItems, ownedPowerups } = get();
        if (!ownedItems.includes(itemId)) {
          const isPowerup = POWERUP_IDS.includes(itemId);
          set({
            ownedItems: [...ownedItems, itemId],
            ownedPowerups: isPowerup ? [...ownedPowerups, itemId] : ownedPowerups,
          });
        }
      },

      claimLocationBonus: (locationId, xp) => {
        const { claimedLocationBonuses } = get();
        if (claimedLocationBonuses.includes(locationId)) return;
        set({ claimedLocationBonuses: [...claimedLocationBonuses, locationId] });
        get().gainXP(xp);
      },

      resetGame: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'lila-explorer-save-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Migration: for existing saves, sync any powerup IDs from ownedItems → ownedPowerups
      onRehydrateStorage: () => (state) => {
        if (state) {
          const missing = POWERUP_IDS.filter(
            id => state.ownedItems.includes(id) && !state.ownedPowerups.includes(id)
          );
          if (missing.length > 0) {
            state.ownedPowerups = [...state.ownedPowerups, ...missing];
          }
        }
      },
    }
  )
);
