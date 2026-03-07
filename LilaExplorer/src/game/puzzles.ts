/**
 * Animal mini-puzzles — second-grade level (ages 7–8, chapter-book readers).
 *
 * Mix of:
 *   choice     – math word problems (add/subtract to 50, simple ×÷),
 *                reading comprehension, vocabulary, logic / deduction
 *   truefalse  – nuanced true-or-not-true from the fun-fact
 *   which      – emoji-based logic or classification
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
        question: 'Sammy buried 34 acorns in fall and found only 17 in winter. How many acorns might become trees?',
        choices: ['17', '15', '19'],
        correct: 0,
      },
      {
        type: 'choice',
        question: 'A squirrel forgets 1 out of every 4 buried acorns. If she buries 20 acorns, about how many trees might grow?',
        choices: ['4', '5', '8'],
        correct: 1,
      },
    ],
  },
  {
    animalId: 'pigeon',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: 'Pearl must fly 50 miles home. She has flown 23 miles already. How many miles does she have left?',
        choices: ['25', '27', '30'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'A pigeon flies about 50 miles per day. Roughly how many days would it take to fly 200 miles?',
        choices: ['2 days', '4 days', '10 days'],
        correct: 1,
      },
    ],
  },
  {
    animalId: 'dog',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: 'Biscuit buries 3 bones every day. How many bones has he buried after 2 weeks (14 days)?',
        choices: ['38', '42', '45'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Dogs smell 100,000× better than humans. If you can smell a pie from 10 feet away, a dog could smell it from how far?',
        choices: ['1,000 feet', '100,000 feet', '1 mile'],
        correct: 1,
      },
    ],
  },
  {
    animalId: 'robin',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: 'Rosa spots 12 worms Monday, 9 Tuesday, and 14 Wednesday. How many worms in total?',
        choices: ['33', '35', '37'],
        correct: 1,
      },
      {
        type: 'choice',
        question: "A robin's red chest warns other robins to stay away. Which human sign does this remind you of most?",
        choices: ['"No Trespassing" sign', 'A welcome mat', 'A restaurant menu'],
        correct: 0,
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
        question: 'Cleo takes 4 naps a day. How many naps does she take in one week (7 days)?',
        choices: ['24', '28', '32'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Cats can jump 6 times their own height. If Cleo stands 1 foot tall, how high can she jump?',
        choices: ['3 feet', '6 feet', '10 feet'],
        correct: 1,
      },
    ],
  },
  {
    animalId: 'raccoon',
    bonusXP: 15,
    puzzles: [
      {
        type: 'choice',
        question: 'Remy washes 15 pieces of food. Each piece takes 2 minutes to wash. How many minutes total?',
        choices: ['25 minutes', '30 minutes', '35 minutes'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Raccoons are active at night and sleep during the day. What is the word for an animal that is awake at night?',
        choices: ['Nocturnal', 'Migratory', 'Herbivore'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'sparrow',
    bonusXP: 10,
    puzzles: [
      {
        type: 'choice',
        question: '24 sparrows are on one wire, 18 on another. Then 7 leave the first wire. How many sparrows total now?',
        choices: ['33', '35', '37'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Sparrows take dust baths to remove tiny bugs from their feathers. What do you predict would happen without dust baths?',
        choices: [
          'More parasites would live in their feathers',
          'Their feathers would grow longer',
          'They would fly much faster',
        ],
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
        question: "Rosie's patch has 3 rows of 12 clover plants. She eats 9 plants per day. How many days will the clover last?",
        choices: ['3 days', '4 days', '5 days'],
        correct: 1,
      },
      {
        type: 'choice',
        question: "Rabbits can't vomit, so they must only eat food that is safe. What does this tell you about how rabbits choose their food?",
        choices: [
          'They must be very careful and selective eaters',
          'They eat anything and never get sick',
          'They only eat plants other animals have tried first',
        ],
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
        question: 'Turtles have existed for 200 million years. Dinosaurs went extinct 65 million years ago. How many million years before the dinosaurs disappeared were turtles already living?',
        choices: ['100 million years', '135 million years', '65 million years'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Turtles survived whatever wiped out the dinosaurs. Which word BEST describes the turtle as a species?',
        choices: ['Resilient', 'Fragile', 'Migratory'],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'hawk',
    bonusXP: 25,
    puzzles: [
      {
        type: 'choice',
        question: "Hunter's eyes are 8× sharper than yours. If you can read a sign from 40 feet away, Hunter could read it from how far?",
        choices: ['160 feet', '320 feet', '480 feet'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Hawks circle high in the sky before diving. Why does being HIGH UP help them hunt?',
        choices: [
          'They can see a much larger area at once',
          'Wind is faster up high so they dive quicker',
          'Mice cannot see hawks above the clouds',
        ],
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
        question: 'Gully finds 4 fries every 10 minutes. How many fries will she find in 30 minutes?',
        choices: ['10', '12', '16'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Seagulls stomp to imitate rain so worms surface. Worms come up when it rains because water fills their tunnels. What do seagull feet FEEL LIKE to a worm underground?',
        choices: [
          'Raindrops tapping the soil',
          'A predator clawing at the dirt',
          'Wind blowing the grass',
        ],
        correct: 0,
      },
    ],
  },
  {
    animalId: 'beachcat',
    bonusXP: 15,
    puzzles: [
      {
        type: 'choice',
        question: 'Sandy walks 8 miles along the beach every day. How far does she walk in 5 days?',
        choices: ['35 miles', '40 miles', '45 miles'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Fishing cats evolved to swim and dive for food. What does the word "evolved" mean in this sentence?',
        choices: [
          'Changed over many generations to be better suited to their environment',
          'Learned to swim by practicing every day',
          'Were taught to swim by other cats',
        ],
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
        question: "Chester's cheeks hold 165 acorns. He fills them, empties, and fills them one more time. How many acorns has he moved in total?",
        choices: ['295', '330', '345'],
        correct: 1,
      },
      {
        type: 'which',
        question: 'Chipmunks hibernate for winter. Which other animal also hibernates?',
        choices: ['🐻', '🐦', '🦊'],
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
        question: 'Deer run at about 30 miles per hour. At that speed, how far could Daisy run in half an hour?',
        choices: ['10 miles', '15 miles', '20 miles'],
        correct: 1,
      },
      {
        type: 'choice',
        question: "A fawn's spotted coat makes it blend into sunlit forest shadows. What is the scientific word for this kind of blending in?",
        choices: ['Camouflage', 'Migration', 'Hibernation'],
        correct: 0,
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
        question: 'Fern found 24 berries and hid them equally in 6 secret spots. How many berries are in each spot?',
        choices: ['3', '4', '5'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Foxes use Earth\'s magnetic field to aim their pounce under snow. Which human tool works most like this ability?',
        choices: ['A compass', 'A telescope', 'A thermometer'],
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
        question: "Bruno's dam needs 45 sticks. He carries 5 sticks per trip. How many trips does he make?",
        choices: ['7', '9', '11'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Beaver dams create ponds that provide homes for fish, frogs, ducks, and deer. What do we call an animal whose actions create habitat for dozens of other species?',
        choices: ['A keystone species', 'An apex predator', 'A scavenger'],
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
        question: 'Bears eat up to 20,000 calories before hibernating. A large pizza has about 2,000 calories. How many whole pizzas would equal one bear\'s pre-hibernation meal?',
        choices: ['8 pizzas', '10 pizzas', '12 pizzas'],
        correct: 1,
      },
      {
        type: 'truefalse',
        statement: 'Scientists say "Black bears aren\'t always black." This is a contradiction — if they\'re black bears, they MUST be black.',
        isTrue: false,
      },
    ],
  },
  {
    animalId: 'owl',
    bonusXP: 25,
    puzzles: [
      {
        type: 'choice',
        question: 'Ophelia can rotate her head 270°. A full circle is 360°. How many more degrees would she need to turn to complete a full circle?',
        choices: ['80°', '90°', '100°'],
        correct: 1,
      },
      {
        type: 'choice',
        question: "Owls cannot move their eyeballs — they are fixed in place. Given this, why do you think owls evolved to rotate their heads 270°?",
        choices: [
          'To see in all directions since their eyes can\'t move',
          'To listen better with both ears at once',
          'To intimidate larger predators',
        ],
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
        question: 'River otters hold their breath for up to 8 minutes. Sea otters hold theirs for 5 minutes. How much longer can a river otter hold its breath?',
        choices: ['2 minutes', '3 minutes', '4 minutes'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Otters have up to 1 million hairs per square inch — the thickest fur of any mammal. Why is extremely thick fur important for an animal that swims in cold mountain rivers?',
        choices: [
          'It traps warm air close to the skin, acting like a wetsuit',
          'It helps them swim faster by being streamlined',
          'It keeps water from touching their skin at all',
        ],
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
        question: 'Magnus dives 20 feet each time he eats underwater plants. If he makes 3 dives before breakfast, how many total feet has he dived?',
        choices: ['40 feet', '60 feet', '80 feet'],
        correct: 1,
      },
      {
        type: 'choice',
        question: 'Moose have hollow, air-filled hairs that help them float. How is this MOST similar to something humans use?',
        choices: ['A life jacket filled with air', 'A raincoat that repels water', 'Swim goggles'],
        correct: 0,
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
