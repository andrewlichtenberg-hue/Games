import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { SceneBackground } from '../components/SceneBackground';
import { LilaCharacter } from '../components/LilaCharacter';
import { AnimalSprite } from '../components/AnimalSprite';
import { SpeechBubble } from '../components/SpeechBubble';
import { XPBar } from '../components/XPBar';
import { BigButton } from '../components/ui/BigButton';
import { C } from '../utils/colors';
import { getLocationById } from '../game/locations';
import { getAnimalsForLocation, Animal } from '../game/animals';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../audio/audioManager';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');
const SCENE_H = 280;
const LILA_SIZE = 100;
const GROUND_Y = SCENE_H * 0.62; // matches SceneBackground
const LILA_Y = GROUND_Y - LILA_SIZE + 10;

type Props = {
  route: RouteProp<RootStackParamList, 'Exploration'>;
  navigation: StackNavigationProp<RootStackParamList, 'Exploration'>;
};

interface SpawnedAnimal {
  animal: Animal;
  x: number;
  bounceAnim: Animated.Value;
  found: boolean;
}

function spawnAnimals(animals: Animal[], screenW: number): SpawnedAnimal[] {
  const positions = [0.15, 0.3, 0.5, 0.7, 0.85];
  return animals.slice(0, 5).map((animal, i) => ({
    animal,
    x: positions[i % positions.length] * screenW,
    bounceAnim: new Animated.Value(0),
    found: false,
  }));
}

export function ExplorationScreen({ route, navigation }: Props) {
  const { locationId } = route.params;
  const location = getLocationById(locationId);
  const locationAnimals = location ? getAnimalsForLocation(locationId) : [];

  const {
    hairColor, skinTone, outfitColor, equippedHat,
    level, xp, discoveredAnimals, animalFriendship,
    gainXP, discoverAnimal, increaseFriendship, visitLocation,
  } = useGameStore();

  // Lila position
  const lilaX = useRef(new Animated.Value(width * 0.15)).current;
  const [lilaFacing, setLilaFacing] = useState<'left' | 'right'>('right');
  const [lilaCurrentX, setLilaCurrentX] = useState(width * 0.15);

  // Spawned animals
  const [spawnedAnimals, setSpawnedAnimals] = useState<SpawnedAnimal[]>(() =>
    spawnAnimals(locationAnimals, width)
  );

  // Selected animal dialog
  const [selectedAnimal, setSelectedAnimal] = useState<SpawnedAnimal | null>(null);
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  // Session stats
  const [sessionFinds, setSessionFinds] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [showSessionEnd, setShowSessionEnd] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (location) {
        visitLocation(locationId);
        const track =
          location.sceneType === 'beach' ? 'beach' :
          location.sceneType === 'forest' ? 'forest' :
          location.sceneType === 'mountain' ? 'mountain' : 'park';
        audioManager.playMusic(track);
      }
    }, [locationId])
  );

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text>Location not found</Text>
      </View>
    );
  }

  const handleScenePress = (evt: any) => {
    if (selectedAnimal) return; // don't move while dialog open
    const tapX = evt.nativeEvent.locationX;
    const currentX = lilaCurrentX;

    setLilaFacing(tapX > currentX ? 'right' : 'left');
    setLilaCurrentX(tapX - LILA_SIZE / 2);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    audioManager.playSfx('walk');

    Animated.spring(lilaX, {
      toValue: tapX - LILA_SIZE / 2,
      useNativeDriver: true,
      speed: 10,
      bounciness: 4,
    }).start();
  };

  const handleAnimalPress = (spawned: SpawnedAnimal) => {
    if (selectedAnimal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    audioManager.playSfx('discover');

    // Bounce the animal
    Animated.sequence([
      Animated.timing(spawned.bounceAnim, { toValue: -16, duration: 150, useNativeDriver: true }),
      Animated.spring(spawned.bounceAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();

    setSelectedAnimal(spawned);
    bubbleOpacity.setValue(0);
    Animated.timing(bubbleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const handleSayHi = () => {
    if (!selectedAnimal) return;
    const { animal } = selectedAnimal;
    const isNew = !discoveredAnimals.includes(animal.id);
    const xpAmount = animal.xpReward;

    gainXP(xpAmount);
    discoverAnimal(animal.id);
    increaseFriendship(animal.id);

    setXpGained((prev) => prev + xpAmount);
    if (isNew) setSessionFinds((prev) => prev + 1);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    audioManager.playSfx('success');

    // Mark as found and close bubble
    setSpawnedAnimals((prev) =>
      prev.map((s) => s.animal.id === animal.id ? { ...s, found: true } : s)
    );
    closeBubble();

    // After 3 finds, suggest going home
    if (sessionFinds + (isNew ? 1 : 0) >= 3) {
      setTimeout(() => setShowSessionEnd(true), 800);
    }
  };

  const closeBubble = () => {
    Animated.timing(bubbleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSelectedAnimal(null);
    });
  };

  const animalGreeting = selectedAnimal
    ? selectedAnimal.animal.greetings[
        Math.floor(Math.random() * selectedAnimal.animal.greetings.length)
      ]
    : '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Map</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.locationName}>{location.name}</Text>
          <Text style={styles.locationSub}>{location.subtitle}</Text>
        </View>
        {xpGained > 0 && (
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>+{xpGained} XP</Text>
          </View>
        )}
      </View>

      {/* XP bar */}
      <View style={styles.xpBarWrapper}>
        <XPBar xp={xp} level={level} showTitle={false} />
      </View>

      {/* Scene */}
      <TouchableWithoutFeedback onPress={handleScenePress}>
        <View style={styles.sceneContainer}>
          <SceneBackground
            sceneType={location.sceneType}
            skyTop={location.skyTop}
            skyBottom={location.skyBottom}
            groundColor={location.groundColor}
            accentColor={location.accentColor}
          />

          {/* Animals */}
          {spawnedAnimals.map((spawned, i) => {
            const friendship = animalFriendship[spawned.animal.id] ?? 0;
            const isDiscovered = discoveredAnimals.includes(spawned.animal.id);
            return (
              <Animated.View
                key={spawned.animal.id}
                style={[
                  styles.animalWrapper,
                  {
                    left: spawned.x - 40,
                    bottom: SCENE_H - GROUND_Y,
                    transform: [{ translateY: spawned.bounceAnim }],
                    opacity: spawned.found ? 0.4 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => !spawned.found && handleAnimalPress(spawned)}
                  activeOpacity={0.85}
                >
                  <AnimalSprite
                    type={spawned.animal.type}
                    size={70}
                    bodyColor={spawned.animal.bodyColor}
                    accentColor={spawned.animal.accentColor}
                  />
                  {spawned.found && (
                    <Text style={styles.heartBadge}>❤️</Text>
                  )}
                  {spawned.animal.rarity === 'legendary' && !isDiscovered && (
                    <Text style={styles.rareBadge}>✨</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.animalNameLabel}>
                  {isDiscovered ? spawned.animal.name.split(' ')[0] : '???'}
                </Text>
              </Animated.View>
            );
          })}

          {/* Lila */}
          <Animated.View
            style={[
              styles.lilaWrapper,
              {
                transform: [{ translateX: lilaX }],
                bottom: SCENE_H - GROUND_Y - 4,
              },
            ]}
          >
            <LilaCharacter
              hairColor={hairColor}
              skinTone={skinTone}
              outfitColor={outfitColor}
              equippedHat={equippedHat}
              size={LILA_SIZE}
              facing={lilaFacing}
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* Speech bubble */}
      {selectedAnimal && (
        <View style={styles.bubbleArea}>
          <SpeechBubble
            animalName={selectedAnimal.animal.name}
            message={animalGreeting}
            isNew={!discoveredAnimals.includes(selectedAnimal.animal.id)}
            friendshipLevel={animalFriendship[selectedAnimal.animal.id] ?? 0}
            onSayHi={handleSayHi}
            onClose={closeBubble}
            opacity={bubbleOpacity}
          />
        </View>
      )}

      {/* Info panel: location description + animal hints */}
      {!selectedAnimal && !showSessionEnd && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoPanelTitle}>{location.name}</Text>
          <Text style={styles.infoPanelDesc}>{location.description}</Text>
          <Text style={styles.tapHint}>👆 Tap the scene to walk • Tap animals to say hi!</Text>
        </View>
      )}

      {/* Session end suggestion */}
      {showSessionEnd && !selectedAnimal && (
        <View style={styles.sessionEnd}>
          <Text style={styles.sessionEndTitle}>Amazing exploring! 🎉</Text>
          <Text style={styles.sessionEndText}>
            You found {sessionFinds} new friend{sessionFinds !== 1 ? 's' : ''}
            {'\n'}and earned {xpGained} XP!
          </Text>
          <View style={styles.sessionEndButtons}>
            <BigButton
              label="Keep Exploring"
              onPress={() => setShowSessionEnd(false)}
              color="green"
              size="small"
              style={{ flex: 1, marginRight: 8 }}
            />
            <BigButton
              label="Go Home"
              onPress={() => navigation.navigate('Home')}
              color="purple"
              size="small"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F5E9' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backText: { fontSize: 15, fontWeight: '700', color: C.TEXT_MID },
  headerCenter: { flex: 1 },
  locationName: { fontSize: 18, fontWeight: '900', color: C.TEXT_DARK },
  locationSub: { fontSize: 12, color: C.TEXT_MID, fontWeight: '600' },
  xpBadge: {
    backgroundColor: C.XP_FILL,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpBadgeText: { color: 'white', fontSize: 13, fontWeight: '800' },
  xpBarWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  sceneContainer: {
    height: SCENE_H,
    width,
    position: 'relative',
    overflow: 'hidden',
  },
  animalWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  animalNameLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.TEXT_DARK,
    textAlign: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  heartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 18,
  },
  rareBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    fontSize: 16,
  },
  lilaWrapper: {
    position: 'absolute',
  },
  bubbleArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoPanel: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: C.UI_PANEL,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoPanelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.TEXT_DARK,
    marginBottom: 4,
  },
  infoPanelDesc: {
    fontSize: 13,
    color: C.TEXT_MID,
    lineHeight: 19,
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 12,
    color: C.UI_PRIMARY,
    fontWeight: '700',
  },
  sessionEnd: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFF9C4',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: C.UI_GOLD,
    alignItems: 'center',
  },
  sessionEndTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.TEXT_DARK,
    marginBottom: 4,
  },
  sessionEndText: {
    fontSize: 14,
    color: C.TEXT_MID,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 20,
  },
  sessionEndButtons: {
    flexDirection: 'row',
    width: '100%',
  },
});
