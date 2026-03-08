export type SceneType = 'park' | 'beach' | 'forest' | 'mountain' | 'city';

export interface Location {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  unlockLevel: number;
  animalIds: string[];
  sceneType: SceneType;
  mapX: number;
  mapY: number;
  skyTop: string;
  skyBottom: string;
  groundColor: string;
  accentColor: string;
}

export const LOCATIONS: Location[] = [
  {
    id: 'prospect-park',
    name: 'Prospect Park',
    subtitle: 'Brooklyn, NY',
    description: 'Your neighborhood park! Tall trees, friendly dogs, and lots of birds call this home.',
    unlockLevel: 1,
    animalIds: ['squirrel', 'pigeon', 'dog', 'robin', 'groundhog'],
    sceneType: 'park',
    mapX: 0.62,
    mapY: 0.52,
    skyTop: '#87CEEB',
    skyBottom: '#B3E5FC',
    groundColor: '#5CB85C',
    accentColor: '#2E7D32',
  },
  {
    id: 'brooklyn-heights',
    name: 'Brooklyn Heights',
    subtitle: 'Brooklyn, NY',
    description: 'Cozy brownstone streets meet the waterfront. Cats and raccoons love it here!',
    unlockLevel: 2,
    animalIds: ['cat', 'raccoon', 'sparrow', 'pigeon'],
    sceneType: 'city',
    mapX: 0.63,
    mapY: 0.50,
    skyTop: '#FDB97D',
    skyBottom: '#F9E4B7',
    groundColor: '#8B7355',
    accentColor: '#CD853F',
  },
  {
    id: 'central-park',
    name: 'Central Park',
    subtitle: 'Manhattan, NY',
    description: 'The famous park in the middle of the city. Turtles sunbathe by the pond and hawks soar above!',
    unlockLevel: 3,
    animalIds: ['rabbit', 'turtle', 'hawk', 'squirrel', 'heron'],
    sceneType: 'park',
    mapX: 0.61,
    mapY: 0.48,
    skyTop: '#B3E5FC',
    skyBottom: '#E1F5FE',
    groundColor: '#4CAF50',
    accentColor: '#1B5E20',
  },
  {
    id: 'rockaway-beach',
    name: 'Rockaway Beach',
    subtitle: 'Queens, NY',
    description: 'Sandy shores and crashing waves! Seagulls, pelicans, and dolphins love these waters.',
    unlockLevel: 4,
    animalIds: ['seagull', 'beachcat', 'pelican', 'dolphin', 'sandpiper'],
    sceneType: 'beach',
    mapX: 0.63,
    mapY: 0.55,
    skyTop: '#0288D1',
    skyBottom: '#4FC3F7',
    groundColor: '#F5DEB3',
    accentColor: '#1976D2',
  },
  {
    id: 'staten-island',
    name: 'Staten Island Greenbelt',
    subtitle: 'Staten Island, NY',
    description: 'A big forest hiding right inside the city. Deer tiptoe through the trees at dawn.',
    unlockLevel: 5,
    animalIds: ['chipmunk', 'deer', 'woodpecker', 'turkey'],
    sceneType: 'forest',
    mapX: 0.60,
    mapY: 0.53,
    skyTop: '#4CAF50',
    skyBottom: '#A5D6A7',
    groundColor: '#3D8B3D',
    accentColor: '#1B5E20',
  },
  {
    id: 'hudson-valley',
    name: 'Hudson Valley',
    subtitle: 'New York',
    description: 'Rolling hills, apple orchards, and winding rivers. Foxes, hummingbirds, and beavers thrive here!',
    unlockLevel: 6,
    animalIds: ['fox', 'beaver', 'hummingbird', 'bluebird', 'firefly'],
    sceneType: 'forest',
    mapX: 0.59,
    mapY: 0.44,
    skyTop: '#FF9800',
    skyBottom: '#FFE0B2',
    groundColor: '#795548',
    accentColor: '#4CAF50',
  },
  {
    id: 'catskills',
    name: 'Catskill Mountains',
    subtitle: 'New York',
    description: 'Misty mountains covered in tall pines. Bears, owls, skunks, and bobcats call this home!',
    unlockLevel: 7,
    animalIds: ['bear', 'owl', 'skunk', 'bobcat'],
    sceneType: 'mountain',
    mapX: 0.57,
    mapY: 0.40,
    skyTop: '#6A1B9A',
    skyBottom: '#CE93D8',
    groundColor: '#546E7A',
    accentColor: '#2E7D32',
  },
  {
    id: 'adirondacks',
    name: 'Adirondack Mountains',
    subtitle: 'New York',
    description: 'Wild, remote, and magical. Otters, moose, loons, and wolves roam these ancient mountains!',
    unlockLevel: 8,
    animalIds: ['otter', 'moose', 'loon', 'wolf'],
    sceneType: 'mountain',
    mapX: 0.56,
    mapY: 0.35,
    skyTop: '#1A237E',
    skyBottom: '#5C6BC0',
    groundColor: '#37474F',
    accentColor: '#4FC3F7',
  },
  {
    id: 'cape-cod',
    name: 'Cape Cod',
    subtitle: 'Massachusetts',
    description: 'Curving sandy beaches at the edge of the Atlantic. Seals, plovers, coyotes, and humpback whales await!',
    unlockLevel: 9,
    animalIds: ['seal', 'plover', 'coyote', 'whale'],
    sceneType: 'beach',
    mapX: 0.68,
    mapY: 0.38,
    skyTop: '#00ACC1',
    skyBottom: '#B2EBF2',
    groundColor: '#EFEBE9',
    accentColor: '#006064',
  },
  {
    id: 'acadia',
    name: 'Acadia National Park',
    subtitle: 'Maine',
    description: 'Rocky coastlines, dark pine forests, and brilliant sunrises. Porcupines, falcons, lynxes, and bald eagles!',
    unlockLevel: 10,
    animalIds: ['porcupine', 'falcon', 'lynx', 'eagle'],
    sceneType: 'mountain',
    mapX: 0.67,
    mapY: 0.26,
    skyTop: '#E91E63',
    skyBottom: '#F48FB1',
    groundColor: '#455A64',
    accentColor: '#006064',
  },
];

export const getLocationById = (id: string): Location | undefined =>
  LOCATIONS.find((l) => l.id === id);

export const getUnlockedLocations = (level: number): Location[] =>
  LOCATIONS.filter((l) => l.unlockLevel <= level);
