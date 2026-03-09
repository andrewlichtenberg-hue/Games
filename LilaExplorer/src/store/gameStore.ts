import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLevelFromXp,
  getRewardForLevel,
  MAX_FRIENDSHIP,
} from '../game/progression';
import { NUM_STICKER_BOOK_PAGES } from '../game/stickers';

export interface StickerPlacement {
  instanceId: string;
  stickerId: string;
  xPct: number;       // 0–1 relative to page width
  yPct: number;       // 0–1 relative to page height
  rotation: number;   // degrees, -20 to +20
  scale: number;      // 0.8–1.4
}

const POWERUP_IDS = [
  'powerup-binoculars',
  'powerup-rain-boots',
  'powerup-calculator',
  'powerup-lantern',
  'powerup-whistle',
  'powerup-journal-upgrade',
  'powerup-lucky-clover',
];

const FURNITURE_IDS = [
  'furn-bed',
  'furn-lamp',
  'furn-poster',
  'furn-bookshelf',
  'furn-cactus',
  'furn-trophy',
];
const MAX_EQUIPPED_ACCESSORIES = 2;
const MAX_FURNITURE = 6;

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
  pendingLevelUp: number | null;

  // ── World ────────────────────────────────────────────────────
  unlockedLocations: string[];
  visitedLocations: string[];
  locationVisitCounts: Record<string, number>;

  // ── Animals ──────────────────────────────────────────────────
  discoveredAnimals: string[];
  companionAnimals: string[];
  animalFriendship: Record<string, number>;

  // ── Inventory ────────────────────────────────────────────────
  ownedItems: string[];
  equippedHat: string | null;
  equippedOutfit: string | null;
  equippedAccessories: string[];  // up to 2 cosmetic accessories
  ownedPowerups: string[];
  activePowerups: string[];       // all owned powers are active; player can toggle off individually
  equippedFurniture: string[];    // items placed in Lila's room

  // ── Stickers ─────────────────────────────────────────────────
  ownedStickers: Record<string, number>;        // stickerId → unplaced count
  stickerBookPages: StickerPlacement[][];       // 5 pages

  // ── Journal ──────────────────────────────────────────────────
  journalEntries: string[];
  claimedLocationBonuses: string[];

  // ── Daily streak ─────────────────────────────────────────────
  dailyStreak: number;
  lastPlayDate: string | null;

  // ── Actions ──────────────────────────────────────────────────
  createCharacter: (name: string, hairColor: string, skinTone: string, outfitColor: string) => void;
  gainXP: (amount: number) => void;
  clearPendingLevelUp: () => void;
  discoverAnimal: (animalId: string) => void;
  increaseFriendship: (animalId: string, threshold?: number) => void;
  visitLocation: (locationId: string) => void;
  claimLocationBonus: (locationId: string, xp: number) => void;
  equipItem: (itemId: string, slot: 'hat' | 'outfit' | 'accessory') => void;
  unequipItem: (slot: 'hat' | 'outfit' | 'accessory', itemId?: string) => void;
  toggleActivePowerup: (itemId: string) => void;
  toggleFurniture: (itemId: string) => void;
  unlockItem: (itemId: string) => void;
  checkDailyStreak: () => number;
  earnSticker: (stickerId: string) => void;
  placeStickerOnPage: (pageIndex: number, placement: StickerPlacement) => void;
  removeStickerFromPage: (pageIndex: number, instanceId: string, stickerId: string) => void;
  resetGame: () => void;
}

const DEFAULT_UNLOCKED = ['prospect-park'];
const DEFAULT_OWNED_ITEMS = ['hat-explorer', 'outfit-garden', 'furn-bed', 'item-sticker-book'];

const INITIAL_STATE = {
  playerName: '',
  hairColor: '#F4D03F',
  skinTone: '#F1C27D',
  outfitColor: '#FF6B9D',
  isCharacterCreated: false,
  level: 1,
  xp: 0,
  pendingLevelUp: null as number | null,
  unlockedLocations: DEFAULT_UNLOCKED,
  visitedLocations: [] as string[],
  locationVisitCounts: {} as Record<string, number>,
  discoveredAnimals: [] as string[],
  companionAnimals: [] as string[],
  animalFriendship: {} as Record<string, number>,
  ownedItems: DEFAULT_OWNED_ITEMS,
  equippedHat: 'hat-explorer' as string | null,
  equippedOutfit: 'outfit-garden' as string | null,
  equippedAccessories: [] as string[],
  ownedPowerups: [] as string[],
  activePowerups: [] as string[],
  equippedFurniture: ['furn-bed'] as string[],
  ownedStickers: {} as Record<string, number>,
  stickerBookPages: Array.from({ length: NUM_STICKER_BOOK_PAGES }, () => []) as StickerPlacement[][],
  journalEntries: [] as string[],
  claimedLocationBonuses: [] as string[],
  dailyStreak: 0,
  lastPlayDate: null as string | null,
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      createCharacter: (name, hairColor, skinTone, outfitColor) =>
        set({ playerName: name, hairColor, skinTone, outfitColor, isCharacterCreated: true }),

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

          const rewardPowerups = (reward?.items ?? []).filter(id => POWERUP_IDS.includes(id));
          const newOwnedPowerups = rewardPowerups.length > 0
            ? [...new Set([...state.ownedPowerups, ...rewardPowerups])]
            : state.ownedPowerups;

          // Auto-activate all new powerups (no slot cap)
          const newActivePowerups = [...state.activePowerups];
          for (const pid of rewardPowerups) {
            if (!newActivePowerups.includes(pid)) {
              newActivePowerups.push(pid);
            }
          }

          // Auto-place new furniture in room if space
          const rewardFurniture = (reward?.items ?? []).filter(id => FURNITURE_IDS.includes(id));
          const newEquippedFurniture = [...state.equippedFurniture];
          for (const fid of rewardFurniture) {
            if (newEquippedFurniture.length < MAX_FURNITURE && !newEquippedFurniture.includes(fid)) {
              newEquippedFurniture.push(fid);
            }
          }

          set({
            xp: newXp,
            level: newLevel,
            pendingLevelUp: newLevel,
            unlockedLocations: newUnlocked,
            ownedItems: newItems,
            ownedPowerups: newOwnedPowerups,
            activePowerups: newActivePowerups,
            equippedFurniture: newEquippedFurniture,
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

      increaseFriendship: (animalId, threshold?) => {
        const { animalFriendship, companionAnimals } = get();
        const current = animalFriendship[animalId] ?? 0;
        const next = Math.min(current + 1, MAX_FRIENDSHIP);
        const promotionThreshold = threshold ?? MAX_FRIENDSHIP;
        const newFriendship = { ...animalFriendship, [animalId]: next };
        const newCompanions =
          next >= promotionThreshold && !companionAnimals.includes(animalId)
            ? [...companionAnimals, animalId]
            : companionAnimals;
        set({ animalFriendship: newFriendship, companionAnimals: newCompanions });
      },

      visitLocation: (locationId) => {
        const { visitedLocations, locationVisitCounts } = get();
        const newCounts = {
          ...locationVisitCounts,
          [locationId]: (locationVisitCounts[locationId] ?? 0) + 1,
        };
        const newVisited = visitedLocations.includes(locationId)
          ? visitedLocations
          : [...visitedLocations, locationId];
        set({ visitedLocations: newVisited, locationVisitCounts: newCounts });
      },

      equipItem: (itemId, slot) => {
        if (slot === 'hat') { set({ equippedHat: itemId }); return; }
        if (slot === 'outfit') { set({ equippedOutfit: itemId }); return; }
        if (slot === 'accessory') {
          const { equippedAccessories } = get();
          if (equippedAccessories.includes(itemId)) {
            // Unequip if already on
            set({ equippedAccessories: equippedAccessories.filter(id => id !== itemId) });
          } else {
            const updated = equippedAccessories.length < MAX_EQUIPPED_ACCESSORIES
              ? [...equippedAccessories, itemId]
              : [equippedAccessories[equippedAccessories.length - 1], itemId];
            set({ equippedAccessories: updated });
          }
        }
      },

      unequipItem: (slot, itemId) => {
        if (slot === 'hat') { set({ equippedHat: null }); return; }
        if (slot === 'outfit') { set({ equippedOutfit: null }); return; }
        if (slot === 'accessory' && itemId) {
          const { equippedAccessories } = get();
          set({ equippedAccessories: equippedAccessories.filter(id => id !== itemId) });
        }
      },

      toggleActivePowerup: (itemId) => {
        const { activePowerups, ownedPowerups } = get();
        if (!ownedPowerups.includes(itemId)) return;
        // Simple toggle — no slot cap, all owned powers can be active simultaneously
        if (activePowerups.includes(itemId)) {
          set({ activePowerups: activePowerups.filter(id => id !== itemId) });
        } else {
          set({ activePowerups: [...activePowerups, itemId] });
        }
      },

      toggleFurniture: (itemId) => {
        const { equippedFurniture, ownedItems } = get();
        const owned = ownedItems.includes(itemId) || FURNITURE_IDS.includes(itemId);
        if (!owned) return;
        if (equippedFurniture.includes(itemId)) {
          set({ equippedFurniture: equippedFurniture.filter(id => id !== itemId) });
        } else if (equippedFurniture.length < MAX_FURNITURE) {
          set({ equippedFurniture: [...equippedFurniture, itemId] });
        }
      },

      unlockItem: (itemId) => {
        const { ownedItems, ownedPowerups, activePowerups } = get();
        if (ownedItems.includes(itemId)) return;
        const isPowerup = POWERUP_IDS.includes(itemId);
        const newOwnedPowerups = isPowerup ? [...ownedPowerups, itemId] : ownedPowerups;
        // Auto-activate — all owned powers are active by default
        const newActivePowerups =
          isPowerup && !activePowerups.includes(itemId)
            ? [...activePowerups, itemId]
            : activePowerups;
        set({
          ownedItems: [...ownedItems, itemId],
          ownedPowerups: newOwnedPowerups,
          activePowerups: newActivePowerups,
        });
      },

      claimLocationBonus: (locationId, xp) => {
        const { claimedLocationBonuses } = get();
        if (claimedLocationBonuses.includes(locationId)) return;
        set({ claimedLocationBonuses: [...claimedLocationBonuses, locationId] });
        get().gainXP(xp);
      },

      checkDailyStreak: () => {
        const { lastPlayDate, dailyStreak } = get();
        const today = todayStr();
        if (lastPlayDate === today) return 0;
        const yesterday = yesterdayStr();
        const newStreak = lastPlayDate === yesterday ? dailyStreak + 1 : 1;
        const bonus = newStreak > 1 ? 15 : 0;
        set({ dailyStreak: newStreak, lastPlayDate: today });
        if (bonus > 0) get().gainXP(bonus);
        return bonus;
      },

      earnSticker: (stickerId) => {
        const { ownedStickers } = get();
        set({ ownedStickers: { ...ownedStickers, [stickerId]: (ownedStickers[stickerId] ?? 0) + 1 } });
      },

      placeStickerOnPage: (pageIndex, placement) => {
        const { ownedStickers, stickerBookPages } = get();
        const count = ownedStickers[placement.stickerId] ?? 0;
        if (count <= 0) return;
        const newOwned = { ...ownedStickers, [placement.stickerId]: count - 1 };
        const newPages = stickerBookPages.map((p, i) => i === pageIndex ? [...p, placement] : p);
        set({ ownedStickers: newOwned, stickerBookPages: newPages });
      },

      removeStickerFromPage: (pageIndex, instanceId, stickerId) => {
        const { ownedStickers, stickerBookPages } = get();
        const newPages = stickerBookPages.map((p, i) =>
          i === pageIndex ? p.filter((s) => s.instanceId !== instanceId) : p
        );
        set({
          stickerBookPages: newPages,
          ownedStickers: { ...ownedStickers, [stickerId]: (ownedStickers[stickerId] ?? 0) + 1 },
        });
      },

      resetGame: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'lila-explorer-save-v2',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Migrate powerups from ownedItems
        const missingPowerups = POWERUP_IDS.filter(
          id => state.ownedItems.includes(id) && !state.ownedPowerups.includes(id)
        );
        if (missingPowerups.length > 0) {
          state.ownedPowerups = [...(state.ownedPowerups ?? []), ...missingPowerups];
        }

        // Ensure all owned powerups are active (migration: old saves had a 2-slot cap)
        if (!state.activePowerups) {
          state.activePowerups = [...(state.ownedPowerups ?? [])];
        } else {
          // Activate any owned powers that aren't already active
          for (const pid of state.ownedPowerups ?? []) {
            if (!state.activePowerups.includes(pid)) {
              state.activePowerups.push(pid);
            }
          }
        }

        // Migrate old equippedAccessory (single string) → equippedAccessories (array)
        if (!state.equippedAccessories) {
          const legacy = (state as any).equippedAccessory as string | null;
          state.equippedAccessories = legacy ? [legacy] : [];
        }

        // Sticker fields (new)
        if (!state.ownedStickers) state.ownedStickers = {};
        if (!state.stickerBookPages || state.stickerBookPages.length < NUM_STICKER_BOOK_PAGES) {
          state.stickerBookPages = Array.from(
            { length: NUM_STICKER_BOOK_PAGES },
            (_, i) => state.stickerBookPages?.[i] ?? []
          );
        }
        // Ensure sticker book is in owned items for existing saves
        if (!state.ownedItems.includes('item-sticker-book')) {
          state.ownedItems = [...state.ownedItems, 'item-sticker-book'];
        }

        // Defaults for new fields
        if (!state.equippedFurniture) state.equippedFurniture = [];
        if (!state.equippedFurniture.includes('furn-bed') && state.equippedFurniture.length < 6) { state.equippedFurniture = ['furn-bed', ...state.equippedFurniture]; }
        if (!state.locationVisitCounts) state.locationVisitCounts = {};
        if (state.dailyStreak == null) state.dailyStreak = 0;
        if (state.lastPlayDate == null) state.lastPlayDate = null;
      },
    }
  )
);
