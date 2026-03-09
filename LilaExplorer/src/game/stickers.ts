export type StickerCategory = 'companion' | 'nature' | 'sparkle' | 'food' | 'adventure';
export type StickerRarity = 'common' | 'rare' | 'legendary';

export interface Sticker {
  id: string;
  name: string;
  emoji: string;
  category: StickerCategory;
  rarity: StickerRarity;
  description: string;
}

export const STICKERS: Sticker[] = [
  // ── Nature ────────────────────────────────────────────────────
  { id: 'stk-rainbow',    name: 'Rainbow',       emoji: '🌈', category: 'nature',    rarity: 'rare',      description: 'A beautiful rainbow after the rain!' },
  { id: 'stk-sun',        name: 'Sunshine',      emoji: '☀️', category: 'nature',    rarity: 'common',    description: 'A happy glowing sun!' },
  { id: 'stk-flower',     name: 'Wildflower',    emoji: '🌸', category: 'nature',    rarity: 'common',    description: 'A pretty pink wildflower.' },
  { id: 'stk-leaf',       name: 'Oak Leaf',      emoji: '🍁', category: 'nature',    rarity: 'common',    description: 'A crispy autumn leaf.' },
  { id: 'stk-mushroom',   name: 'Mushroom',      emoji: '🍄', category: 'nature',    rarity: 'rare',      description: 'A magical forest mushroom!' },
  { id: 'stk-tree',       name: 'Big Tree',      emoji: '🌳', category: 'nature',    rarity: 'common',    description: 'A tall leafy tree.' },
  { id: 'stk-butterfly',  name: 'Butterfly',     emoji: '🦋', category: 'nature',    rarity: 'rare',      description: 'A fluttery monarch butterfly!' },
  { id: 'stk-pawprint',   name: 'Paw Print',     emoji: '🐾', category: 'nature',    rarity: 'common',    description: 'An animal track left in the mud.' },
  { id: 'stk-wave',       name: 'Ocean Wave',    emoji: '🌊', category: 'nature',    rarity: 'common',    description: 'A big splashy ocean wave!' },
  { id: 'stk-snowflake',  name: 'Snowflake',     emoji: '❄️', category: 'nature',    rarity: 'rare',      description: 'Every snowflake is totally unique!' },
  { id: 'stk-cloud',      name: 'Fluffy Cloud',  emoji: '☁️', category: 'nature',    rarity: 'common',    description: 'A big fluffy cloud.' },

  // ── Sparkle ───────────────────────────────────────────────────
  { id: 'stk-star',       name: 'Gold Star',     emoji: '⭐', category: 'sparkle',   rarity: 'common',    description: 'You\'re a star!' },
  { id: 'stk-sparkle',    name: 'Sparkles',      emoji: '✨', category: 'sparkle',   rarity: 'common',    description: 'Magic sparkles everywhere!' },
  { id: 'stk-heart',      name: 'Heart',         emoji: '❤️', category: 'sparkle',   rarity: 'common',    description: 'A big red heart full of love!' },
  { id: 'stk-crown',      name: 'Golden Crown',  emoji: '👑', category: 'sparkle',   rarity: 'legendary', description: 'A golden crown for the greatest explorer!' },
  { id: 'stk-gem',        name: 'Blue Gem',      emoji: '💎', category: 'sparkle',   rarity: 'rare',      description: 'A sparkling blue gem!' },
  { id: 'stk-moon',       name: 'Crescent Moon', emoji: '🌙', category: 'sparkle',   rarity: 'rare',      description: 'The sleepy crescent moon.' },
  { id: 'stk-rainbow-heart', name: 'Rainbow Heart', emoji: '🌈❤️', category: 'sparkle', rarity: 'legendary', description: 'A heart bursting with rainbow colors!' },

  // ── Food ──────────────────────────────────────────────────────
  { id: 'stk-apple',      name: 'Red Apple',     emoji: '🍎', category: 'food',      rarity: 'common',    description: 'A juicy red apple — a perfect animal treat!' },
  { id: 'stk-berry',      name: 'Berries',       emoji: '🍓', category: 'food',      rarity: 'common',    description: 'Sweet wild berries from the forest.' },
  { id: 'stk-acorn',      name: 'Acorn',         emoji: '🌰', category: 'food',      rarity: 'common',    description: 'A crunchy acorn — squirrels love these!' },
  { id: 'stk-honey',      name: 'Honeypot',      emoji: '🍯', category: 'food',      rarity: 'rare',      description: 'Sweet golden honey from the bees.' },
  { id: 'stk-carrot',     name: 'Carrot',        emoji: '🥕', category: 'food',      rarity: 'common',    description: 'A crunchy orange carrot.' },
  { id: 'stk-fish',       name: 'Fish',          emoji: '🐟', category: 'food',      rarity: 'common',    description: 'A fresh fish — seabirds adore these!' },

  // ── Adventure ─────────────────────────────────────────────────
  { id: 'stk-map',        name: 'Treasure Map',  emoji: '🗺️', category: 'adventure', rarity: 'rare',      description: 'X marks the spot!' },
  { id: 'stk-compass',    name: 'Compass',       emoji: '🧭', category: 'adventure', rarity: 'rare',      description: 'Always points the way home.' },
  { id: 'stk-binoculars', name: 'Binoculars',    emoji: '🔭', category: 'adventure', rarity: 'common',    description: 'Spot animals from far away!' },
  { id: 'stk-backpack',   name: 'Backpack',      emoji: '🎒', category: 'adventure', rarity: 'common',    description: 'A trusty adventure backpack.' },
  { id: 'stk-trophy',     name: 'Trophy',        emoji: '🏆', category: 'adventure', rarity: 'legendary', description: 'A trophy for your amazing adventures!' },
  { id: 'stk-mountain',   name: 'Mountain',      emoji: '🏔️', category: 'adventure', rarity: 'rare',      description: 'A tall snowy mountain peak.' },
  { id: 'stk-tent',       name: 'Explorer Tent', emoji: '⛺', category: 'adventure', rarity: 'common',    description: 'A cozy camp tent under the stars.' },
];

export const getStickerById = (id: string): Sticker | undefined =>
  STICKERS.find((s) => s.id === id);

// ── Companion sticker helpers ──────────────────────────────────

export const companionStickerId = (animalId: string): string =>
  `stk-companion-${animalId}`;

export const isCompanionSticker = (id: string): boolean =>
  id.startsWith('stk-companion-');

export const animalIdFromSticker = (stickerId: string): string =>
  stickerId.replace('stk-companion-', '');

// ── Sticker book pages ────────────────────────────────────────

export interface StickerBookPage {
  id: string;
  name: string;
  emoji: string;
  skyColors: [string, string];    // gradient top → bottom
  groundColor: string;
  accentDeco: string;             // decorative emoji overlay
}

export const STICKER_BOOK_PAGES: StickerBookPage[] = [
  {
    id: 'page-meadow',
    name: 'Sunny Meadow',
    emoji: '🌻',
    skyColors: ['#87CEEB', '#E0F7FA'],
    groundColor: '#81C784',
    accentDeco: '🌻🌼🌸',
  },
  {
    id: 'page-ocean',
    name: 'Ocean Cove',
    emoji: '🌊',
    skyColors: ['#29B6F6', '#0288D1'],
    groundColor: '#0077B6',
    accentDeco: '🐚🌊🐠',
  },
  {
    id: 'page-forest',
    name: 'Enchanted Forest',
    emoji: '🌲',
    skyColors: ['#2E7D32', '#388E3C'],
    groundColor: '#1B5E20',
    accentDeco: '🍄🌿🦋',
  },
  {
    id: 'page-mountain',
    name: 'Mountain Peak',
    emoji: '🏔️',
    skyColors: ['#7986CB', '#5C6BC0'],
    groundColor: '#90A4AE',
    accentDeco: '❄️🏔️🦅',
  },
  {
    id: 'page-night',
    name: 'Starry Night',
    emoji: '🌙',
    skyColors: ['#1A237E', '#0D0D2B'],
    groundColor: '#263238',
    accentDeco: '⭐🌙✨',
  },
];

export const NUM_STICKER_BOOK_PAGES = STICKER_BOOK_PAGES.length;

// ── Sticker reward pool per category ─────────────────────────

const COMMON_STICKER_POOL = STICKERS.filter((s) => s.rarity === 'common').map((s) => s.id);
const RARE_STICKER_POOL   = STICKERS.filter((s) => s.rarity === 'rare').map((s) => s.id);
const LEGENDARY_POOL      = STICKERS.filter((s) => s.rarity === 'legendary').map((s) => s.id);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a sticker id for a puzzle reward.
 * 50% chance of the companion's own sticker,
 * 35% common, 12% rare, 3% legendary.
 */
export function rollRewardSticker(companionAnimalId: string): string {
  const roll = Math.random();
  if (roll < 0.50) return companionStickerId(companionAnimalId);
  if (roll < 0.85) return pick(COMMON_STICKER_POOL);
  if (roll < 0.97) return pick(RARE_STICKER_POOL);
  return pick(LEGENDARY_POOL);
}
