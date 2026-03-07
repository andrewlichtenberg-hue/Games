export type ItemType = 'hat' | 'outfit' | 'accessory' | 'powerup';
export type SlotType = 'hat' | 'outfit' | 'accessory';

export interface GameItem {
  id: string;
  name: string;
  type: ItemType;
  slot?: SlotType;
  emoji: string;
  description: string;
  unlocksAtLevel: number;
  color?: string;
  // powerup only
  powerupEffect?: string;
}

export const ITEMS: GameItem[] = [
  // ── Hats ──────────────────────────────────────────────────────
  {
    id: 'hat-explorer',
    name: 'Explorer Hat',
    type: 'hat',
    slot: 'hat',
    emoji: '👒',
    description: 'A classic tan explorer hat. Every nature adventurer needs one!',
    unlocksAtLevel: 1,
    color: '#C8A96E',
  },
  {
    id: 'hat-flower',
    name: 'Flower Crown',
    type: 'hat',
    slot: 'hat',
    emoji: '🌸',
    description: 'A beautiful crown made of wildflowers. Bees think it\'s real!',
    unlocksAtLevel: 3,
    color: '#FF69B4',
  },
  {
    id: 'hat-rainbow-beret',
    name: 'Rainbow Beret',
    type: 'hat',
    slot: 'hat',
    emoji: '🎨',
    description: 'A cozy beret with all the colors of the rainbow. Very artistic!',
    unlocksAtLevel: 5,
    color: '#9B59B6',
  },
  {
    id: 'hat-star',
    name: 'Stargazer Cap',
    type: 'hat',
    slot: 'hat',
    emoji: '⭐',
    description: 'A dark blue cap covered in glittery stars. Perfect for night exploring!',
    unlocksAtLevel: 7,
    color: '#1A237E',
  },
  {
    id: 'hat-rainbow-tiara',
    name: 'Nature Queen Tiara',
    type: 'hat',
    slot: 'hat',
    emoji: '👑',
    description: 'A golden tiara shaped like leaves and vines. You earned it, explorer!',
    unlocksAtLevel: 10,
    color: '#F9CA24',
  },

  // ── Outfits ───────────────────────────────────────────────────
  {
    id: 'outfit-garden',
    name: 'Garden Dress',
    type: 'outfit',
    slot: 'outfit',
    emoji: '🌻',
    description: 'A flowy dress with sunflower print. Great for a day in the park!',
    unlocksAtLevel: 1,
    color: '#F1C40F',
  },
  {
    id: 'outfit-rain',
    name: 'Rainbow Rain Jacket',
    type: 'outfit',
    slot: 'outfit',
    emoji: '🌈',
    description: 'A waterproof jacket with a rainbow stripe. Stay dry AND colorful!',
    unlocksAtLevel: 4,
    color: '#3498DB',
  },
  {
    id: 'outfit-hiking',
    name: 'Mountain Hiking Outfit',
    type: 'outfit',
    slot: 'outfit',
    emoji: '🏔️',
    description: 'Tough pants and a cozy fleece. Ready for any mountain adventure!',
    unlocksAtLevel: 6,
    color: '#27AE60',
  },
  {
    id: 'outfit-astronaut',
    name: 'Space Explorer Suit',
    type: 'outfit',
    slot: 'outfit',
    emoji: '🚀',
    description: 'An out-of-this-world suit for the most legendary explorer. The universe is next!',
    unlocksAtLevel: 10,
    color: '#B2BEC3',
  },

  // ── Accessories ───────────────────────────────────────────────
  {
    id: 'acc-net',
    name: 'Butterfly Net',
    type: 'accessory',
    slot: 'accessory',
    emoji: '🦋',
    description: 'A delicate net for catching — and gently releasing! — butterflies.',
    unlocksAtLevel: 2,
    color: '#A29BFE',
  },
  {
    id: 'acc-magnify',
    name: 'Magnifying Glass',
    type: 'accessory',
    slot: 'accessory',
    emoji: '🔍',
    description: 'Make tiny things look huge! Perfect for studying insects and tracks.',
    unlocksAtLevel: 3,
    color: '#DFE6E9',
  },
  {
    id: 'acc-staff',
    name: 'Nature Walking Staff',
    type: 'accessory',
    slot: 'accessory',
    emoji: '🌿',
    description: 'A sturdy wooden staff carved with vine patterns. Great for mountain trails.',
    unlocksAtLevel: 5,
    color: '#795548',
  },
  {
    id: 'acc-backpack',
    name: 'Adventure Backpack',
    type: 'accessory',
    slot: 'accessory',
    emoji: '🎒',
    description: 'A trusty backpack with pockets for journals, snacks, and treasures!',
    unlocksAtLevel: 4,
    color: '#E17055',
  },
  {
    id: 'acc-camera',
    name: 'Nature Camera',
    type: 'accessory',
    slot: 'accessory',
    emoji: '📷',
    description: 'Snap photos of animals for your journal! Every explorer needs one.',
    unlocksAtLevel: 6,
    color: '#2D3436',
  },

  // ── Power-ups ─────────────────────────────────────────────────
  {
    id: 'powerup-binoculars',
    name: 'Binoculars',
    type: 'powerup',
    emoji: '🔭',
    description: 'A bonus animal zooms into every scene you visit — spotted from far away!',
    unlocksAtLevel: 2,
    powerupEffect: 'bonus_animal',
  },
  {
    id: 'powerup-rain-boots',
    name: 'Rainbow Rain Boots',
    type: 'powerup',
    emoji: '🌧️',
    description: 'Earn 25% bonus XP from every animal you meet. A little rain shower of stars appears!',
    unlocksAtLevel: 3,
    powerupEffect: 'xp_boost',
  },
  {
    id: 'powerup-lantern',
    name: 'Magic Lantern',
    type: 'powerup',
    emoji: '🏮',
    description: 'One free puzzle hint per area visit — tap the glowing lantern to light up a wrong answer!',
    unlocksAtLevel: 5,
    powerupEffect: 'puzzle_hint',
  },
  {
    id: 'powerup-journal-upgrade',
    name: 'Golden Journal',
    type: 'powerup',
    emoji: '📒',
    description: 'Puzzle bonus XP is DOUBLED and a golden star shower falls every time you get one right!',
    unlocksAtLevel: 7,
    powerupEffect: 'double_puzzle_xp',
  },
];

export const getItemById = (id: string): GameItem | undefined =>
  ITEMS.find((i) => i.id === id);

export const getCosmeticItems = (): GameItem[] =>
  ITEMS.filter((i) => i.type !== 'powerup');

export const getPowerupItems = (): GameItem[] =>
  ITEMS.filter((i) => i.type === 'powerup');

export const getItemsForLevel = (level: number): GameItem[] =>
  ITEMS.filter((i) => i.unlocksAtLevel === level);
