import { getItemsForLevel } from './items';

export const MAX_LEVEL = 10;
export const MAX_FRIENDSHIP = 3;

// XP required to reach each level (index = level, value = total XP needed)
export const XP_THRESHOLDS = [
  0,   // Level 1 start
  80,  // Level 2
  200, // Level 3
  360, // Level 4
  560, // Level 5
  800, // Level 6
  1100,// Level 7
  1450,// Level 8
  1850,// Level 9
  2300,// Level 10
];

export const getXpForLevel = (level: number): number =>
  XP_THRESHOLDS[Math.min(level - 1, MAX_LEVEL - 1)] ?? 0;

export const getXpToNextLevel = (level: number): number => {
  if (level >= MAX_LEVEL) return Infinity;
  return XP_THRESHOLDS[level] - XP_THRESHOLDS[level - 1];
};

export const getLevelFromXp = (xp: number): number => {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, MAX_LEVEL);
};

export const getXpProgressInLevel = (
  xp: number,
  level: number
): { current: number; needed: number; fraction: number } => {
  const start = XP_THRESHOLDS[level - 1] ?? 0;
  const end = XP_THRESHOLDS[level] ?? start + 1;
  const current = xp - start;
  const needed = end - start;
  return { current, needed, fraction: Math.min(current / needed, 1) };
};

export interface LevelReward {
  level: number;
  unlockText: string;
  locationUnlocked?: string;
  items: string[]; // item ids
}

export const LEVEL_REWARDS: LevelReward[] = [
  {
    level: 2,
    unlockText: 'Brooklyn Heights is now open! Go find Cleo and Remy!',
    locationUnlocked: 'brooklyn-heights',
    items: getItemsForLevel(2).map((i) => i.id),
  },
  {
    level: 3,
    unlockText: 'Central Park is unlocked! Turtles and a hawk await you!',
    locationUnlocked: 'central-park',
    items: getItemsForLevel(3).map((i) => i.id),
  },
  {
    level: 4,
    unlockText: 'Rockaway Beach! Hear the waves and meet Gully the Seagull!',
    locationUnlocked: 'rockaway-beach',
    items: getItemsForLevel(4).map((i) => i.id),
  },
  {
    level: 5,
    unlockText: 'Staten Island Greenbelt — a forest inside the city!',
    locationUnlocked: 'staten-island',
    items: getItemsForLevel(5).map((i) => i.id),
  },
  {
    level: 6,
    unlockText: 'Hudson Valley! Foxes and beavers have been waiting!',
    locationUnlocked: 'hudson-valley',
    items: getItemsForLevel(6).map((i) => i.id),
  },
  {
    level: 7,
    unlockText: 'The Catskill Mountains! A friendly bear lives up there…',
    locationUnlocked: 'catskills',
    items: getItemsForLevel(7).map((i) => i.id),
  },
  {
    level: 8,
    unlockText: 'The Adirondacks! The wildest, most beautiful place yet!',
    locationUnlocked: 'adirondacks',
    items: getItemsForLevel(8).map((i) => i.id),
  },
  {
    level: 9,
    unlockText: 'Cape Cod! Seals are playing in the surf right now!',
    locationUnlocked: 'cape-cod',
    items: getItemsForLevel(9).map((i) => i.id),
  },
  {
    level: 10,
    unlockText: '🎉 ACADIA! You\'re the greatest nature explorer EVER!',
    locationUnlocked: 'acadia',
    items: getItemsForLevel(10).map((i) => i.id),
  },
];

export const getRewardForLevel = (level: number): LevelReward | undefined =>
  LEVEL_REWARDS.find((r) => r.level === level);

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Backyard Explorer',
  2: 'Park Wanderer',
  3: 'City Naturalist',
  4: 'Beach Adventurer',
  5: 'Forest Friend',
  6: 'Valley Ranger',
  7: 'Mountain Scout',
  8: 'Wilderness Seeker',
  9: 'Coastal Pioneer',
  10: 'Nature Legend',
};
