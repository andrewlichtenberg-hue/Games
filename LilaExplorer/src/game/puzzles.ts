/**
 * Animal mini-puzzles — first-grade level (ages 6–7).
 *
 * Types:
 *   choice     – question + 3 text answers (math word problems, reading
 *                comprehension, nature knowledge)
 *   truefalse  – a statement based on the fun-fact; True or Not True?
 *   which      – question + 3 emoji answers (visual / habitat knowledge)
 */

export type Puzzle =
  | { type: 'choice';    question: string; choices: string[]; correct: number }
  | { type: 'which';     question: string; choices: string[]; correct: number }
  | { type: 'truefalse'; statement: string; isTrue: boolean };

export interface AnimalPuzzleSet {
  animalId: string;
  bonusXP: number;
  puzzles: Puzzle[];
}

export const ANIMAL_PUZZLES: AnimalPuzzleSet[] = [

  // ── Prospect Park ─────────────────────────────────────────────────────────
  {
    animalId: 'squirrel',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: 'Sammy buried 4 acorns Monday and 5 Tuesday. How many total?',
        choices: ['8', '9', '10'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'How do squirrels accidentally plant trees?',
        choices: ['They forget where they buried acorns', 'They carry seeds in their fur', 'They plant seeds on purpose'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'pigeon',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: '3 pigeons on a bench. 4 more land. How many now?',
        choices: ['6', '7', '8'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'How far can pigeons fly to find their way home?',
        choices: ['Over 1,000 miles', 'About 10 miles', 'Just around the block'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'dog',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: 'Biscuit found 8 tennis balls. Lost 3. How many left?',
        choices: ['4', '5', '6'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Dogs can smell how many times better than us?',
        choices: ['100,000 times', '10 times', '1,000 times'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'robin',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: 'Why does a robin have a bright red chest?',
        choices: ['To warn other robins away', 'To attract butterflies', 'To stay warm in winter'],
        correct: 0,
      },
      {
        type: 'truefalse',
        statement: 'Robins use their red chests to claim their own tree or yard.',
        isTrue: true,
      },
    ],
  },

  // ── Brooklyn Heights ──────────────────────────────────────────────────────
  {
    animalId: 'cat',
    bonusXP: 15,
    puzzles: [
      {
        type: 'choice',
        question: 'Cleo took 3 naps in the morning and 4 at night. How many naps?',
        choices: ['6', '7', '8'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'A cat can jump up to how many times its own height?',
        choices: ['6 times', '2 times', '20 times'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'raccoon',
    bonusXP: 15,
    puzzles: [
      {
        type: 'choice',
        question: 'Remy found 6 pieces of food. Washed 4. How many still need washing?',
        choices: ['1', '2', '3'],
        correct: 1,
      },
      {
        type: 'truefalse',
        statement: 'Raccoons eat both plants and animals — almost anything they can find!',
        isTrue: true,
      },
    ],
  },
  {
    animalId: 'sparrow',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: '7 sparrows eating seeds. 3 fly away. How many are left?',
        choices: ['3', '4', '5'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Sparrows roll in dust to get rid of...',
        choices: ['Tiny bugs on their feathers', 'Extra feathers', 'Rainwater'],
        correct: 0,
      },
    ],
  },

  // ── Central Park ──────────────────────────────────────────────────────────
  {
    animalId: 'rabbit',
    bonusXP: 15,
    puzzles: [
      {
        type: 'choice',
        question: 'Rosie hopped 5 times left and 6 times right. How many hops total?',
        choices: ['10', '11', '12'],
        correct: 1,
      },
      {
        type: 'choice',
        question: "Why can't rabbits get a stomachache like we can?",
        choices: ["They can't vomit, so they're very careful eaters", 'Their food is always perfectly clean', 'They take medicine every day'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'turtle',
    bonusXP: 15,
    puzzles: [
      {
        type: 'choice',
        question: 'Turtles lived with dinosaurs — over ___ million years ago!',
        choices: ['200 million', '5 million', '1 billion'],
        correct: 0,
      },
      {
        type: 'truefalse',
        statement: 'Turtles have been on Earth much longer than humans have.',
        isTrue: true,
      },
    ],
  },
  {
    animalId: 'hawk',
    bonusXP: 25,
    puzzles: [
      {
        type: 'choice',
        question: 'Hunter spotted 5 mice at dawn and 4 at sunset. How many total?',
        choices: ['8', '9', '10'],
        correct: 1,
      },
      {
        type: 'choice',
        question: "A hawk's eyes are how many times sharper than yours?",
        choices: ['8 times sharper', '2 times sharper', '50 times sharper'],
        correct: 0,
      },
    ],
  },

  // ── Rockaway Beach ────────────────────────────────────────────────────────
  {
    animalId: 'seagull',
    bonusXP: 12,
    puzzles: [
      {
        type: 'choice',
        question: 'Gully found 9 fries and ate 5. How many are left?',
        choices: ['3', '4', '5'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Seagulls stamp their feet to trick worms into thinking...',
        choices: ["It's raining, so worms come up", 'A predator is nearby', 'The ground is too dry'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'beachcat',
    bonusXP: 15,
    puzzles: [
      {
        type: 'truefalse',
        statement: 'Some wild cats — like fishing cats — are excellent swimmers.',
        isTrue: true,
      },
      {
        type: 'choice',
        question: 'What makes Sandy the beach cat unusual?',
        choices: ['She loves swimming and sandy beaches', 'She barks like a dog', 'She can fly'],
        correct: 0,
      },
    ],
  },

  // ── Staten Island ─────────────────────────────────────────────────────────
  {
    animalId: 'chipmunk',
    bonusXP: 12,
    puzzles: [
      {
        type: 'choice',
        question: 'Chester has 12 acorns. He gives 4 to a friend. How many left?',
        choices: ['7', '8', '9'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Chipmunks carry up to 165 acorns at once in their stretchy...',
        choices: ['Cheek pouches', 'Tails', 'Paws'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'deer',
    bonusXP: 15,
    puzzles: [
      {
        type: 'choice',
        question: 'A baby deer is called a...',
        choices: ['Fawn', 'Cub', 'Foal'],
        correct: 0,
      },
      {
        type: 'truefalse',
        statement: "A fawn's spots help it blend into sunlit forest shadows.",
        isTrue: true,
      },
    ],
  },

  // ── Hudson Valley ─────────────────────────────────────────────────────────
  {
    animalId: 'fox',
    bonusXP: 20,
    puzzles: [
      {
        type: 'choice',
        question: 'Fern buried 7 berries and ate 3. How many still buried?',
        choices: ['3', '4', '5'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Foxes use Earth\'s _______ like a compass to hunt under snow.',
        choices: ['Magnetic field', 'Gravity', 'Temperature'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'beaver',
    bonusXP: 20,
    puzzles: [
      {
        type: 'choice',
        question: 'Bruno built 4 dams last year and 6 this year. How many total?',
        choices: ['9', '10', '11'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'What does a beaver dam create for other animals?',
        choices: ['A pond full of homes and food', 'A waterfall', 'A dry field'],
        correct: 0,
      },
    ],
  },

  // ── Catskills ─────────────────────────────────────────────────────────────
  {
    animalId: 'bear',
    bonusXP: 25,
    puzzles: [
      {
        type: 'choice',
        question: 'Bernadette ate 8 berries in the morning and 7 after lunch. How many?',
        choices: ['14', '15', '16'],
        correct: 1,
      },
      {
        type: 'choice',
        question: '"Black" bears can actually be what colors?',
        choices: ['Brown, cinnamon, or even blonde!', 'Only jet black', 'Black and white'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'owl',
    bonusXP: 25,
    puzzles: [
      {
        type: 'choice',
        question: 'Ophelia caught 6 mice Monday and 5 Tuesday. How many total?',
        choices: ['10', '11', '12'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'How far can an owl rotate its head?',
        choices: ['270 degrees — almost all the way!', '90 degrees — like you', 'All the way around (360°)'],
        correct: 0,
      },
    ],
  },

  // ── Adirondacks ───────────────────────────────────────────────────────────
  {
    animalId: 'otter',
    bonusXP: 20,
    puzzles: [
      {
        type: 'choice',
        question: 'Ollie caught 9 fish and shared 4 with her family. How many left?',
        choices: ['4', '5', '6'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Why do otters hold hands while sleeping?',
        choices: ["So they don't drift away from each other", 'To share body heat only', 'To catch more fish'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'moose',
    bonusXP: 25,
    puzzles: [
      {
        type: 'choice',
        question: 'A school bus is 35 feet long. Magnus can dive 20 feet. How much longer is the bus?',
        choices: ['13 feet', '15 feet', '17 feet'],
        correct: 1,
      },
      {
        type: 'truefalse',
        statement: 'Moose can swim for miles — they even dive to eat plants underwater!',
        isTrue: true,
      },
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
