/**
 * BattleModal — fun "battle" mini-scene shown when leaving an exploration area.
 * Always results in victory (this is a kids' game!).
 * Player picks a companion animal, a quick animation plays, then victory screen.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimalSprite } from './AnimalSprite';
import { getAnimalById } from '../game/animals';
import { C } from '../utils/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BattleModalProps {
  visible: boolean;
  locationId: string;
  locationName: string;
  companionAnimals: string[];  // companion animal IDs
  onVictory: (bonusXP: number) => void;
  onSkip: () => void;
}

type BattlePhase = 'choose' | 'battle' | 'victory';

// ── Enemy data ─────────────────────────────────────────────────────────────────

interface EnemyInfo {
  name: string;
  emoji: string;
  flavor: string;
}

const LOCATION_ENEMIES: Record<string, EnemyInfo> = {
  'prospect-park':     { name: 'Grumpy Goose',       emoji: '🪿', flavor: 'blocking the park gate!' },
  'brooklyn-heights':  { name: 'Bossy Pigeon',        emoji: '🐦', flavor: 'sitting on your head!' },
  'central-park':      { name: 'Sneaky Squirrel',     emoji: '🐿️', flavor: 'stole your snack!' },
  'rockaway-beach':    { name: 'Crabby Crab',         emoji: '🦀', flavor: 'pinching your toes!' },
  'staten-island':     { name: 'Grouchy Groundhog',   emoji: '🦫', flavor: 'blocking the trail!' },
  'hudson-valley':     { name: 'Rowdy Raccoon',       emoji: '🦝', flavor: 'raided your backpack!' },
  'catskills':         { name: 'Grumbly Bear',        emoji: '🐻', flavor: 'needs a nap but blocking the path!' },
  'adirondacks':       { name: 'Angry Moose',         emoji: '🫎', flavor: 'not letting you pass!' },
  'cape-cod':          { name: 'Pushy Pelican',       emoji: '🐦', flavor: 'wants all your fish!' },
  'acadia':            { name: 'Stinky Skunk',        emoji: '🦨', flavor: 'blocking the trail!' },
};

const DEFAULT_ENEMY: EnemyInfo = {
  name: 'Mysterious Critter',
  emoji: '❓',
  flavor: 'blocking your way!',
};

// ── Base XP ───────────────────────────────────────────────────────────────────

const BASE_XP = 25;
const HOME_TURF_BONUS = 15;

// ── Component ─────────────────────────────────────────────────────────────────

export function BattleModal({
  visible,
  locationId,
  locationName,
  companionAnimals,
  onVictory,
  onSkip,
}: BattleModalProps) {
  const [phase, setPhase] = useState<BattlePhase>('choose');
  const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(null);
  const [homeTurfBonus, setHomeTurfBonus] = useState(false);

  // Shake animation for battle phase
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Reset to choose phase every time modal opens
  useEffect(() => {
    if (visible) {
      setPhase('choose');
      setSelectedCompanionId(null);
      setHomeTurfBonus(false);
      shakeAnim.setValue(0);
      flashAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [visible]);

  const enemy = LOCATION_ENEMIES[locationId] ?? DEFAULT_ENEMY;

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handlePickCompanion(animalId: string) {
    const animal = getAnimalById(animalId);
    const isHomeTurf = animal?.locationIds.includes(locationId) ?? false;

    setSelectedCompanionId(animalId);
    setHomeTurfBonus(isHomeTurf);
    setPhase('battle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startBattleAnimation(isHomeTurf);
  }

  function startBattleAnimation(isHomeTurf: boolean) {
    // Shake: oscillate horizontally
    const shake = Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]);

    // Flash opacity
    const flash = Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.2, duration: 120, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0.2, duration: 120, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]);

    // Scale bounce
    const bounce = Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]);

    Animated.parallel([shake, flash, bounce]).start();

    // Auto-advance to victory after 1.5 seconds
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('victory');
    }, 1500);
  }

  function handleVictory() {
    const totalXP = BASE_XP + (homeTurfBonus ? HOME_TURF_BONUS : 0);
    onVictory(totalXP);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const selectedAnimal = selectedCompanionId ? getAnimalById(selectedCompanionId) : null;
  const totalXP = BASE_XP + (homeTurfBonus ? HOME_TURF_BONUS : 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1a0533', '#3b0764', '#6b21a8']}
          style={styles.gradientContainer}
        >
          {/* ── Phase: CHOOSE ─────────────────────────────────────────── */}
          {phase === 'choose' && (
            <View style={styles.phaseContainer}>
              {/* Enemy banner */}
              <View style={styles.enemyBanner}>
                <Text style={styles.warningLabel}>⚠️ OH NO!</Text>
                <Text style={styles.enemyEmoji}>{enemy.emoji}</Text>
                <Text style={styles.enemyName}>{enemy.name}</Text>
                <Text style={styles.enemyFlavor}>is {enemy.flavor}</Text>
              </View>

              {companionAnimals.length === 0 ? (
                // No companions yet
                <View style={styles.noCompanionsBox}>
                  <Text style={styles.noCompanionsEmoji}>🐾</Text>
                  <Text style={styles.noCompanionsText}>
                    Go make some animal friends first!
                  </Text>
                  <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                    <Text style={styles.skipButtonText}>Skip Battle →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.pickLabel}>Pick a companion to fight!</Text>
                  <ScrollView
                    contentContainerStyle={styles.companionGrid}
                    showsVerticalScrollIndicator={false}
                  >
                    {companionAnimals.map((animalId) => {
                      const animal = getAnimalById(animalId);
                      if (!animal) return null;
                      const isHomeTurf = animal.locationIds.includes(locationId);
                      return (
                        <TouchableOpacity
                          key={animalId}
                          style={[
                            styles.companionCard,
                            isHomeTurf && styles.companionCardHomeTurf,
                          ]}
                          onPress={() => handlePickCompanion(animalId)}
                          activeOpacity={0.8}
                        >
                          <AnimalSprite
                            type={animal.type}
                            size={60}
                            bodyColor={animal.bodyColor}
                            accentColor={animal.accentColor}
                          />
                          <Text style={styles.companionName} numberOfLines={2}>
                            {animal.name}
                          </Text>
                          {isHomeTurf && (
                            <View style={styles.homeTurfBadge}>
                              <Text style={styles.homeTurfBadgeText}>🏡 Home!</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <TouchableOpacity onPress={onSkip} style={styles.skipLink}>
                    <Text style={styles.skipLinkText}>Skip Battle</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── Phase: BATTLE ─────────────────────────────────────────── */}
          {phase === 'battle' && selectedAnimal && (
            <View style={styles.phaseContainer}>
              <Text style={styles.battleTitle}>⚔️ BATTLE! ⚔️</Text>

              <View style={styles.battleArena}>
                {/* Companion side */}
                <Animated.View
                  style={[
                    styles.battleSide,
                    {
                      transform: [
                        { translateX: shakeAnim },
                        { scale: scaleAnim },
                      ],
                      opacity: flashAnim,
                    },
                  ]}
                >
                  <AnimalSprite
                    type={selectedAnimal.type}
                    size={80}
                    bodyColor={selectedAnimal.bodyColor}
                    accentColor={selectedAnimal.accentColor}
                  />
                  <Text style={styles.battleSideName} numberOfLines={2}>
                    {selectedAnimal.name}
                  </Text>
                </Animated.View>

                {/* VS badge */}
                <View style={styles.vsBadge}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                {/* Enemy side */}
                <Animated.View
                  style={[
                    styles.battleSide,
                    {
                      transform: [
                        {
                          translateX: Animated.multiply(shakeAnim, new Animated.Value(-1)),
                        },
                        { scale: scaleAnim },
                      ],
                      opacity: flashAnim,
                    },
                  ]}
                >
                  <Text style={styles.enemyBattleEmoji}>{enemy.emoji}</Text>
                  <Text style={styles.battleSideName} numberOfLines={2}>
                    {enemy.name}
                  </Text>
                </Animated.View>
              </View>

              <Text style={styles.battleFlavor}>
                {selectedAnimal.name.split(' ')[0]} challenges the {enemy.name}!
              </Text>

              <View style={styles.battleDots}>
                <Text style={styles.battleDotsText}>• • •</Text>
              </View>
            </View>
          )}

          {/* ── Phase: VICTORY ────────────────────────────────────────── */}
          {phase === 'victory' && (
            <View style={styles.phaseContainer}>
              <Text style={styles.victoryTitle}>🎉 You won!</Text>
              <Text style={styles.victorySubtitle}>
                The {enemy.name} ran away!
              </Text>

              {selectedAnimal && (
                <View style={styles.victoryHeroBox}>
                  <AnimalSprite
                    type={selectedAnimal.type}
                    size={90}
                    bodyColor={selectedAnimal.bodyColor}
                    accentColor={selectedAnimal.accentColor}
                  />
                  <Text style={styles.victoryHeroName}>{selectedAnimal.name}</Text>
                  <Text style={styles.victoryHeroLine}>saved the day!</Text>
                </View>
              )}

              {/* XP reward box */}
              <View style={styles.xpBox}>
                <Text style={styles.xpBaseText}>+{BASE_XP} bonus XP</Text>
                {homeTurfBonus && (
                  <Text style={styles.xpBonusText}>
                    🏡 Home turf bonus! +{HOME_TURF_BONUS}
                  </Text>
                )}
                <View style={styles.xpTotalRow}>
                  <Text style={styles.xpTotalLabel}>Total:</Text>
                  <Text style={styles.xpTotalValue}>+{totalXP} XP ⭐</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.keepGoingButton}
                onPress={handleVictory}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.keepGoingGradient}
                >
                  <Text style={styles.keepGoingText}>Keep Going! →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  gradientContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    minHeight: '70%',
    maxHeight: '90%',
  },

  phaseContainer: {
    flex: 1,
    alignItems: 'center',
  },

  // ── Enemy banner ──
  enemyBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
    width: '100%',
  },
  warningLabel: {
    fontSize: 14,
    color: '#FCD34D',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  enemyEmoji: {
    fontSize: 52,
    marginBottom: 4,
  },
  enemyName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  enemyFlavor: {
    fontSize: 15,
    color: '#E9D5FF',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── Pick companion ──
  pickLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FCD34D',
    marginBottom: 14,
    textAlign: 'center',
  },
  companionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  companionCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 10,
    width: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  companionCardHomeTurf: {
    borderColor: '#FCD34D',
    backgroundColor: 'rgba(252,211,77,0.18)',
  },
  companionName: {
    fontSize: 10,
    color: '#E9D5FF',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '600',
    lineHeight: 13,
  },
  homeTurfBadge: {
    backgroundColor: '#FCD34D',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 4,
  },
  homeTurfBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350F',
  },

  // ── Skip link / button ──
  skipLink: {
    marginTop: 14,
    paddingVertical: 8,
  },
  skipLinkText: {
    fontSize: 15,
    color: '#C4B5FD',
    textDecorationLine: 'underline',
  },
  skipButton: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  skipButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── No companions ──
  noCompanionsBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    gap: 12,
  },
  noCompanionsEmoji: {
    fontSize: 48,
  },
  noCompanionsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E9D5FF',
    textAlign: 'center',
    lineHeight: 28,
  },

  // ── Battle phase ──
  battleTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FCD34D',
    marginBottom: 24,
    letterSpacing: 2,
  },
  battleArena: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  battleSide: {
    alignItems: 'center',
    width: 100,
  },
  battleSideName: {
    fontSize: 11,
    color: '#E9D5FF',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '700',
    lineHeight: 14,
  },
  enemyBattleEmoji: {
    fontSize: 72,
    lineHeight: 80,
  },
  vsBadge: {
    backgroundColor: '#FF4081',
    borderRadius: 40,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4081',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  vsText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  battleFlavor: {
    fontSize: 16,
    color: '#C4B5FD',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  battleDots: {
    marginTop: 20,
  },
  battleDotsText: {
    fontSize: 28,
    color: '#FCD34D',
    letterSpacing: 8,
  },

  // ── Victory phase ──
  victoryTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FCD34D',
    marginBottom: 6,
    textAlign: 'center',
  },
  victorySubtitle: {
    fontSize: 17,
    color: '#E9D5FF',
    marginBottom: 20,
    textAlign: 'center',
  },
  victoryHeroBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    width: '100%',
  },
  victoryHeroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  victoryHeroLine: {
    fontSize: 14,
    color: '#C4B5FD',
    fontStyle: 'italic',
  },
  xpBox: {
    backgroundColor: 'rgba(252,211,77,0.15)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FCD34D',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    gap: 4,
  },
  xpBaseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FCD34D',
  },
  xpBonusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#86EFAC',
  },
  xpTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252,211,77,0.4)',
    paddingTop: 8,
  },
  xpTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E9D5FF',
  },
  xpTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FCD34D',
  },
  keepGoingButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  keepGoingGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  keepGoingText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1917',
    letterSpacing: 1,
  },
});
