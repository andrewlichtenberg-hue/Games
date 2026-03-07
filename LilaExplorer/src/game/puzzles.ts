/**
 * Optional mini-puzzles given by animals.
 * Three types, all visual / symbol-based so pre-readers can play too:
 *   count     – count N emoji, pick the right number
 *   which     – three emoji choices, tap the correct one
 *   truefalse – a fun-fact statement, True or Not True?
 */

export type Puzzle =
  | { type: 'count'; emoji: string; n: number }
  | { type: 'which'; question: string; choices: string[]; correct: number }
  | { type: 'truefalse'; statement: string; isTrue: boolean };

export interface AnimalPuzzleSet {
  animalId: string;
  bonusXP: number;
  puzzles: Puzzle[];
}

export const ANIMAL_PUZZLES: AnimalPuzzleSet[] = [
  // ── Prospect Park ─────────────────────────────────────────────────
  {
    animalId: 'squirrel',
    bonusXP: 8,
    puzzles: [
      { type: 'count', emoji: '🐿️', n: 3 },
      { type: 'truefalse', statement: 'Squirrels help plant trees by losing their buried acorns! 🌳', isTrue: true },
    ],
  },
  {
    animalId: 'pigeon',
    bonusXP: 8,
    puzzles: [
      { type: 'count', emoji: '🕊️', n: 2 },
      { type: 'which', question: 'Which one can fly?', choices: ['🕊️', '🐠', '🐢'], correct: 0 },
    ],
  },
  {
    animalId: 'dog',
    bonusXP: 8,
    puzzles: [
      { type: 'count', emoji: '🐕', n: 4 },
      { type: 'which', question: 'Which one says WOOF?', choices: ['🐕', '🐱', '🐮'], correct: 0 },
    ],
  },
  {
    animalId: 'robin',
    bonusXP: 8,
    puzzles: [
      { type: 'count', emoji: '🐦', n: 3 },
      { type: 'which', question: 'Which one has feathers?', choices: ['🐦', '🐢', '🐿️'], correct: 0 },
    ],
  },

  // ── Brooklyn Heights ───────────────────────────────────────────────
  {
    animalId: 'cat',
    bonusXP: 15,
    puzzles: [
      { type: 'which', question: 'Which one says MEOW?', choices: ['🐈', '🐕', '🐸'], correct: 0 },
      { type: 'truefalse', statement: 'Cats can jump 6 times their own height! 🐱', isTrue: true },
    ],
  },
  {
    animalId: 'raccoon',
    bonusXP: 15,
    puzzles: [
      { type: 'count', emoji: '🦝', n: 2 },
      { type: 'truefalse', statement: 'Raccoons wash their food before eating it! 🍎', isTrue: true },
    ],
  },
  {
    animalId: 'sparrow',
    bonusXP: 8,
    puzzles: [
      { type: 'count', emoji: '🐦', n: 5 },
      { type: 'which', question: 'Which one takes dust baths to clean its feathers?', choices: ['🐦', '🐠', '🐘'], correct: 0 },
    ],
  },

  // ── Central Park ───────────────────────────────────────────────────
  {
    animalId: 'rabbit',
    bonusXP: 15,
    puzzles: [
      { type: 'count', emoji: '🐇', n: 3 },
      { type: 'which', question: 'Which one hops on two big back feet?', choices: ['🐇', '🐢', '🐟'], correct: 0 },
    ],
  },
  {
    animalId: 'turtle',
    bonusXP: 15,
    puzzles: [
      { type: 'count', emoji: '🐢', n: 2 },
      { type: 'which', question: 'Which one carries its home on its back?', choices: ['🐢', '🐇', '🦊'], correct: 0 },
    ],
  },
  {
    animalId: 'hawk',
    bonusXP: 25,
    puzzles: [
      { type: 'which', question: 'Which one soars highest in the sky?', choices: ['🦅', '🐢', '🐿️'], correct: 0 },
      { type: 'truefalse', statement: 'Hawks can spot a tiny mouse from high in the sky! 👀', isTrue: true },
    ],
  },

  // ── Rockaway Beach ─────────────────────────────────────────────────
  {
    animalId: 'seagull',
    bonusXP: 8,
    puzzles: [
      { type: 'count', emoji: '🦢', n: 4 },
      { type: 'which', question: 'Which one lives near the ocean?', choices: ['🦢', '🐿️', '🦊'], correct: 0 },
    ],
  },
  {
    animalId: 'beachcat',
    bonusXP: 15,
    puzzles: [
      { type: 'which', question: 'Which one might swim AND climb?', choices: ['🐱', '🐦', '🐠'], correct: 0 },
      { type: 'truefalse', statement: 'Some cats love to swim and dive for fish! 🐟', isTrue: true },
    ],
  },

  // ── Staten Island ──────────────────────────────────────────────────
  {
    animalId: 'chipmunk',
    bonusXP: 8,
    puzzles: [
      { type: 'count', emoji: '🐿️', n: 3 },
      { type: 'truefalse', statement: 'Chipmunks can carry over 100 acorns in their stretchy cheeks! 🐿️', isTrue: true },
    ],
  },
  {
    animalId: 'deer',
    bonusXP: 15,
    puzzles: [
      { type: 'count', emoji: '🦌', n: 2 },
      { type: 'which', question: 'Which baby animal is called a fawn?', choices: ['🦌', '🐰', '🐻'], correct: 0 },
    ],
  },

  // ── Hudson Valley ──────────────────────────────────────────────────
  {
    animalId: 'fox',
    bonusXP: 20,
    puzzles: [
      { type: 'count', emoji: '🦊', n: 3 },
      { type: 'truefalse', statement: 'Foxes use the Earth like a compass to find mice under snow! 🧭', isTrue: true },
    ],
  },
  {
    animalId: 'beaver',
    bonusXP: 20,
    puzzles: [
      { type: 'count', emoji: '🦫', n: 2 },
      { type: 'which', question: 'Which one builds dams in rivers?', choices: ['🦫', '🐦', '🐸'], correct: 0 },
    ],
  },

  // ── Catskills ──────────────────────────────────────────────────────
  {
    animalId: 'bear',
    bonusXP: 25,
    puzzles: [
      { type: 'count', emoji: '🐻', n: 2 },
      { type: 'truefalse', statement: 'Bears are great swimmers! 🐻', isTrue: true },
    ],
  },
  {
    animalId: 'owl',
    bonusXP: 25,
    puzzles: [
      { type: 'which', question: 'Which one comes out at night?', choices: ['🦉', '🐸', '🦋'], correct: 0 },
      { type: 'truefalse', statement: 'Owls can turn their heads almost all the way around! 🦉', isTrue: true },
    ],
  },

  // ── Adirondacks ────────────────────────────────────────────────────
  {
    animalId: 'otter',
    bonusXP: 20,
    puzzles: [
      { type: 'count', emoji: '🦦', n: 4 },
      { type: 'truefalse', statement: 'Otters hold hands while sleeping so they don\'t drift apart! 🦦', isTrue: true },
    ],
  },
  {
    animalId: 'moose',
    bonusXP: 25,
    puzzles: [
      { type: 'count', emoji: '🫎', n: 2 },
      { type: 'which', question: 'Which one can dive underwater to eat plants?', choices: ['🫎', '🐺', '🦁'], correct: 0 },
    ],
  },
];

export const getPuzzleSet = (animalId: string): AnimalPuzzleSet | undefined =>
  ANIMAL_PUZZLES.find((p) => p.animalId === animalId);

export const getRandomPuzzle = (
  animalId: string,
): { puzzle: Puzzle; bonusXP: number } | null => {
  const set = getPuzzleSet(animalId);
  if (!set || set.puzzles.length === 0) return null;
  const puzzle = set.puzzles[Math.floor(Math.random() * set.puzzles.length)];
  return { puzzle, bonusXP: set.bonusXP };
};
