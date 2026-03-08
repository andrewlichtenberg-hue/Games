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
      { type: 'choice', question: 'Sammy buried 34 acorns in fall and found only 17 in winter. How many acorns might become trees?', choices: ['17', '15', '19'], correct: 0 },
      { type: 'choice', question: 'A squirrel forgets 1 out of every 4 buried acorns. If she buries 20 acorns, about how many trees might grow?', choices: ['4', '5', '8'], correct: 1 },
      { type: 'truefalse', statement: 'Squirrels have excellent memories and always find every acorn they bury.', isTrue: false },
      { type: 'which', question: 'A squirrel stores food for winter. Which other animal also stores food for winter?', choices: ['🐿️', '🦁', '🐬'], correct: 0 },
      { type: 'choice', question: 'Sammy buries 8 acorns Monday and 11 on Tuesday. How many total acorns did she bury?', choices: ['17', '19', '21'], correct: 1 },
      { type: 'choice', question: 'Squirrels can find acorns buried under a foot of snow. Which sense do they mainly use to do this?', choices: ['Smell', 'Vision', 'Hearing'], correct: 0 },
    ],
  },
  {
    animalId: 'pigeon',
    bonusXP: 10,
    puzzles: [
      { type: 'choice', question: 'Pearl must fly 50 miles home. She has flown 23 miles already. How many miles does she have left?', choices: ['25', '27', '30'], correct: 1 },
      { type: 'choice', question: 'A pigeon flies about 50 miles per day. Roughly how many days would it take to fly 200 miles?', choices: ['2 days', '4 days', '10 days'], correct: 1 },
      { type: 'truefalse', statement: 'Pigeons were used to carry messages during wars because they can find their way home over long distances.', isTrue: true },
      { type: 'which', question: 'Pigeons navigate using the sun. Which tool do humans use to navigate?', choices: ['🧭', '🔭', '🌡️'], correct: 0 },
      { type: 'choice', question: 'Pearl lays 2 eggs in spring and 2 in summer. How many eggs does she lay all year?', choices: ['2', '4', '6'], correct: 1 },
      { type: 'choice', question: 'A pigeon can recognize its own reflection. Which other animal can also do this?', choices: ['Dolphin', 'Goldfish', 'Ant'], correct: 0 },
    ],
  },
  {
    animalId: 'dog',
    bonusXP: 10,
    puzzles: [
      { type: 'choice', question: 'Biscuit buries 3 bones every day. How many bones has he buried after 2 weeks (14 days)?', choices: ['38', '42', '45'], correct: 1 },
      { type: 'choice', question: 'Dogs smell 100,000× better than humans. If you can smell a pie from 10 feet away, a dog could smell it from how far?', choices: ['1,000 feet', '100,000 feet', '1 mile'], correct: 1 },
      { type: 'truefalse', statement: 'Dogs wag their tails only when they are happy.', isTrue: false },
      { type: 'which', question: 'Dogs sweat through their paws. Which body part helps them cool down most?', choices: ['👅', '🐾', '👂'], correct: 0 },
      { type: 'choice', question: 'A dog has 300 million smell receptors. A human has 6 million. How many more does a dog have?', choices: ['294 million', '300 million', '306 million'], correct: 0 },
      { type: 'choice', question: 'Biscuit gets a treat every time he sits on command. He sits 5 times on Monday and 7 times on Tuesday. How many treats total?', choices: ['10', '12', '14'], correct: 1 },
    ],
  },
  {
    animalId: 'robin',
    bonusXP: 10,
    puzzles: [
      { type: 'choice', question: 'Rosa spots 12 worms Monday, 9 Tuesday, and 14 Wednesday. How many worms in total?', choices: ['33', '35', '37'], correct: 1 },
      { type: 'choice', question: "A robin's red chest warns other robins to stay away. Which human sign does this remind you of most?", choices: ['"No Trespassing" sign', 'A welcome mat', 'A restaurant menu'], correct: 0 },
      { type: 'truefalse', statement: 'Robins can hear worms moving underground, which helps them find food.', isTrue: true },
      { type: 'which', question: 'Robins return every spring. What do we call animals that travel seasonally?', choices: ['Migratory', 'Nocturnal', 'Herbivore'], correct: 0 },
      { type: 'choice', question: 'Rosa builds a nest using 350 pieces of grass. She collects 50 pieces per trip. How many trips does she need?', choices: ['5', '7', '9'], correct: 1 },
      { type: 'choice', question: 'A mother robin feeds her chicks 40 worms a day. She has 4 chicks. How many worms does each chick get?', choices: ['8', '10', '12'], correct: 1 },
    ],
  },

  // ── Brooklyn Heights ──────────────────────────────────────────────────────
  {
    animalId: 'cat',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'Cleo takes 4 naps a day. How many naps does she take in one week (7 days)?', choices: ['24', '28', '32'], correct: 1 },
      { type: 'choice', question: 'Cats can jump 6 times their own height. If Cleo stands 1 foot tall, how high can she jump?', choices: ['3 feet', '6 feet', '10 feet'], correct: 1 },
      { type: 'truefalse', statement: 'Cats always land on their feet when they fall because of a special body twist called the "righting reflex."', isTrue: true },
      { type: 'which', question: 'Cats are crepuscular — most active at dawn and dusk. Which word means active at night?', choices: ['Nocturnal', 'Diurnal', 'Crepuscular'], correct: 0 },
      { type: 'choice', question: 'Cleo purrs for 3 minutes then naps for 12 minutes, then repeats. After 3 purr-nap cycles, how long has she rested in total?', choices: ['36 min', '45 min', '39 min'], correct: 1 },
      { type: 'choice', question: 'A cat has 32 muscles in each ear. A human has only 6. How many more ear muscles does a cat have per ear?', choices: ['24', '26', '28'], correct: 1 },
    ],
  },
  {
    animalId: 'raccoon',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'Remy washes 15 pieces of food. Each piece takes 2 minutes to wash. How many minutes total?', choices: ['25 minutes', '30 minutes', '35 minutes'], correct: 1 },
      { type: 'choice', question: 'Raccoons are active at night and sleep during the day. What is the word for an animal that is awake at night?', choices: ['Nocturnal', 'Migratory', 'Herbivore'], correct: 0 },
      { type: 'truefalse', statement: 'Raccoons wash their food because they dislike the taste of dirt.', isTrue: false },
      { type: 'which', question: 'Raccoon hands are so nimble they can open jars! Which other animal has very nimble hands?', choices: ['🐒', '🐘', '🐢'], correct: 0 },
      { type: 'choice', question: 'Remy has 4 babies (kits). Each kit needs 6 meals a day. How many total meals does Remy provide daily?', choices: ['20', '24', '28'], correct: 1 },
      { type: 'choice', question: 'Raccoons can remember solutions to puzzles for 3 years. If Remy learned a trick at age 1, she will still remember it at age what?', choices: ['Age 2', 'Age 4', 'Age 5'], correct: 1 },
    ],
  },
  {
    animalId: 'sparrow',
    bonusXP: 10,
    puzzles: [
      { type: 'choice', question: '24 sparrows are on one wire, 18 on another. Then 7 leave the first wire. How many sparrows total now?', choices: ['33', '35', '37'], correct: 1 },
      { type: 'choice', question: 'Sparrows take dust baths to remove tiny bugs from their feathers. What do you predict would happen without dust baths?', choices: ['More parasites would live in their feathers', 'Their feathers would grow longer', 'They would fly much faster'], correct: 0 },
      { type: 'truefalse', statement: 'Sparrows are one of the most common birds in the world and live on every continent except Antarctica.', isTrue: true },
      { type: 'which', question: 'Sparrows eat seeds and insects. Which category of eater are they?', choices: ['Omnivore', 'Carnivore', 'Herbivore'], correct: 0 },
      { type: 'choice', question: 'A sparrow weighs about 1 ounce. How many sparrows would equal a 1-pound bag of bird seed (16 ounces)?', choices: ['12', '16', '20'], correct: 1 },
      { type: 'choice', question: 'A sparrow nest holds up to 5 eggs. If 4 out of 5 eggs hatch, what percentage hatched?', choices: ['60%', '80%', '100%'], correct: 1 },
    ],
  },

  // ── Central Park ──────────────────────────────────────────────────────────
  {
    animalId: 'rabbit',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: "Rosie's patch has 3 rows of 12 clover plants. She eats 9 plants per day. How many days will the clover last?", choices: ['3 days', '4 days', '5 days'], correct: 1 },
      { type: 'choice', question: "Rabbits can't vomit, so they must only eat food that is safe. What does this tell you about how rabbits choose their food?", choices: ['They must be very careful and selective eaters', 'They eat anything and never get sick', 'They only eat plants other animals have tried first'], correct: 0 },
      { type: 'truefalse', statement: 'Rabbits eat some of their own droppings to get extra nutrients — this is actually a healthy behavior for them.', isTrue: true },
      { type: 'which', question: 'Rabbits warn each other of danger by thumping their feet. Which other animal uses foot-thumping to communicate?', choices: ['🦘', '🐠', '🦅'], correct: 0 },
      { type: 'choice', question: 'Rosie can run 25 miles per hour. A human runs about 5 miles per hour. How many times faster is Rosie?', choices: ['3', '5', '8'], correct: 1 },
      { type: 'choice', question: 'A rabbit\'s teeth never stop growing. If they don\'t chew enough, teeth grow 1 cm per month extra. After 3 months that would be how much extra length?', choices: ['2 cm', '3 cm', '4 cm'], correct: 1 },
    ],
  },
  {
    animalId: 'turtle',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'Turtles have existed for 200 million years. Dinosaurs went extinct 65 million years ago. How many million years before the dinosaurs disappeared were turtles already living?', choices: ['100 million years', '135 million years', '65 million years'], correct: 1 },
      { type: 'choice', question: 'Turtles survived whatever wiped out the dinosaurs. Which word BEST describes the turtle as a species?', choices: ['Resilient', 'Fragile', 'Migratory'], correct: 0 },
      { type: 'truefalse', statement: 'Turtles can feel you touching their shells, just like you feel touch on your skin.', isTrue: true },
      { type: 'which', question: 'A turtle retreats into its shell when scared. Which other animal uses a hard shell for protection?', choices: ['🐚', '🦔', '🐘'], correct: 0 },
      { type: 'choice', question: 'Terry the turtle walks 0.17 miles per hour. A person walks 3 miles per hour. About how many times faster does the person walk?', choices: ['10 times', '17 times', '20 times'], correct: 1 },
      { type: 'choice', question: 'Some turtles live over 100 years. If a turtle hatched in 1924, how old would it be in 2024?', choices: ['90 years', '100 years', '110 years'], correct: 1 },
    ],
  },
  {
    animalId: 'hawk',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: "Hunter's eyes are 8× sharper than yours. If you can read a sign from 40 feet away, Hunter could read it from how far?", choices: ['160 feet', '320 feet', '480 feet'], correct: 1 },
      { type: 'choice', question: 'Hawks circle high in the sky before diving. Why does being HIGH UP help them hunt?', choices: ['They can see a much larger area at once', 'Wind is faster up high so they dive quicker', 'Mice cannot see hawks above the clouds'], correct: 0 },
      { type: 'truefalse', statement: 'Hawks and falcons are the same type of bird.', isTrue: false },
      { type: 'which', question: 'Hawks use thermal updrafts (rising warm air) to soar without flapping. Which human invention also uses rising air?', choices: ['🎈', '✈️', '🚀'], correct: 0 },
      { type: 'choice', question: 'A red-tailed hawk dives at 120 mph. A school bus goes 60 mph. How many times faster is the hawk?', choices: ['1 time', '2 times', '3 times'], correct: 1 },
      { type: 'choice', question: 'Hunter catches 3 mice on Monday and 5 on Wednesday. How many total?', choices: ['6', '8', '10'], correct: 1 },
    ],
  },

  // ── Rockaway Beach ────────────────────────────────────────────────────────
  {
    animalId: 'seagull',
    bonusXP: 12,
    puzzles: [
      { type: 'choice', question: 'Gully finds 4 fries every 10 minutes. How many fries will she find in 30 minutes?', choices: ['10', '12', '16'], correct: 1 },
      { type: 'choice', question: 'Seagulls stomp to imitate rain so worms surface. Worms come up when it rains because water fills their tunnels. What do seagull feet FEEL LIKE to a worm underground?', choices: ['Raindrops tapping the soil', 'A predator clawing at the dirt', 'Wind blowing the grass'], correct: 0 },
      { type: 'truefalse', statement: 'Seagulls can drink both fresh water and salt water because they have special glands to remove salt.', isTrue: true },
      { type: 'which', question: 'Seagulls will eat almost anything. What kind of eater is an animal that eats both plants and animals?', choices: ['Omnivore', 'Carnivore', 'Herbivore'], correct: 0 },
      { type: 'choice', question: 'Gully and her 4 chick friends each need 6 fish a day. How many fish total are needed each day?', choices: ['24', '30', '36'], correct: 1 },
      { type: 'choice', question: 'A seagull lives about 20 years. If Gully was hatched in 2015, in what year will she be 20?', choices: ['2033', '2035', '2040'], correct: 1 },
    ],
  },
  {
    animalId: 'beachcat',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'Sandy walks 8 miles along the beach every day. How far does she walk in 5 days?', choices: ['35 miles', '40 miles', '45 miles'], correct: 1 },
      { type: 'choice', question: 'Fishing cats evolved to swim and dive for food. What does the word "evolved" mean in this sentence?', choices: ['Changed over many generations to be better suited to their environment', 'Learned to swim by practicing every day', 'Were taught to swim by other cats'], correct: 0 },
      { type: 'truefalse', statement: 'Most house cats love swimming and are good at it.', isTrue: false },
      { type: 'which', question: 'Sandy catches fish in the surf. Which tool do human fishers use?', choices: ['🎣', '🔭', '🧲'], correct: 0 },
      { type: 'choice', question: 'Sandy catches 2 fish per day. How many fish does she catch in 2 weeks (14 days)?', choices: ['24', '28', '32'], correct: 1 },
      { type: 'choice', question: 'Beach cats have slightly webbed paws for swimming. Which other animal also has webbed feet for swimming?', choices: ['Duck', 'Camel', 'Giraffe'], correct: 0 },
    ],
  },
  {
    animalId: 'pelican',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'A pelican\'s pouch holds 3 gallons of water. Its stomach only holds 1 gallon. How many times larger is the pouch than the stomach?', choices: ['2 times', '3 times', '5 times'], correct: 1 },
      { type: 'truefalse', statement: 'Pelicans store fish in their pouch to carry home for later meals.', isTrue: false },
      { type: 'choice', question: 'Percy scoops up 2.5 gallons of water per dive to catch fish. If he dives 4 times, how many gallons of water has he scooped?', choices: ['8', '10', '12'], correct: 1 },
      { type: 'which', question: 'Pelicans fly in formation to save energy. Which other animal also travels in formation?', choices: ['🦆', '🐟', '🦋'], correct: 0 },
      { type: 'choice', question: 'A brown pelican dives from 60 feet in the air to catch fish. That\'s about the height of a 6-story building. If each story is 10 feet, how many stories high is 60 feet?', choices: ['5 stories', '6 stories', '7 stories'], correct: 1 },
      { type: 'choice', question: 'Pelicans nest in groups called colonies. If 12 pelicans each have 2 chicks, how many chicks are there in the colony?', choices: ['18', '24', '30'], correct: 1 },
    ],
  },
  {
    animalId: 'dolphin',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'Dolphins use echolocation — they make clicks that bounce off objects. Sound travels about 4x faster in water than in air. If sound takes 1 second in air, how long in water?', choices: ['0.25 seconds', '4 seconds', '0.5 seconds'], correct: 0 },
      { type: 'truefalse', statement: 'Dolphins sleep with both eyes closed, just like humans.', isTrue: false },
      { type: 'choice', question: 'Delphi sleeps with half her brain at a time (the other half stays alert). While resting, she still watches for danger. What is this kind of sleeping called?', choices: ['Unihemispheric sleep', 'Hibernation', 'Torpor'], correct: 0 },
      { type: 'which', question: 'Dolphins communicate with clicks and whistles. Which human invention works similarly to echolocation?', choices: ['📡', '📷', '🔬'], correct: 0 },
      { type: 'choice', question: 'A dolphin pod has 8 members. Each dolphin eats 15 pounds of fish a day. How many pounds of fish does the whole pod eat per day?', choices: ['100', '120', '140'], correct: 1 },
      { type: 'choice', question: 'Dolphins can swim up to 25 mph. A human swimmer goes about 5 mph. How many times faster is a dolphin?', choices: ['3 times', '5 times', '10 times'], correct: 1 },
    ],
  },

  // ── Staten Island ─────────────────────────────────────────────────────────
  {
    animalId: 'chipmunk',
    bonusXP: 12,
    puzzles: [
      { type: 'choice', question: "Chester's cheeks hold 165 acorns. He fills them, empties, and fills them one more time. How many acorns has he moved in total?", choices: ['295', '330', '345'], correct: 1 },
      { type: 'which', question: 'Chipmunks hibernate for winter. Which other animal also hibernates?', choices: ['🐻', '🐦', '🦊'], correct: 0 },
      { type: 'truefalse', statement: 'Chipmunks are rodents, just like mice and squirrels.', isTrue: true },
      { type: 'choice', question: 'Chester stores 8 seeds in each of his 5 underground chambers. How many seeds total?', choices: ['32', '40', '48'], correct: 1 },
      { type: 'choice', question: 'A chipmunk can stuff 70 sunflower seeds in each cheek. With both cheeks full, how many seeds can it carry?', choices: ['70', '140', '210'], correct: 1 },
      { type: 'which', question: 'Chipmunks have stripes running down their backs. Which other animal also has stripes?', choices: ['🦓', '🐘', '🦒'], correct: 0 },
    ],
  },
  {
    animalId: 'deer',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'Deer run at about 30 miles per hour. At that speed, how far could Daisy run in half an hour?', choices: ['10 miles', '15 miles', '20 miles'], correct: 1 },
      { type: 'choice', question: "A fawn's spotted coat makes it blend into sunlit forest shadows. What is the scientific word for this kind of blending in?", choices: ['Camouflage', 'Migration', 'Hibernation'], correct: 0 },
      { type: 'truefalse', statement: 'A male deer\'s antlers fall off every year and grow back bigger the next year.', isTrue: true },
      { type: 'which', question: 'Deer eat leaves, grass, and berries. What type of eater is an animal that eats only plants?', choices: ['Herbivore', 'Carnivore', 'Omnivore'], correct: 0 },
      { type: 'choice', question: 'A deer can jump 8 feet high. A school fence is 4 feet tall. Can Daisy jump over a fence that is 7 feet tall?', choices: ['Yes, easily', 'No, it\'s too tall', 'Exactly the same height'], correct: 0 },
      { type: 'choice', question: 'Daisy and her 2 fawns each eat 5 pounds of plants a day. How many pounds does the family eat total?', choices: ['10 lbs', '15 lbs', '20 lbs'], correct: 1 },
    ],
  },
  {
    animalId: 'woodpecker',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'A woodpecker pecks 20 times per second. How many pecks does it make in 5 seconds?', choices: ['80', '100', '120'], correct: 1 },
      { type: 'truefalse', statement: 'A woodpecker\'s skull is the same as other birds\', which is why woodpeckers often get headaches.', isTrue: false },
      { type: 'choice', question: 'Woody\'s tongue is 4 times as long as his skull. If his skull is 2 inches long, how long is his tongue?', choices: ['6 inches', '8 inches', '10 inches'], correct: 1 },
      { type: 'which', question: 'Woodpeckers make holes in trees to find insects. Which tool does this remind you of?', choices: ['🔨', '🔭', '🧲'], correct: 0 },
      { type: 'choice', question: 'A woodpecker drums 10,000 times a day. If it pecks 20 times per second, how many seconds does it spend drumming total?', choices: ['400', '500', '600'], correct: 1 },
      { type: 'choice', question: 'Woodpeckers make holes that later become homes for owls and squirrels. What do we call an animal that creates homes for other animals?', choices: ['Ecosystem engineer', 'Apex predator', 'Scavenger'], correct: 0 },
    ],
  },
  {
    animalId: 'turkey',
    bonusXP: 12,
    puzzles: [
      { type: 'truefalse', statement: 'Both male and female turkeys make the "gobble" sound.', isTrue: false },
      { type: 'choice', question: 'A turkey can run 25 mph on the ground but fly 55 mph in bursts. How many mph faster can it fly than run?', choices: ['20 mph', '30 mph', '40 mph'], correct: 1 },
      { type: 'choice', question: 'Tommy Turkey has 3,500 feathers. If he loses 500 feathers molting, how many remain?', choices: ['2,500', '3,000', '3,500'], correct: 1 },
      { type: 'which', question: 'Male turkeys fan their tail feathers to attract females. Which other bird also displays colorful feathers this way?', choices: ['🦚', '🐧', '🦅'], correct: 0 },
      { type: 'choice', question: 'Benjamin Franklin wanted the turkey to be the national bird instead of the bald eagle. What does this tell you about how Americans viewed turkeys?', choices: ['They admired turkeys as clever and brave', 'They thought turkeys were boring', 'They wanted a bird that could swim'], correct: 0 },
      { type: 'truefalse', statement: 'Wild turkeys can fly, but farm-raised turkeys are too heavy to fly.', isTrue: true },
    ],
  },

  // ── Hudson Valley ─────────────────────────────────────────────────────────
  {
    animalId: 'fox',
    bonusXP: 20,
    puzzles: [
      { type: 'choice', question: 'Fern found 24 berries and hid them equally in 6 secret spots. How many berries are in each spot?', choices: ['3', '4', '5'], correct: 1 },
      { type: 'choice', question: 'Foxes use Earth\'s magnetic field to aim their pounce under snow. Which human tool works most like this ability?', choices: ['A compass', 'A telescope', 'A thermometer'], correct: 0 },
      { type: 'truefalse', statement: 'Foxes are members of the dog family (Canidae).', isTrue: true },
      { type: 'which', question: 'Foxes hunt alone, not in packs. Which other hunter also hunts alone?', choices: ['🐆', '🐺', '🦁'], correct: 0 },
      { type: 'choice', question: 'Fern hides food in 4 spots: 6 mice, 8 berries, 3 voles, and 5 eggs. How many food items total?', choices: ['20', '22', '24'], correct: 1 },
      { type: 'choice', question: 'A fox\'s tail (brush) can be as long as its body. If the body is 24 inches, the tail could also be up to how long?', choices: ['12 inches', '24 inches', '36 inches'], correct: 1 },
    ],
  },
  {
    animalId: 'beaver',
    bonusXP: 20,
    puzzles: [
      { type: 'choice', question: "Bruno's dam needs 45 sticks. He carries 5 sticks per trip. How many trips does he make?", choices: ['7', '9', '11'], correct: 1 },
      { type: 'choice', question: 'Beaver dams create ponds that provide homes for fish, frogs, ducks, and deer. What do we call an animal whose actions create habitat for dozens of other species?', choices: ['A keystone species', 'An apex predator', 'A scavenger'], correct: 0 },
      { type: 'truefalse', statement: 'Beavers use their flat tails like a paddle when swimming.', isTrue: true },
      { type: 'which', question: 'Beavers build dams to create deep ponds where they can hide from predators. Which human structure does a beaver dam most resemble?', choices: ['🏗️', '🌁', '🗼'], correct: 0 },
      { type: 'choice', question: 'Bruno\'s lodge (home) is in the middle of a pond. He enters through an underwater tunnel 4 feet deep. If the pond is 6 feet deep, how many feet above the tunnel entrance is the pond surface?', choices: ['1 foot', '2 feet', '3 feet'], correct: 1 },
      { type: 'choice', question: 'Beaver teeth are orange because they contain iron, which makes them very strong. Which other teeth benefit from a similar mineral (fluoride) to stay strong?', choices: ['Human teeth', 'Dog teeth', 'Snake fangs'], correct: 0 },
    ],
  },
  {
    animalId: 'hummingbird',
    bonusXP: 20,
    puzzles: [
      { type: 'choice', question: 'A hummingbird beats its wings 80 times per second. How many wingbeats in 10 seconds?', choices: ['400', '800', '1600'], correct: 1 },
      { type: 'truefalse', statement: 'Hummingbirds are the only birds that can fly backwards.', isTrue: true },
      { type: 'choice', question: 'Honey visits 1,000 flowers each day for nectar. If she visits the same number each hour over 10 hours, how many flowers per hour?', choices: ['50', '100', '200'], correct: 1 },
      { type: 'which', question: 'A hummingbird weighs less than a penny (about 0.1 oz). Which other tiny animal is also lighter than a penny?', choices: ['🦋', '🐘', '🐊'], correct: 0 },
      { type: 'choice', question: 'A hummingbird\'s heart beats 1,200 times per minute. A human heart beats 70 times per minute. About how many times faster is the hummingbird\'s heart?', choices: ['About 10 times', 'About 17 times', 'About 25 times'], correct: 1 },
      { type: 'choice', question: 'Hummingbirds can enter torpor (like mini-hibernation) at night, slowing their heart to 50 beats/min. How many fewer beats per minute is that compared to their normal 1,200?', choices: ['1,050', '1,150', '1,200'], correct: 1 },
    ],
  },
  {
    animalId: 'bluebird',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'Bella can spot a caterpillar from 50 feet away. If you can see an ant from 5 feet, how many times better is her vision for spotting food?', choices: ['5 times', '10 times', '20 times'], correct: 1 },
      { type: 'truefalse', statement: 'Male bluebirds are bright blue to attract mates, while females are duller in color to blend in while nesting.', isTrue: true },
      { type: 'choice', question: 'Bella eats 12 insects per hour. How many insects does she eat in an 8-hour day?', choices: ['72', '96', '120'], correct: 1 },
      { type: 'which', question: 'Bluebirds raise their young in nest boxes. Which human activity helps bluebirds by providing nest boxes?', choices: ['🌳', '🏭', '🚗'], correct: 0 },
      { type: 'choice', question: 'Bluebird populations dropped when people replaced wooden fence posts with metal ones. If there were 1,000 bluebird nest sites before and 30% were removed, how many remained?', choices: ['500', '700', '900'], correct: 1 },
      { type: 'truefalse', statement: 'Female bluebirds choose the nest while male bluebirds find the location first.', isTrue: true },
    ],
  },

  // ── Catskills ─────────────────────────────────────────────────────────────
  {
    animalId: 'bear',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'Bears eat up to 20,000 calories before hibernating. A large pizza has about 2,000 calories. How many whole pizzas would equal one bear\'s pre-hibernation meal?', choices: ['8 pizzas', '10 pizzas', '12 pizzas'], correct: 1 },
      { type: 'truefalse', statement: 'Scientists say "Black bears aren\'t always black." This is a contradiction — if they\'re black bears, they MUST be black.', isTrue: false },
      { type: 'choice', question: 'A bear gains 3 pounds a day eating berries in late summer. After 30 days, how many pounds has it gained?', choices: ['60 lbs', '90 lbs', '120 lbs'], correct: 1 },
      { type: 'which', question: 'Bears hibernate to survive winter when food is scarce. Which other animal hibernates?', choices: ['🦔', '🐦', '🐬'], correct: 0 },
      { type: 'choice', question: 'A black bear can smell food from 20 miles away. A human can smell food from about 0.2 miles. How many times better is the bear\'s nose?', choices: ['10 times', '100 times', '200 times'], correct: 1 },
      { type: 'choice', question: 'Black bears can come in black, brown, cinnamon, and even blond colors. There are 4 possible coat colors. What fraction of these colors are NOT black?', choices: ['1/4', '1/2', '3/4'], correct: 2 },
    ],
  },
  {
    animalId: 'owl',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'Ophelia can rotate her head 270°. A full circle is 360°. How many more degrees would she need to turn to complete a full circle?', choices: ['80°', '90°', '100°'], correct: 1 },
      { type: 'choice', question: "Owls cannot move their eyeballs — they are fixed in place. Given this, why do you think owls evolved to rotate their heads 270°?", choices: ['To see in all directions since their eyes can\'t move', 'To listen better with both ears at once', 'To intimidate larger predators'], correct: 0 },
      { type: 'truefalse', statement: 'Owls\' ears are at different heights on their head, which helps them locate sounds in 3D.', isTrue: true },
      { type: 'which', question: 'Owls fly silently because their feathers have a special comb-like edge. Which invention also aims to reduce sound?', choices: ['🎵', '🔕', '📢'], correct: 1 },
      { type: 'choice', question: 'Ophelia catches 4 mice per night. After 5 nights, how many mice has she caught?', choices: ['16', '20', '24'], correct: 1 },
      { type: 'choice', question: 'An owl pellet contains undigested bones and fur from 2 mice. If Ophelia produces 1 pellet per night, how many total prey remains are in her pellets after a week?', choices: ['7', '12', '14'], correct: 2 },
    ],
  },
  {
    animalId: 'skunk',
    bonusXP: 20,
    puzzles: [
      { type: 'choice', question: 'Stella\'s spray can travel 15 feet. How many feet is that in yards? (3 feet = 1 yard)', choices: ['3 yards', '5 yards', '6 yards'], correct: 1 },
      { type: 'truefalse', statement: 'Skunks spray immediately when threatened, without any warning.', isTrue: false },
      { type: 'choice', question: 'Skunk spray can linger for weeks. If it takes 4 weeks to fully fade, that\'s how many days?', choices: ['14 days', '21 days', '28 days'], correct: 2 },
      { type: 'which', question: 'A skunk\'s warning display includes raised tail and foot-stomping. Which other animal also gives a warning display before using its defense?', choices: ['🐍', '🐟', '🐦'], correct: 0 },
      { type: 'choice', question: 'Skunks have limited spray — they can only spray 5 or 6 times before running out and needing 10 days to recharge. If Stella sprays twice, how many sprays does she have left before recharging?', choices: ['2', '3', '4'], correct: 1 },
      { type: 'choice', question: 'Skunks eat 70% insects and 30% plants. If Stella eats 10 things per day, about how many are insects?', choices: ['3', '5', '7'], correct: 2 },
    ],
  },
  {
    animalId: 'bobcat',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'Bobby can jump 12 feet high. A basketball hoop is 10 feet high. Can Bobby jump over a 10-foot obstacle?', choices: ['Yes, by 2 feet', 'No, just barely misses', 'Exactly the right height'], correct: 0 },
      { type: 'truefalse', statement: 'Bobcats are named because of their short, "bobbed" tail.', isTrue: true },
      { type: 'choice', question: 'Bobcat ears can rotate 180°. If both ears rotate a full 180°, together they cover a full 360° circle. Why is this useful for hunting?', choices: ['They can hear sounds from any direction without moving their body', 'It makes them look more intimidating', 'It helps them balance when jumping'], correct: 0 },
      { type: 'which', question: 'Bobcats are most active at dawn and dusk (crepuscular). Which other animal is also crepuscular?', choices: ['🐱', '🦋', '🐟'], correct: 0 },
      { type: 'choice', question: 'A bobcat\'s territory can be up to 30 square miles. If Bobby patrols 10% of his territory daily, how many square miles does he cover?', choices: ['2', '3', '5'], correct: 1 },
      { type: 'choice', question: 'Bobcats are about twice the size of house cats. If a house cat weighs 10 pounds, a bobcat might weigh how much?', choices: ['10 pounds', '20 pounds', '40 pounds'], correct: 1 },
    ],
  },

  // ── Adirondacks ───────────────────────────────────────────────────────────
  {
    animalId: 'otter',
    bonusXP: 20,
    puzzles: [
      { type: 'choice', question: 'River otters hold their breath for up to 8 minutes. Sea otters hold theirs for 5 minutes. How much longer can a river otter hold its breath?', choices: ['2 minutes', '3 minutes', '4 minutes'], correct: 1 },
      { type: 'choice', question: 'Otters have up to 1 million hairs per square inch — the thickest fur of any mammal. Why is extremely thick fur important for an animal that swims in cold mountain rivers?', choices: ['It traps warm air close to the skin, acting like a wetsuit', 'It helps them swim faster by being streamlined', 'It keeps water from touching their skin at all'], correct: 0 },
      { type: 'truefalse', statement: 'Otters hold hands while sleeping in the water so they don\'t drift apart. This is called a "raft."', isTrue: true },
      { type: 'which', question: 'Otters use rocks to crack open shellfish. Which other animal also uses tools to get food?', choices: ['🐒', '🐘', '🐋'], correct: 0 },
      { type: 'choice', question: 'Otto eats 3 fish per hour while swimming. How many fish does he eat in a 6-hour day?', choices: ['12', '18', '24'], correct: 1 },
      { type: 'choice', question: 'River otters can slide on their bellies as a way to travel quickly on snow and mud. If Otto slides 10 feet per slide and needs to travel 50 feet, how many slides does he need?', choices: ['3', '5', '7'], correct: 1 },
    ],
  },
  {
    animalId: 'moose',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'Magnus dives 20 feet each time he eats underwater plants. If he makes 3 dives before breakfast, how many total feet has he dived?', choices: ['40 feet', '60 feet', '80 feet'], correct: 1 },
      { type: 'choice', question: 'Moose have hollow, air-filled hairs that help them float. How is this MOST similar to something humans use?', choices: ['A life jacket filled with air', 'A raincoat that repels water', 'Swim goggles'], correct: 0 },
      { type: 'truefalse', statement: 'A male moose\'s antlers can weigh up to 40 pounds and span 6 feet across.', isTrue: true },
      { type: 'which', question: 'Moose are the largest members of the deer family. Which animal is the SMALLEST member of the deer family?', choices: ['Pudu', 'Elk', 'Caribou'], correct: 0 },
      { type: 'choice', question: 'A moose eats 40-60 pounds of food per day. If Magnus eats 50 pounds per day, how many pounds per week?', choices: ['300', '350', '400'], correct: 1 },
      { type: 'choice', question: 'A moose can swim up to 6 miles per hour. A human competitive swimmer goes about 5 mph. Who is faster?', choices: ['The moose', 'The human swimmer', 'They are the same'], correct: 0 },
    ],
  },
  {
    animalId: 'loon',
    bonusXP: 20,
    puzzles: [
      { type: 'choice', question: 'A loon\'s call can be heard 2 miles away. If you are 1 mile away and it takes sound about 5 seconds to travel 1 mile, how long does it take to hear the call?', choices: ['3 seconds', '5 seconds', '10 seconds'], correct: 1 },
      { type: 'truefalse', statement: 'Loons can walk well on land because their legs are positioned in the middle of their body.', isTrue: false },
      { type: 'choice', question: 'Luna carries her chicks on her back for their first 2 weeks. If there are 2 chicks and she carries both together, and there are 14 days in 2 weeks, how many days does she carry them?', choices: ['7 days', '14 days', '21 days'], correct: 1 },
      { type: 'which', question: 'Loons are great divers. Which other bird is also an excellent diver?', choices: ['🐧', '🦚', '🦜'], correct: 0 },
      { type: 'choice', question: 'Loons need a 600-foot runway of water to take off. A football field is 300 feet long. How many football fields does a loon need to take off?', choices: ['1 field', '2 fields', '3 fields'], correct: 1 },
      { type: 'choice', question: 'Loons have 4 different calls: a wail, tremolo, yodel, and hoot. Which call is used to let family know where they are?', choices: ['The wail', 'The yodel', 'The hoot'], correct: 0 },
    ],
  },
  {
    animalId: 'wolf',
    bonusXP: 30,
    puzzles: [
      { type: 'choice', question: 'A wolf howl can be heard 10 miles away. Sound travels about 1 mile per 5 seconds in air. How many seconds would it take to hear a howl from 10 miles?', choices: ['10 seconds', '50 seconds', '100 seconds'], correct: 1 },
      { type: 'truefalse', statement: 'Wolf packs are family groups led by the strongest male, who fights others to stay in charge.', isTrue: false },
      { type: 'choice', question: 'A wolf pack of 8 wolves is 90% more effective at hunting than one lone wolf. If a lone wolf catches 1 elk a week, the pack might catch how many?', choices: ['2 elk', 'Nearly 2 elk', 'About 8 elk'], correct: 1 },
      { type: 'which', question: 'Wolves are the largest member of the dog family. Which is a SMALLER member of the dog family?', choices: ['🦊', '🐻', '🦁'], correct: 0 },
      { type: 'choice', question: 'A wolf pack travels up to 30 miles per day when hunting. In 5 days of travel, how far could the pack cover?', choices: ['100 miles', '150 miles', '200 miles'], correct: 1 },
      { type: 'choice', question: 'When wolves were reintroduced to Yellowstone, deer started grazing differently, which caused rivers to change course. This is called a "trophic cascade." What does this show?', choices: ['Animals can change their whole ecosystem', 'Wolves eat too many deer', 'Rivers don\'t matter in nature'], correct: 0 },
    ],
  },

  // ── Cape Cod ────────────────────────────────────────────────────────────────
  {
    animalId: 'seal',
    bonusXP: 20,
    puzzles: [
      { type: 'choice', question: 'Shelby can hold her breath for 30 minutes. If she dives 3 times and uses 8 minutes each dive, how many minutes of breath does she have left?', choices: ['4 minutes', '6 minutes', '8 minutes'], correct: 1 },
      { type: 'choice', question: 'Harbor seals haul out onto rocks to warm up because water drains body heat 25 times faster than air. Why does water cool you down so much faster?', choices: ['Water touches more of your skin and carries heat away quickly', 'Water is always colder than air', 'Water makes your skin thinner'], correct: 0 },
      { type: 'truefalse', statement: 'Seals and sea lions are the same animal with different names.', isTrue: false },
      { type: 'which', question: 'Seals use their whiskers to detect fish movements underwater. Which human tool works similarly?', choices: ['📡', '🔭', '🔬'], correct: 0 },
      { type: 'choice', question: 'Shelby eats 15 pounds of fish per day. How many pounds of fish does she eat in a week?', choices: ['75 lbs', '105 lbs', '120 lbs'], correct: 1 },
      { type: 'choice', question: 'A baby seal (pup) is nursed for 4 weeks and gains 5 pounds a day. How much weight does it gain total?', choices: ['100 lbs', '120 lbs', '140 lbs'], correct: 2 },
    ],
  },
  {
    animalId: 'plover',
    bonusXP: 20,
    puzzles: [
      { type: 'choice', question: 'Pippa lays 4 eggs in her nest. If 3 out of every 4 eggs hatch, how many chicks will she likely have?', choices: ['2 chicks', '3 chicks', '4 chicks'], correct: 1 },
      { type: 'choice', question: 'Piping plovers pretend to have a broken wing to lure predators away from their nest. What is this behavior called?', choices: ['A distraction display', 'Migration', 'Hibernation'], correct: 0 },
      { type: 'truefalse', statement: 'Piping plovers are an endangered species that need protection on beaches.', isTrue: true },
      { type: 'which', question: 'Pippa\'s chicks can run and feed themselves within hours of hatching. What do we call this type of chick?', choices: ['Precocial', 'Altricial', 'Migratory'], correct: 0 },
      { type: 'choice', question: 'Piping plovers weigh about 2 ounces. A baseball weighs 5 ounces. How many plovers would weigh the same as a baseball?', choices: ['2', '2.5', '3'], correct: 1 },
      { type: 'choice', question: 'Piping plovers migrate 2,000 miles to their wintering grounds. If they fly 200 miles per day, how many days does the trip take?', choices: ['5', '10', '20'], correct: 1 },
    ],
  },
  {
    animalId: 'coyote',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'Eastern coyotes are a mix of coyote and wolf. A coyote weighs about 30 pounds and a wolf about 80 pounds. Coby weighs 45 pounds. Is he closer in size to a coyote or a wolf?', choices: ['Closer to a coyote', 'Exactly in the middle', 'Closer to a wolf'], correct: 0 },
      { type: 'truefalse', statement: 'Eastern coyotes can only live in the wilderness far from cities. They never adapt to living near people.', isTrue: false },
      { type: 'choice', question: 'Coyotes communicate with 11 different vocalizations. Humans communicate with thousands of words. What does this difference tell you about language complexity?', choices: ['Human language is more complex and detailed', 'Coyote language is more complex', 'They communicate the same amount of information'], correct: 0 },
      { type: 'which', question: 'Coyotes are opportunistic eaters — they eat whatever is available. Which other animal is also an opportunistic eater?', choices: ['🐦', '🐼', '🦋'], correct: 0 },
      { type: 'choice', question: 'Coby runs at 40 mph. A squirrel runs at 12 mph. How many mph faster is Coby?', choices: ['24 mph', '28 mph', '32 mph'], correct: 1 },
      { type: 'choice', question: 'Coyotes have expanded their range from the western US to the eastern US and even into cities. What does this tell you about coyotes as a species?', choices: ['They are highly adaptable animals', 'They prefer city environments', 'They need to be moved by humans to expand'], correct: 0 },
    ],
  },
  {
    animalId: 'whale',
    bonusXP: 30,
    puzzles: [
      { type: 'choice', question: 'A humpback whale can hold its breath for 40 minutes. If you can hold yours for 1 minute, how many times longer can the whale hold its breath?', choices: ['20 times', '40 times', '80 times'], correct: 1 },
      { type: 'truefalse', statement: 'Humpback whale songs are the same every year — they never change.', isTrue: false },
      { type: 'choice', question: 'Whales breach (jump fully out of the water) weighing up to 40 tons. A ton is 2,000 pounds. How many pounds is a 40-ton whale?', choices: ['40,000 lbs', '80,000 lbs', '800,000 lbs'], correct: 1 },
      { type: 'which', question: 'Whales are mammals, not fish. Which other ocean animal is also a mammal?', choices: ['🐬', '🦈', '🐙'], correct: 0 },
      { type: 'choice', question: 'Humpback whales travel 10,000 miles on their annual migration. If they swim 100 miles per day, how many days does the trip take?', choices: ['50 days', '100 days', '200 days'], correct: 1 },
      { type: 'choice', question: 'Baby blue whales gain 200 pounds per day from their mother\'s milk. After 7 days, how much weight has the baby gained?', choices: ['700 lbs', '1,400 lbs', '2,000 lbs'], correct: 1 },
    ],
  },

  // ── Acadia ──────────────────────────────────────────────────────────────────
  {
    animalId: 'porcupine',
    bonusXP: 22,
    puzzles: [
      { type: 'choice', question: 'Penny has 30,000 quills. If she loses 100 quills in a month and they all grow back, about how many months would it take to replace ALL her quills?', choices: ['100 months', '300 months', '3,000 months'], correct: 1 },
      { type: 'choice', question: 'Porcupine quills have backward-facing barbs. Why does this make them so hard to remove once they poke something?', choices: ['The barbs grip tighter when you pull, like a fishhook', 'The quills are coated in sticky glue', 'The barbs dissolve and make the skin swell'], correct: 0 },
      { type: 'truefalse', statement: 'Porcupines can shoot their quills at predators like arrows.', isTrue: false },
      { type: 'which', question: 'Porcupines are rodents. Which other animal is also a rodent?', choices: ['🐭', '🐇', '🦔'], correct: 0 },
      { type: 'choice', question: 'Penny weighs 25 pounds. A baby porcupine weighs 1 pound at birth. By what factor has Penny grown from her birth weight?', choices: ['15 times', '25 times', '30 times'], correct: 1 },
      { type: 'choice', question: 'Porcupine quills are modified hairs. If Penny has 30,000 quills and 10,000 regular hairs, how many total hairs (quills + regular) does she have?', choices: ['20,000', '40,000', '30,000'], correct: 1 },
    ],
  },
  {
    animalId: 'falcon',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'Finnegan dives at 240 miles per hour. A car on the highway goes 60 miles per hour. How many times faster is Finnegan than the car?', choices: ['2 times', '4 times', '6 times'], correct: 1 },
      { type: 'choice', question: 'Peregrine falcons almost went extinct because of a pesticide called DDT that made their eggshells too thin. Scientists banned DDT and the falcons recovered. What does this teach us?', choices: ['Human actions can both harm and help animal species', 'Falcons can adapt to any chemical', 'DDT only affects bird eggs, nothing else'], correct: 0 },
      { type: 'truefalse', statement: 'Peregrine falcons now nest on skyscrapers in cities, not just on cliffs.', isTrue: true },
      { type: 'which', question: 'Falcons have a notch in their beak to sever a prey\'s spine. Which tool has a similar purpose?', choices: ['✂️', '🔭', '📷'], correct: 0 },
      { type: 'choice', question: 'Finnegan spots prey from 1 mile away and dives at 240 mph. If the prey is 0.5 miles away when he spots it, about how many seconds does his dive take? (Hint: 240 mph = 4 miles per minute)', choices: ['About 7 seconds', 'About 15 seconds', 'About 30 seconds'], correct: 0 },
      { type: 'choice', question: 'A peregrine falcon\'s eyesight is 8x sharper than a human\'s. If you can spot a bird from 100 feet, from how far can the falcon see the same bird?', choices: ['400 feet', '800 feet', '1,600 feet'], correct: 1 },
    ],
  },
  {
    animalId: 'lynx',
    bonusXP: 30,
    puzzles: [
      { type: 'choice', question: 'Luna\'s snowshoe paws are 4 inches wide. A house cat\'s paw is about 1 inch wide. Luna\'s paws spread her weight over how many times more area?', choices: ['8 times', '16 times', '4 times'], correct: 1 },
      { type: 'choice', question: 'Canada lynx populations rise and fall with snowshoe hare populations. If hares decrease, what do you predict happens to the lynx?', choices: ['Lynx decrease too, because they depend on hares for food', 'Lynx increase because there is less competition', 'Nothing changes for the lynx'], correct: 0 },
      { type: 'truefalse', statement: 'A Canada lynx\'s paws work like built-in snowshoes, keeping it from sinking in deep snow.', isTrue: true },
      { type: 'which', question: 'Lynx and snowshoe hare populations cycle together every 10 years. What do scientists call this type of relationship between predator and prey?', choices: ['Population cycle', 'Migration', 'Hibernation'], correct: 0 },
      { type: 'choice', question: 'Luna can leap 25 feet in a single bound. An Olympic long jump is about 29 feet. How many feet short of the Olympic record is Luna\'s leap?', choices: ['2 feet', '4 feet', '6 feet'], correct: 1 },
      { type: 'choice', question: 'A lynx has ear tufts (tufts of black fur on the tips of its ears). These may improve hearing. If removing the tufts reduced hearing range by 10%, and it could hear 100 feet, how far could it hear without tufts?', choices: ['80 feet', '90 feet', '95 feet'], correct: 1 },
    ],
  },
  {
    animalId: 'eagle',
    bonusXP: 30,
    puzzles: [
      { type: 'choice', question: 'An eagle\'s vision is 8x sharper than a human\'s. You can see a rabbit from 250 feet. From how far can the eagle see that same rabbit?', choices: ['1,000 feet', '2,000 feet', '3,000 feet'], correct: 1 },
      { type: 'truefalse', statement: 'A bald eagle\'s nest (eyrie) can weigh up to 1 ton (2,000 pounds) after years of adding sticks.', isTrue: true },
      { type: 'choice', question: 'Eagles can spot prey from 2 miles away. If an eagle circles at a height of 1,000 feet and scans a 2-mile radius below, it can see an area of roughly 12 square miles. Why is high altitude helpful for hunting?', choices: ['They can see a much wider area of ground', 'It makes them harder to spot by prey', 'Both of the above'], correct: 2 },
      { type: 'which', question: 'Bald eagles are the national symbol of the United States. Which animal is the national symbol of Canada?', choices: ['🦫', '🐻', '🦅'], correct: 0 },
      { type: 'choice', question: 'Eagles dive at 100 mph to catch fish. They grab fish with talons. If a fish is 50 feet below and the eagle drops at 100 mph (about 150 feet per second), roughly how many seconds does the dive take?', choices: ['Less than 1 second', 'About 2 seconds', 'About 5 seconds'], correct: 0 },
      { type: 'choice', question: 'Bald eagles nearly went extinct due to hunting and DDT pesticide. Conservation laws saved them. What does this story teach us?', choices: ['Laws protecting animals can help species recover', 'Eagles are too tough to go extinct', 'Pesticides help birds grow stronger'], correct: 0 },
    ],
  },

  // ── Hidden animals ─────────────────────────────────────────────────────────
  {
    animalId: 'groundhog',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'Gabby hibernates for 5 months every year. How many months per year is she AWAKE?', choices: ['5 months', '7 months', '8 months'], correct: 1 },
      { type: 'truefalse', statement: 'Groundhog Day is a real holiday where people watch a groundhog to predict the weather. Scientists say groundhogs are very accurate weather forecasters.', isTrue: false },
      { type: 'choice', question: 'A groundhog can eat 1.5 pounds of food a day. How many pounds does she eat in a week?', choices: ['7.5 lbs', '10.5 lbs', '14 lbs'], correct: 1 },
      { type: 'which', question: 'Groundhogs are also called woodchucks. Which other animal also has a funny alternate name?', choices: ['🦔', '🐻', '🦋'], correct: 0 },
      { type: 'choice', question: 'Groundhog burrows can be up to 6 feet deep and 25 feet long. If Gabby\'s burrow is 20 feet long, how many feet shorter is it than the maximum length?', choices: ['3 feet', '5 feet', '7 feet'], correct: 1 },
      { type: 'truefalse', statement: 'Groundhogs are excellent swimmers and can climb trees.', isTrue: true },
    ],
  },
  {
    animalId: 'heron',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'A heron stands still for 8 minutes before catching a fish. It eats 3 fish per hour. How many times did it stand still to catch those 3 fish?', choices: ['2 times', '3 times', '4 times'], correct: 1 },
      { type: 'choice', question: 'Great blue herons wade in water and use their eyes to spot fish. Why do they stand so perfectly still while hunting?', choices: ['Moving creates ripples that scare fish away', 'They fall asleep while waiting', 'Their legs hurt so they must rest'], correct: 0 },
      { type: 'truefalse', statement: 'Great blue herons are the largest heron species in North America.', isTrue: true },
      { type: 'which', question: 'Herons fly with their neck folded in an "S" shape. Which other bird also folds its neck in flight?', choices: ['🦢', '🦅', '🐦'], correct: 0 },
      { type: 'choice', question: 'Henry the heron has a 6-foot wingspan. Your arm span is about 4 feet. How much wider is Henry\'s wingspan than your arm span?', choices: ['1 foot', '2 feet', '3 feet'], correct: 1 },
      { type: 'choice', question: 'Herons nest in colonies called rookeries high in trees. If 20 pairs of herons each raise 3 chicks, how many total birds are in the rookery?', choices: ['60 birds', '100 birds', '60 chicks + 40 adults = 100 total'], correct: 2 },
    ],
  },
  {
    animalId: 'sandpiper',
    bonusXP: 15,
    puzzles: [
      { type: 'choice', question: 'Pip takes 60 steps per second. How many steps does she take in 5 seconds?', choices: ['240 steps', '300 steps', '350 steps'], correct: 1 },
      { type: 'which', question: 'Sandpipers eat tiny creatures in the wet sand. Which food would they find there?', choices: ['🦀', '🌰', '🍇'], correct: 0 },
      { type: 'truefalse', statement: 'Sandpipers use their long bills to probe deep into sand to find buried worms and shellfish.', isTrue: true },
      { type: 'choice', question: 'A sandpiper migrates 9,300 miles nonstop in one stretch — the longest nonstop flight of any bird. At 35 mph average, roughly how many days does the trip take?', choices: ['5 days', '10 days', '15 days'], correct: 1 },
      { type: 'choice', question: 'Pip and her 3 friends each find 20 sand crabs. How many crabs total did the group find?', choices: ['60', '80', '100'], correct: 1 },
      { type: 'which', question: 'Sandpipers are shorebirds. Which other bird is also a shorebird?', choices: ['🦤', '🐧', '🦚'], correct: 0 },
    ],
  },
  {
    animalId: 'firefly',
    bonusXP: 25,
    puzzles: [
      { type: 'choice', question: 'Flo flashes 3 times per 10 seconds. How many times does she flash in one full minute?', choices: ['12 times', '18 times', '24 times'], correct: 1 },
      { type: 'choice', question: 'Firefly light produces almost no heat — unlike a lightbulb, which gets very hot. What do scientists call light that produces little or no heat?', choices: ['Cold light / bioluminescence', 'Solar energy', 'Electrical current'], correct: 0 },
      { type: 'truefalse', statement: 'Fireflies produce light through a chemical reaction in their abdomen, not through electricity.', isTrue: true },
      { type: 'which', question: 'Fireflies use flashing light to find mates. Which other ocean animal also uses bioluminescence?', choices: ['🦑', '🐟', '🦀'], correct: 0 },
      { type: 'choice', question: 'Each firefly species has its own unique flash pattern. If there are 2,000 species of firefly, and each has a unique pattern, how many different patterns are there?', choices: ['1,000', '2,000', '4,000'], correct: 1 },
      { type: 'choice', question: 'Flo\'s light converts 95% of energy to light and only 5% to heat. A regular bulb converts only 10% to light and 90% to heat. How much more efficient is Flo?', choices: ['5 times more efficient', '9.5 times more efficient', '2 times more efficient'], correct: 1 },
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
