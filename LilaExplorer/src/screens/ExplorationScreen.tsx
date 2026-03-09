import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Haptics } from '../utils/haptics';
import { SceneBackground } from '../components/SceneBackground';
import { LilaCharacter } from '../components/LilaCharacter';
import { AnimalSprite } from '../components/AnimalSprite';
import { SpeechBubble } from '../components/SpeechBubble';
import { PuzzleModal } from '../components/PuzzleModal';
import { XPBar } from '../components/XPBar';
import { BattleModal } from '../components/BattleModal';
import { BigButton } from '../components/ui/BigButton';
import { C } from '../utils/colors';
import { getLocationById } from '../game/locations';
import { getAnimalsForLocation, Animal } from '../game/animals';
import { getRandomPuzzle } from '../game/puzzles';
import { getItemById } from '../game/items';
import { MAX_FRIENDSHIP } from '../game/progression';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../audio/audioManager';
import type { RootStackParamList } from '../../App';
import type { Puzzle } from '../game/puzzles';

const { width, height } = Dimensions.get('window');
const SCENE_H = Math.min(280, height * 0.36);
const LILA_SIZE = 100;
const GROUND_Y = SCENE_H * 0.62;

type Props = {
  route: RouteProp<RootStackParamList, 'Exploration'>;
  navigation: StackNavigationProp<RootStackParamList, 'Exploration'>;
};

interface SpawnedAnimal {
  animal: Animal;
  x: number;
  bounceAnim: Animated.Value;
  scaleAnim: Animated.Value;
  found: boolean;
  isBonus: boolean;
  isHidden: boolean;
}

function spawnAnimals(
  animals: Animal[],
  screenW: number,
  hasBinoculars: boolean,
  visitCount: number,
): SpawnedAnimal[] {
  const visible = animals.filter(
    (a) => !a.hidden || visitCount >= (a.minVisits ?? 3)
  );
  const max = hasBinoculars ? 6 : 5;
  const positions = [0.12, 0.28, 0.48, 0.68, 0.84, 0.95];
  return visible.slice(0, max).map((animal, i) => {
    const isBonus = hasBinoculars && i === max - 1;
    return {
      animal,
      x: positions[i % positions.length] * screenW,
      bounceAnim: new Animated.Value(0),
      scaleAnim: new Animated.Value(isBonus ? 0 : 1),
      found: false,
      isBonus,
      isHidden: !!animal.hidden,
    };
  });
}

export function ExplorationScreen({ route, navigation }: Props) {
  const { locationId } = route.params;
  const location = getLocationById(locationId);
  const locationAnimals = location ? getAnimalsForLocation(locationId) : [];

  const {
    hairColor, skinTone, outfitColor, equippedHat, equippedOutfit,
    level, xp, discoveredAnimals, animalFriendship, companionAnimals,
    activePowerups, ownedItems, locationVisitCounts,
    gainXP, discoverAnimal, increaseFriendship, visitLocation,
  } = useGameStore();

  const activeOutfitColor = equippedOutfit
    ? (getItemById(equippedOutfit)?.color ?? outfitColor)
    : outfitColor;

  // Only ACTIVE powerups have effects (all owned powers auto-activate now)
  const hasPowerup = (id: string) => activePowerups.includes(id);
  const hasBinoculars    = hasPowerup('powerup-binoculars');
  const hasRainBoots     = hasPowerup('powerup-rain-boots');
  const hasCalculator    = hasPowerup('powerup-calculator');
  const hasLantern       = hasPowerup('powerup-lantern');
  const hasWhistle       = hasPowerup('powerup-whistle');
  const hasGoldenJournal = hasPowerup('powerup-journal-upgrade');
  const hasLuckyClover   = hasPowerup('powerup-lucky-clover');

  // +1 for the current visit (visitLocation will fire on focus)
  const visitCount = (locationVisitCounts[locationId] ?? 0) + 1;

  // Hidden animals that haven't appeared yet (for info hint)
  const hasUndiscoveredHidden = locationAnimals.some(
    (a) => a.hidden && !discoveredAnimals.includes(a.id) && visitCount < (a.minVisits ?? 3)
  );

  // ── Lila movement ─────────────────────────────────────────────
  const lilaX = useRef(new Animated.Value(width * 0.15)).current;
  const [lilaFacing, setLilaFacing] = useState<'left' | 'right'>('right');
  const [lilaCurrentX, setLilaCurrentX] = useState(width * 0.15);

  // ── Animals ───────────────────────────────────────────────────
  const [spawnedAnimals, setSpawnedAnimals] = useState<SpawnedAnimal[]>(() =>
    spawnAnimals(locationAnimals, width, hasBinoculars, visitCount)
  );

  // ── Speech bubble ─────────────────────────────────────────────
  const [selectedAnimal, setSelectedAnimal] = useState<SpawnedAnimal | null>(null);
  const [currentGreeting, setCurrentGreeting] = useState('');
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  // ── Puzzle ────────────────────────────────────────────────────
  const [activePuzzle, setActivePuzzle] = useState<{
    animal: Animal;
    puzzle: Puzzle;
    bonusXP: number;
  } | null>(null);

  // ── Lantern hint — one per area visit ─────────────────────────
  const [hintAvailable, setHintAvailable] = useState(hasLantern);
  const [hintUsed, setHintUsed] = useState(false);

  // ── Calculator — one per area visit ───────────────────────────
  const [calcAvailable, setCalcAvailable] = useState(hasCalculator);

  // ── Lucky Clover — one free retry per area visit ───────────────
  const [cloverAvailable, setCloverAvailable] = useState(hasLuckyClover);

  // ── Rain Boots XP toast ───────────────────────────────────────
  const [rainToast, setRainToast] = useState<string | null>(null);
  const rainToastAnim = useRef(new Animated.Value(0)).current;

  // ── New companion popup ───────────────────────────────────────
  const [companionPopup, setCompanionPopup] = useState<Animal | null>(null);

  // ── Secret animal toast ───────────────────────────────────────
  const [secretToast, setSecretToast] = useState(false);
  const secretToastAnim = useRef(new Animated.Value(0)).current;

  // ── Session stats ─────────────────────────────────────────────
  const [sessionFinds, setSessionFinds] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [showSessionEnd, setShowSessionEnd] = useState(false);

  // ── Battle ────────────────────────────────────────────────────
  const [showBattle, setShowBattle] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'back' | 'home' | null>(null);

  const handleLeave = (dest: 'back' | 'home') => {
    if (sessionFinds > 0) {
      setPendingNavigation(dest);
      setShowBattle(true);
    } else {
      dest === 'back' ? navigation.goBack() : navigation.navigate('Home');
    }
  };

  const handleBattleVictory = (bonusXP: number) => {
    gainXP(bonusXP);
    setShowBattle(false);
    if (pendingNavigation === 'back') navigation.goBack();
    else navigation.navigate('Home');
  };

  const handleBattleSkip = () => {
    setShowBattle(false);
    if (pendingNavigation === 'back') navigation.goBack();
    else navigation.navigate('Home');
  };

  // ── Binoculars: zoom in the bonus animal after mount ──────────
  useEffect(() => {
    if (!hasBinoculars) return;
    const bonus = spawnedAnimals.find((s) => s.isBonus);
    if (!bonus) return;
    setTimeout(() => {
      Animated.spring(bonus.scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 6,
        bounciness: 14,
      }).start();
      audioManager.playSfx('discover');
    }, 900);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (location) {
        visitLocation(locationId);
        const track =
          location.sceneType === 'beach' ? 'beach' :
          location.sceneType === 'forest' || location.sceneType === 'jungle' ? 'forest' :
          location.sceneType === 'mountain' ? 'mountain' : 'park';
        audioManager.playMusic(track);
      }
      setHintAvailable(hasLantern);
      setHintUsed(false);
      setCalcAvailable(hasCalculator);
      setCloverAvailable(hasLuckyClover);
    }, [locationId])
  );

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text>Location not found</Text>
      </View>
    );
  }

  // ── Toasts ────────────────────────────────────────────────────

  const showCompanionPopup = (animal: Animal) => {
    setCompanionPopup(animal);
    audioManager.playSfx('friendship');
  };

  const showSecretToast = () => {
    setSecretToast(true);
    secretToastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(secretToastAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(secretToastAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setSecretToast(false));
  };

  const showRainToast = (bonus: number) => {
    setRainToast(`+${bonus} 🌧️ boots bonus!`);
    rainToastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(rainToastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(rainToastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setRainToast(null));
  };

  // ── XP helpers ────────────────────────────────────────────────

  const gainXPWithBoots = (base: number) => {
    if (hasRainBoots) {
      const bonus = Math.ceil(base * 0.25);
      gainXP(base + bonus);
      showRainToast(bonus);
      return base + bonus;
    }
    gainXP(base);
    return base;
  };

  const tryIncreaseFriendship = (animal: Animal, extraBoost = false) => {
    const current = animalFriendship[animal.id] ?? 0;
    const threshold = animal.companionThreshold ?? MAX_FRIENDSHIP;
    const alreadyCompanion = companionAnimals.includes(animal.id);
    increaseFriendship(animal.id, threshold);
    if (extraBoost) increaseFriendship(animal.id, threshold);
    const newLevel = Math.min(current + (extraBoost ? 2 : 1), MAX_FRIENDSHIP);
    if (newLevel >= threshold && !alreadyCompanion) {
      setTimeout(() => showCompanionPopup(animal), 400);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────

  const handleScenePress = (evt: any) => {
    if (selectedAnimal || activePuzzle) return;
    const tapX = evt.nativeEvent.locationX;
    setLilaFacing(tapX > lilaCurrentX ? 'right' : 'left');
    setLilaCurrentX(tapX - LILA_SIZE / 2);
    Haptics.impact();
    audioManager.playSfx('walk');
    Animated.spring(lilaX, {
      toValue: tapX - LILA_SIZE / 2,
      useNativeDriver: true,
      speed: 10,
      bounciness: 4,
    }).start();
  };

  const handleAnimalPress = (spawned: SpawnedAnimal) => {
    if (selectedAnimal || activePuzzle) return;
    Haptics.impact();
    audioManager.playSfx('discover');

    Animated.sequence([
      Animated.timing(spawned.bounceAnim, { toValue: -16, duration: 150, useNativeDriver: true }),
      Animated.spring(spawned.bounceAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();

    setSelectedAnimal(spawned);
    setCurrentGreeting(
      spawned.animal.greetings[Math.floor(Math.random() * spawned.animal.greetings.length)]
    );
    bubbleOpacity.setValue(0);
    Animated.timing(bubbleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const handleSayHi = () => {
    if (!selectedAnimal) return;
    const { animal } = selectedAnimal;
    const isNew = !discoveredAnimals.includes(animal.id);

    const earned = gainXPWithBoots(animal.xpReward);
    discoverAnimal(animal.id);
    tryIncreaseFriendship(animal);

    setXpGained((prev) => prev + earned);
    const newFinds = sessionFinds + (isNew ? 1 : 0);
    if (isNew) setSessionFinds(newFinds);

    // Secret animal found!
    if (isNew && selectedAnimal.isHidden) {
      setTimeout(() => showSecretToast(), 600);
    }

    Haptics.notification();
    audioManager.playSfx('success');

    setSpawnedAnimals((prev) =>
      prev.map((s) => s.animal.id === animal.id ? { ...s, found: true } : s)
    );
    closeBubble();

    const puzzleData = getRandomPuzzle(animal.id);
    if (puzzleData) {
      setTimeout(() => setActivePuzzle({ animal, ...puzzleData }), 350);
    } else {
      if (newFinds >= 3) setTimeout(() => setShowSessionEnd(true), 800);
    }
  };

  const handlePuzzleCorrect = (bonusXP: number) => {
    if (!activePuzzle) return;
    const actualXP = hasGoldenJournal ? bonusXP * 2 : bonusXP;
    gainXP(actualXP);
    tryIncreaseFriendship(activePuzzle.animal, true);
    setXpGained((prev) => prev + actualXP);
    setActivePuzzle(null);
    if (sessionFinds >= 3) setTimeout(() => setShowSessionEnd(true), 600);
  };

  const handlePuzzleDismiss = () => {
    setActivePuzzle(null);
    if (sessionFinds >= 3) setTimeout(() => setShowSessionEnd(true), 600);
  };

  const handleHintUsed = () => {
    setHintAvailable(false);
    setHintUsed(true);
  };

  const closeBubble = () => {
    Animated.timing(bubbleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSelectedAnimal(null);
    });
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => handleLeave('back')} style={styles.backBtn}>
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

      {/* Active power-up chips */}
      {(hasBinoculars || hasRainBoots || calcAvailable || (hasLantern && hintAvailable) || hasWhistle || hasGoldenJournal || cloverAvailable) && (
        <View style={styles.powerupChips}>
          {hasBinoculars && (
            <View style={[styles.chip, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.chipText}>🔭 +1 animal</Text>
            </View>
          )}
          {hasRainBoots && (
            <View style={[styles.chip, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.chipText}>🌧️ +25% XP</Text>
            </View>
          )}
          {calcAvailable && (
            <View style={[styles.chip, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.chipText}>🧮 calc ready</Text>
            </View>
          )}
          {hasLantern && hintAvailable && (
            <View style={[styles.chip, { backgroundColor: '#FFF9C4' }]}>
              <Text style={styles.chipText}>🏮 hint ready</Text>
            </View>
          )}
          {hasWhistle && (
            <View style={[styles.chip, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.chipText}>🎵 names shown</Text>
            </View>
          )}
          {hasGoldenJournal && (
            <View style={[styles.chip, { backgroundColor: '#FFF8E1' }]}>
              <Text style={styles.chipText}>📒 2× puzzle XP</Text>
            </View>
          )}
          {cloverAvailable && (
            <View style={[styles.chip, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.chipText}>🍀 retry ready</Text>
            </View>
          )}
        </View>
      )}

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
          {spawnedAnimals.map((spawned) => {
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
                    transform: [
                      { translateY: spawned.bounceAnim },
                      { scale: spawned.scaleAnim },
                    ],
                    opacity: spawned.found ? 0.4 : 1,
                  },
                ]}
              >
                {/* Name label ABOVE the sprite so it doesn't overlap the ground */}
                <Text style={styles.animalNameLabel}>
                  {(isDiscovered || hasWhistle) ? spawned.animal.name.split(' ')[0] : '???'}
                </Text>

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
                  {spawned.found && <Text style={styles.heartBadge}>❤️</Text>}
                  {spawned.isBonus && !spawned.found && (
                    <Text style={styles.bonusBadge}>🔭</Text>
                  )}
                  {spawned.isHidden && !isDiscovered && !spawned.found && (
                    <Text style={styles.hiddenBadge}>🌟</Text>
                  )}
                  {spawned.animal.rarity === 'legendary' && !isDiscovered && !spawned.isBonus && !spawned.isHidden && (
                    <Text style={styles.rareBadge}>✨</Text>
                  )}
                </TouchableOpacity>

                {/* Friendship hearts below sprite */}
                {isDiscovered && (
                  <View style={styles.miniHearts}>
                    {Array.from({ length: MAX_FRIENDSHIP }, (_, i) => (
                      <Text key={i} style={styles.miniHeart}>
                        {i < friendship ? '❤️' : '🤍'}
                      </Text>
                    ))}
                  </View>
                )}
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
              outfitColor={activeOutfitColor}
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
            message={currentGreeting}
            isNew={!discoveredAnimals.includes(selectedAnimal.animal.id)}
            friendshipLevel={animalFriendship[selectedAnimal.animal.id] ?? 0}
            onSayHi={handleSayHi}
            onClose={closeBubble}
            opacity={bubbleOpacity}
          />
        </View>
      )}

      {/* Info / session end panel */}
      {!selectedAnimal && !showSessionEnd && !activePuzzle && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoPanelTitle}>{location.name}</Text>
          <Text style={styles.infoPanelDesc}>{location.description}</Text>
          {hasUndiscoveredHidden && (
            <Text style={styles.hiddenHint}>
              🌟 A secret friend might appear if you visit again…
            </Text>
          )}
          <Text style={styles.tapHint}>👆 Tap the scene to walk • Tap animals to say hi!</Text>
        </View>
      )}

      {showSessionEnd && !selectedAnimal && !activePuzzle && (
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
              onPress={() => handleLeave('home')}
              color="purple"
              size="small"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      {/* Secret animal toast */}
      {secretToast && (
        <Animated.View
          style={[
            styles.secretToast,
            {
              opacity: secretToastAnim,
              transform: [
                { translateY: secretToastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
            },
          ]}
        >
          <Text style={styles.secretToastText}>🌟 You found a secret animal!</Text>
        </Animated.View>
      )}

      {/* Rain Boots XP toast */}
      {rainToast && (
        <Animated.View
          style={[
            styles.rainToast,
            {
              opacity: rainToastAnim,
              transform: [
                { translateY: rainToastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
              ],
            },
          ]}
        >
          <Text style={styles.rainToastText}>{rainToast}</Text>
        </Animated.View>
      )}

      {/* New companion popup */}
      <Modal
        visible={companionPopup !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCompanionPopup(null)}
      >
        <View style={styles.popupOverlay}>
          <LinearGradient
            colors={['#1B5E20', '#388E3C', '#66BB6A']}
            style={styles.popupCard}
          >
            <Text style={styles.popupStars}>🌟✨🌟</Text>
            <Text style={styles.popupTitle}>New Companion!</Text>
            {companionPopup && (
              <>
                <AnimalSprite
                  type={companionPopup.type}
                  size={90}
                  bodyColor={companionPopup.bodyColor}
                  accentColor={companionPopup.accentColor}
                />
                <Text style={styles.popupAnimalName}>{companionPopup.name}</Text>
                <Text style={styles.popupAnimalEmoji}>{companionPopup.emoji}</Text>
                <View style={styles.popupFactBox}>
                  <Text style={styles.popupFactLabel}>Fun Fact!</Text>
                  <Text style={styles.popupFactText}>{companionPopup.funFact}</Text>
                </View>
                <Text style={styles.popupMoveInText}>
                  {companionPopup.name.split(' ')[0]} is moving into your room! 🏡
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setCompanionPopup(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.popupButtonText}>Yay! 🎉</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Puzzle modal */}
      {activePuzzle && (
        <PuzzleModal
          visible
          animalName={activePuzzle.animal.name}
          animalEmoji={activePuzzle.animal.emoji}
          puzzle={activePuzzle.puzzle}
          bonusXP={activePuzzle.bonusXP}
          hasLanternHint={hasLantern && hintAvailable}
          hasGoldenJournal={hasGoldenJournal}
          hasCalculator={hasCalculator && calcAvailable}
          hasLuckyClover={hasLuckyClover && cloverAvailable}
          onHintUsed={handleHintUsed}
          onCalculatorUsed={() => setCalcAvailable(false)}
          onCorrect={handlePuzzleCorrect}
          onDismiss={handlePuzzleDismiss}
        />
      )}

      {/* Battle modal — triggered when leaving after finding animals */}
      <BattleModal
        visible={showBattle}
        locationId={locationId}
        locationName={location?.name ?? ''}
        companionAnimals={companionAnimals}
        onVictory={handleBattleVictory}
        onSkip={handleBattleSkip}
      />
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
  powerupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.TEXT_DARK,
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
    marginBottom: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  miniHearts: {
    flexDirection: 'row',
    marginTop: 1,
  },
  miniHeart: { fontSize: 7 },
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
  bonusBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    fontSize: 16,
  },
  hiddenBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: 18,
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
    marginBottom: 6,
  },
  hiddenHint: {
    fontSize: 12,
    color: '#7E57C2',
    fontWeight: '700',
    fontStyle: 'italic',
    marginBottom: 6,
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
  secretToast: {
    position: 'absolute',
    bottom: 200,
    alignSelf: 'center',
    backgroundColor: '#FFFDE7',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2.5,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  secretToastText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7E3F00',
  },
  rainToast: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#81C784',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  rainToastText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  // ── Companion popup ──
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCard: {
    width: width - 40,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  popupStars: { fontSize: 28, marginBottom: 4 },
  popupTitle: { fontSize: 28, fontWeight: '900', color: '#FCD34D', marginBottom: 12, letterSpacing: 1 },
  popupAnimalName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 10 },
  popupAnimalEmoji: { fontSize: 32, marginTop: 4, marginBottom: 8 },
  popupFactBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginBottom: 12,
  },
  popupFactLabel: { fontSize: 12, fontWeight: '800', color: '#A5D6A7', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  popupFactText: { fontSize: 14, color: '#FFFFFF', lineHeight: 21, fontStyle: 'italic' },
  popupMoveInText: { fontSize: 15, fontWeight: '700', color: '#C8E6C9', textAlign: 'center', marginBottom: 16 },
  popupButton: {
    backgroundColor: '#FCD34D',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: '#D97706',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  popupButtonText: { fontSize: 20, fontWeight: '900', color: '#1C1917' },
});
