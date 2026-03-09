/**
 * BattleModal — Pokémon-style battle mini-game.
 *
 * Flow:
 *   choose  → player picks a companion from their roster
 *   fight   → turn-based: player picks a move each round, enemy auto-acts
 *   victory → XP reward screen
 *
 * Always ends in player victory (kids game — enemy HP depletes faster
 * and player moves always land).
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { getAnimalById, Animal } from '../game/animals';

// ── Move definitions ──────────────────────────────────────────────────────────

interface Move {
  name: string;
  emoji: string;
  damage: number;       // % of enemy max HP
  flavor: string;       // battle message
  sfxColor: string;     // flash tint
}

type MoveSet = [Move, Move, Move];

/** Default movesets by animal type — falls back to GENERIC_MOVES */
const ANIMAL_MOVES: Partial<Record<string, MoveSet>> = {
  squirrel:  [
    { name: 'Acorn Toss',    emoji: '🌰', damage: 30, flavor: 'pelts them with acorns!', sfxColor: '#C8A96E' },
    { name: 'Chitter Scare', emoji: '😤', damage: 25, flavor: 'chitters VERY loudly!',   sfxColor: '#F9A825' },
    { name: 'Tail Fluff',    emoji: '🌀', damage: 20, flavor: 'blinds them with fluff!', sfxColor: '#D4A464' },
  ],
  pigeon:    [
    { name: 'Coo Blast',     emoji: '💨', damage: 25, flavor: 'coos at maximum volume!', sfxColor: '#9E9E9E' },
    { name: 'Wing Flap',     emoji: '🪶', damage: 30, flavor: 'flaps furiously!',         sfxColor: '#7B68EE' },
    { name: 'Pretend GPS',   emoji: '🧭', damage: 20, flavor: 'confuses their sense of direction!', sfxColor: '#B0BEC5' },
  ],
  dog:       [
    { name: 'Mega Bark',     emoji: '🔊', damage: 35, flavor: 'barks SO LOUDLY!',         sfxColor: '#F5DEB3' },
    { name: 'Fetch Launch',  emoji: '🎾', damage: 25, flavor: 'launches a tennis ball!',  sfxColor: '#8BC34A' },
    { name: 'Zoomies',       emoji: '💨', damage: 25, flavor: 'runs circles around them!', sfxColor: '#C8A96E' },
  ],
  cat:       [
    { name: 'Slow Blink',    emoji: '😌', damage: 20, flavor: 'judges them silently...',  sfxColor: '#E8D5B7' },
    { name: 'Paw Swipe',     emoji: '🐾', damage: 35, flavor: 'delivers a precise swipe!', sfxColor: '#B8860B' },
    { name: 'Hairball',      emoji: '🤢', damage: 30, flavor: 'launches a hairball!',      sfxColor: '#8BC34A' },
  ],
  raccoon:   [
    { name: 'Trash Lid',     emoji: '🗑️', damage: 30, flavor: 'bonks them with a lid!',  sfxColor: '#696969' },
    { name: 'Sneaky Dodge',  emoji: '🌀', damage: 25, flavor: 'sneaks behind them!',      sfxColor: '#2C2C2C' },
    { name: 'Pizza Distract',emoji: '🍕', damage: 30, flavor: 'distracts with pizza!',    sfxColor: '#FF7043' },
  ],
  rabbit:    [
    { name: 'Speed Hop',     emoji: '💨', damage: 30, flavor: 'hops at blinding speed!',  sfxColor: '#FFB6C1' },
    { name: 'Nose Twitch',   emoji: '👃', damage: 25, flavor: 'detects their weakness!',  sfxColor: '#E8D5B7' },
    { name: 'Lucky Clover',  emoji: '🍀', damage: 30, flavor: 'brings lucky energy!',     sfxColor: '#4CAF50' },
  ],
  turtle:    [
    { name: 'Shell Slam',    emoji: '🐚', damage: 35, flavor: 'spins their shell hard!',  sfxColor: '#4CAF50' },
    { name: 'Ancient Stare', emoji: '👁️', damage: 20, flavor: 'stares. For a long time.', sfxColor: '#2E7D32' },
    { name: 'Tide Surge',    emoji: '🌊', damage: 30, flavor: 'summons a wave!',           sfxColor: '#0288D1' },
  ],
  hawk:      [
    { name: 'Talon Strike',  emoji: '⚡', damage: 40, flavor: 'dives at 200 mph!',        sfxColor: '#CD853F' },
    { name: 'SCREEE!',       emoji: '📢', damage: 25, flavor: 'unleashes an ear-splitting screech!', sfxColor: '#FF7043' },
    { name: 'Sky Drop',      emoji: '🌪️', damage: 30, flavor: 'drops from impossible height!', sfxColor: '#8B4513' },
  ],
  seagull:   [
    { name: 'Snack Steal',   emoji: '😤', damage: 30, flavor: 'steals their lunch!',      sfxColor: '#F5F5F5' },
    { name: 'SQUAWK',        emoji: '📢', damage: 25, flavor: 'squawks non-stop!',         sfxColor: '#E0E0E0' },
    { name: 'Rain Dance',    emoji: '💃', damage: 25, flavor: 'does a confusing rain dance!', sfxColor: '#0288D1' },
  ],
  dolphin:   [
    { name: 'Echo Blast',    emoji: '🔊', damage: 35, flavor: 'fires a sonic pulse!',     sfxColor: '#5B9BD5' },
    { name: 'Wave Leap',     emoji: '🌊', damage: 25, flavor: 'leaps over them!',          sfxColor: '#BDD7EE' },
    { name: 'Click Click',   emoji: '🎵', damage: 25, flavor: 'calls in the whole pod!',   sfxColor: '#1976D2' },
  ],
  fox:       [
    { name: 'Snow Pounce',   emoji: '❄️', damage: 35, flavor: 'pounces using Earth\'s field!', sfxColor: '#E07B39' },
    { name: 'Forest Ghost',  emoji: '👻', damage: 25, flavor: 'vanishes into the trees!',  sfxColor: '#FFFFFF' },
    { name: 'Berry Trick',   emoji: '🫐', damage: 25, flavor: 'lures them with berries!',  sfxColor: '#7B1FA2' },
  ],
  bear:      [
    { name: 'Bear Hug',      emoji: '🤗', damage: 40, flavor: 'gives an overwhelming hug!', sfxColor: '#2C2C2C' },
    { name: 'ROAR',          emoji: '😤', damage: 30, flavor: 'lets out an earth-shaking roar!', sfxColor: '#5C4033' },
    { name: 'Berry Swipe',   emoji: '🫐', damage: 20, flavor: 'swipes with a berry-scented paw!', sfxColor: '#8B0000' },
  ],
  owl:       [
    { name: 'Head Spin',     emoji: '🌀', damage: 30, flavor: 'rotates head 270° at them!', sfxColor: '#8B7355' },
    { name: 'Who Cooks?',    emoji: '🍳', damage: 25, flavor: 'asks an unanswerable question!', sfxColor: '#D2B48C' },
    { name: 'Silent Strike', emoji: '🤫', damage: 35, flavor: 'attacks without a sound!',   sfxColor: '#607D8B' },
  ],
  wolf:      [
    { name: 'Pack Howl',     emoji: '🌕', damage: 40, flavor: 'calls the whole pack!',     sfxColor: '#6B6B6B' },
    { name: 'Alpha Gaze',    emoji: '👁️', damage: 25, flavor: 'stares with total authority!', sfxColor: '#D4D4D4' },
    { name: 'Forest Sprint', emoji: '💨', damage: 25, flavor: 'charges at full speed!',     sfxColor: '#9E9E9E' },
  ],
  moose:     [
    { name: 'Antler Charge', emoji: '🫎', damage: 40, flavor: 'charges with massive antlers!', sfxColor: '#5C4033' },
    { name: 'Swim Surge',    emoji: '🌊', damage: 30, flavor: 'dives underwater to outflank!', sfxColor: '#4FC3F7' },
    { name: 'Honk',          emoji: '📯', damage: 20, flavor: 'honks with surprising dignity!', sfxColor: '#3E2723' },
  ],
  whale:     [
    { name: 'Song Blast',    emoji: '🎵', damage: 40, flavor: 'sings a 20-minute opus!',   sfxColor: '#2B4580' },
    { name: 'Breach!',       emoji: '💦', damage: 35, flavor: 'launches 40 tons into the air!', sfxColor: '#FFFFFF' },
    { name: 'Deep Dive',     emoji: '🌊', damage: 20, flavor: 'creates a massive wave!',   sfxColor: '#1976D2' },
  ],
  eagle:     [
    { name: 'Talons Down',   emoji: '⚡', damage: 40, flavor: 'dives from 1 mile up!',     sfxColor: '#FFFFFF' },
    { name: 'Screech',       emoji: '📢', damage: 25, flavor: 'screams symbol of freedom!', sfxColor: '#FF7043' },
    { name: 'Eyrie Drop',    emoji: '🪵', damage: 30, flavor: 'drops a 2,000-lb nest stick!', sfxColor: '#3D2B00' },
  ],
  falcon:    [
    { name: '240 mph Dive',  emoji: '💨', damage: 45, flavor: 'dives at 240 miles per hour!', sfxColor: '#546E7A' },
    { name: 'Beak Notch',    emoji: '✂️', damage: 30, flavor: 'uses their notched beak!',  sfxColor: '#FFE082' },
    { name: 'City Spiral',   emoji: '🏙️', damage: 20, flavor: 'spirals off a skyscraper!',  sfxColor: '#90A4AE' },
  ],
  jaguar:    [
    { name: 'Shadow Pounce', emoji: '🌑', damage: 45, flavor: 'pounces from the shadows!', sfxColor: '#D4A017' },
    { name: 'Skull Crunch',  emoji: '💀', damage: 35, flavor: 'uses their legendary bite!', sfxColor: '#2C1810' },
    { name: 'River Swim',    emoji: '🌊', damage: 15, flavor: 'ambushes from the water!',  sfxColor: '#1976D2' },
  ],
  pangolin:  [
    { name: 'Curl & Roll',   emoji: '🔄', damage: 35, flavor: 'rolls right into them!',    sfxColor: '#8D6E63' },
    { name: 'Tongue Lash',   emoji: '👅', damage: 30, flavor: 'extends a body-length tongue!', sfxColor: '#BCAAA4' },
    { name: 'Scale Shield',  emoji: '🛡️', damage: 20, flavor: 'deflects the attack!',       sfxColor: '#795548' },
  ],
  chinesedolphin: [
    { name: 'Pink Splash',   emoji: '💗', damage: 35, flavor: 'dazzles with their pink color!', sfxColor: '#FFB6C1' },
    { name: 'Harbour Echo',  emoji: '🔊', damage: 30, flavor: 'bounces sonar off the harbour!', sfxColor: '#FF69B4' },
    { name: 'Pod Call',      emoji: '🎵', damage: 25, flavor: 'calls for backup!',           sfxColor: '#E91E63' },
  ],
  seaturtle: [
    { name: 'Ancient Swim',  emoji: '🌊', damage: 30, flavor: 'swims with 200 million years of knowledge!', sfxColor: '#2E7D32' },
    { name: 'Shell Spin',    emoji: '🌀', damage: 35, flavor: 'spins shell like a top!',    sfxColor: '#A5D6A7' },
    { name: 'Nest Charge',   emoji: '🏖️', damage: 25, flavor: 'protects their nesting beach!', sfxColor: '#F9A825' },
  ],
};

const GENERIC_MOVES: MoveSet = [
  { name: 'Tackle',    emoji: '💥', damage: 30, flavor: 'tackles head-on!',       sfxColor: '#FCD34D' },
  { name: 'Growl',     emoji: '😤', damage: 25, flavor: 'growls fiercely!',        sfxColor: '#FF7043' },
  { name: 'Quick Move',emoji: '💨', damage: 25, flavor: 'strikes with speed!',     sfxColor: '#B3E5FC' },
];

function getMovesFor(animalId: string): MoveSet {
  return ANIMAL_MOVES[animalId] ?? GENERIC_MOVES;
}

// ── Enemy data ─────────────────────────────────────────────────────────────────

interface EnemyInfo {
  name: string;
  emoji: string;
  flavor: string;
  /** Things the enemy "says" when it attacks */
  taunts: string[];
}

const LOCATION_ENEMIES: Record<string, EnemyInfo> = {
  'prospect-park':    { name: 'Grumpy Goose',     emoji: '🪿', flavor: 'blocking the park gate!',       taunts: ['HONK!', 'This park is MINE!', 'HONK HONK HONK!'] },
  'brooklyn-heights': { name: 'Bossy Pigeon',      emoji: '🐦', flavor: 'sitting on your head!',         taunts: ['Coo coo! Bow down!', 'I own these streets!', 'Coo!'] },
  'central-park':     { name: 'Sneaky Squirrel',   emoji: '🐿️', flavor: 'stole your snack!',             taunts: ['Mine! All mine!', 'You\'ll never catch me!', 'Chitter!'] },
  'rockaway-beach':   { name: 'Crabby Crab',       emoji: '🦀', flavor: 'pinching your toes!',           taunts: ['SNAP SNAP!', 'This beach is crab territory!', 'Pinchy!'] },
  'staten-island':    { name: 'Grouchy Groundhog', emoji: '🦫', flavor: 'blocking the trail!',           taunts: ['I see your shadow!', 'Go away!', 'SIX MORE WEEKS of this!'] },
  'hudson-valley':    { name: 'Rowdy Raccoon',     emoji: '🦝', flavor: 'raided your backpack!',         taunts: ['Your snacks are mine now!', '*rummages loudly*', 'Score!'] },
  'catskills':        { name: 'Grumbly Bear',      emoji: '🐻', flavor: 'needs a nap but blocking the path!', taunts: ['ZZZ... wha?!', 'You woke me UP?!', 'Grumble grumble...'] },
  'adirondacks':      { name: 'Angry Moose',       emoji: '🫎', flavor: 'not letting you pass!',         taunts: ['HONK!', 'Admire my antlers!', 'These are MY mountains!'] },
  'cape-cod':         { name: 'Pushy Pelican',     emoji: '🦢', flavor: 'wants all your fish!',          taunts: ['MINE!', 'Give me the fish!', 'SPLASH!'] },
  'acadia':           { name: 'Stinky Skunk',      emoji: '🦨', flavor: 'blocking the trail!',           taunts: ['Don\'t come closer!', '*does handstand warning*', 'I\'m serious!'] },
  'cancun':           { name: 'Grumpy Iguana',     emoji: '🦎', flavor: 'blocking the jungle path!',     taunts: ['This is MY rock!', '*bobs head aggressively*', 'Shoo!'] },
  'black-forest':     { name: 'Bossy Magpie',      emoji: '🐦', flavor: 'stolen your shiny things!',    taunts: ['Mine is shinier!', 'KRRACK!', 'I have 200 shiny things!'] },
  'hong-kong':        { name: 'Cheeky Monkey',     emoji: '🐒', flavor: 'taken your snacks!',            taunts: ['EEK EEK!', 'Faster than you!', 'Monkey Mountain rules!'] },
};

const DEFAULT_ENEMY: EnemyInfo = {
  name: 'Mysterious Critter', emoji: '❓', flavor: 'blocking your way!',
  taunts: ['???', 'Mysterious noise!', 'You\'ll never defeat me!'],
};

// ── HP constants ──────────────────────────────────────────────────────────────

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP  = 80;   // enemy has less HP — player always wins
const ENEMY_DAMAGE  = 8;    // enemy deals very little damage

const BASE_XP = 25;
const HOME_TURF_BONUS = 15;

// ── Types ─────────────────────────────────────────────────────────────────────

type BattlePhase = 'choose' | 'fight' | 'victory';

interface LogEntry {
  text: string;
  color: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BattleModalProps {
  visible: boolean;
  locationId: string;
  locationName: string;
  companionAnimals: string[];
  onVictory: (bonusXP: number) => void;
  onSkip: () => void;
}

export function BattleModal({
  visible,
  locationId,
  companionAnimals,
  onVictory,
  onSkip,
}: BattleModalProps) {
  const [phase, setPhase] = useState<BattlePhase>('choose');
  const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(null);
  const [playerHP, setPlayerHP] = useState(PLAYER_MAX_HP);
  const [enemyHP, setEnemyHP] = useState(ENEMY_MAX_HP);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [homeTurfBonus, setHomeTurfBonus] = useState(false);
  const [lastMoveEmoji, setLastMoveEmoji] = useState('');

  // Animations
  const playerShake = useRef(new Animated.Value(0)).current;
  const enemyShake  = useRef(new Animated.Value(0)).current;
  const flashAnim   = useRef(new Animated.Value(1)).current;
  const movePopAnim = useRef(new Animated.Value(0)).current;

  const enemy = LOCATION_ENEMIES[locationId] ?? DEFAULT_ENEMY;

  // Reset state every time modal opens
  useEffect(() => {
    if (visible) {
      setPhase('choose');
      setSelectedCompanionId(null);
      setPlayerHP(PLAYER_MAX_HP);
      setEnemyHP(ENEMY_MAX_HP);
      setLog([]);
      setBusy(false);
      setHomeTurfBonus(false);
      setLastMoveEmoji('');
      playerShake.setValue(0);
      enemyShake.setValue(0);
      flashAnim.setValue(1);
      movePopAnim.setValue(0);
    }
  }, [visible]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function shakeTarget(anim: Animated.Value) {
    Animated.sequence([
      Animated.timing(anim, { toValue: 14, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -14, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function flashEnemy() {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.15, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0.15, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }

  function popMoveEmoji() {
    movePopAnim.setValue(0);
    Animated.spring(movePopAnim, {
      toValue: 1, useNativeDriver: true, damping: 7, stiffness: 250,
    }).start();
  }

  function addLog(text: string, color = '#E9D5FF') {
    setLog((prev) => [...prev.slice(-4), { text, color }]);
  }

  // ── Game logic ─────────────────────────────────────────────────────────────

  function handlePickCompanion(animalId: string) {
    const animal = getAnimalById(animalId);
    const isHomeTurf = animal?.locationIds.includes(locationId) ?? false;
    setSelectedCompanionId(animalId);
    setHomeTurfBonus(isHomeTurf);
    setPhase('fight');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addLog(`${animal?.name.split(' ')[0] ?? 'Your friend'} steps forward! 🌟`, '#FCD34D');
    if (isHomeTurf) addLog('🏡 Home turf bonus! +15 XP if you win!', '#86EFAC');
  }

  const handleMove = useCallback((move: Move) => {
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setLastMoveEmoji(move.emoji);
    popMoveEmoji();

    // Player attacks
    const companion = selectedCompanionId ? getAnimalById(selectedCompanionId) : null;
    const firstName = companion?.name.split(' ')[0] ?? 'Your friend';
    const dmg = move.damage;
    const newEnemyHP = Math.max(0, enemyHP - dmg);

    setEnemyHP(newEnemyHP);
    shakeTarget(enemyShake);
    flashEnemy();
    addLog(`${firstName} used ${move.name}! ${move.emoji} ${move.flavor}`, '#FCD34D');

    if (newEnemyHP <= 0) {
      // Victory!
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('victory');
        setBusy(false);
      }, 900);
      return;
    }

    // Enemy counter-attacks after a delay
    setTimeout(() => {
      const taunt = enemy.taunts[Math.floor(Math.random() * enemy.taunts.length)];
      const newPlayerHP = Math.max(0, playerHP - ENEMY_DAMAGE);
      setPlayerHP(newPlayerHP);
      shakeTarget(playerShake);
      addLog(`${enemy.name}: "${taunt}" (-${ENEMY_DAMAGE} HP)`, '#FCA5A5');

      setTimeout(() => setBusy(false), 300);
    }, 700);
  }, [busy, enemyHP, playerHP, selectedCompanionId, enemy, playerShake, enemyShake, flashAnim, movePopAnim]);

  function handleVictory() {
    onVictory(BASE_XP + (homeTurfBonus ? HOME_TURF_BONUS : 0));
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const selectedAnimal = selectedCompanionId ? getAnimalById(selectedCompanionId) : null;
  const moves = selectedCompanionId ? getMovesFor(selectedCompanionId) : GENERIC_MOVES;
  const totalXP = BASE_XP + (homeTurfBonus ? HOME_TURF_BONUS : 0);
  const playerHPPct = (playerHP / PLAYER_MAX_HP) * 100;
  const enemyHPPct  = (enemyHP  / ENEMY_MAX_HP)  * 100;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1a0533', '#3b0764', '#6b21a8']}
          style={styles.gradientContainer}
        >

          {/* ── CHOOSE phase ───────────────────────────────────────── */}
          {phase === 'choose' && (
            <View style={styles.phaseContainer}>
              <View style={styles.enemyBanner}>
                <Text style={styles.warningLabel}>⚠️ OH NO!</Text>
                <Text style={styles.enemyEmoji}>{enemy.emoji}</Text>
                <Text style={styles.enemyName}>{enemy.name}</Text>
                <Text style={styles.enemyFlavor}>is {enemy.flavor}</Text>
              </View>

              {companionAnimals.length === 0 ? (
                <View style={styles.noCompanionsBox}>
                  <Text style={styles.noCompanionsEmoji}>🐾</Text>
                  <Text style={styles.noCompanionsText}>Go make some animal friends first!</Text>
                  <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                    <Text style={styles.skipButtonText}>Skip Battle →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.pickLabel}>Choose your fighter!</Text>
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
                          style={[styles.companionCard, isHomeTurf && styles.companionCardHomeTurf]}
                          onPress={() => handlePickCompanion(animalId)}
                          activeOpacity={0.8}
                        >
                          <AnimalSprite
                            type={animal.type} size={60}
                            bodyColor={animal.bodyColor} accentColor={animal.accentColor}
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

          {/* ── FIGHT phase ────────────────────────────────────────── */}
          {phase === 'fight' && selectedAnimal && (
            <View style={styles.phaseContainer}>
              {/* Arena */}
              <View style={styles.arena}>
                {/* Player side */}
                <View style={styles.arenaSide}>
                  <Animated.View style={{ transform: [{ translateX: playerShake }] }}>
                    <AnimalSprite
                      type={selectedAnimal.type} size={72}
                      bodyColor={selectedAnimal.bodyColor} accentColor={selectedAnimal.accentColor}
                    />
                  </Animated.View>
                  <Text style={styles.arenaSideName} numberOfLines={1}>
                    {selectedAnimal.name.split(' ')[0]}
                  </Text>
                  {/* Player HP bar */}
                  <View style={styles.hpBarTrack}>
                    <View style={[styles.hpBarFill, { width: `${playerHPPct}%` as any, backgroundColor: hpColor(playerHPPct) }]} />
                  </View>
                  <Text style={styles.hpLabel}>{playerHP} HP</Text>
                </View>

                {/* VS / move pop */}
                <View style={styles.vsColumn}>
                  <View style={styles.vsBadge}><Text style={styles.vsText}>VS</Text></View>
                  {lastMoveEmoji ? (
                    <Animated.Text style={[styles.movePopEmoji, {
                      transform: [{ scale: movePopAnim }],
                      opacity: movePopAnim,
                    }]}>
                      {lastMoveEmoji}
                    </Animated.Text>
                  ) : null}
                </View>

                {/* Enemy side */}
                <View style={styles.arenaSide}>
                  <Animated.View style={{ transform: [{ translateX: enemyShake }], opacity: flashAnim }}>
                    <Text style={styles.enemyBigEmoji}>{enemy.emoji}</Text>
                  </Animated.View>
                  <Text style={styles.arenaSideName} numberOfLines={1}>{enemy.name}</Text>
                  {/* Enemy HP bar */}
                  <View style={styles.hpBarTrack}>
                    <View style={[styles.hpBarFill, { width: `${enemyHPPct}%` as any, backgroundColor: hpColor(enemyHPPct) }]} />
                  </View>
                  <Text style={styles.hpLabel}>{enemyHP} HP</Text>
                </View>
              </View>

              {/* Battle log */}
              <View style={styles.logBox}>
                {log.slice(-3).map((entry, i) => (
                  <Text key={i} style={[styles.logLine, { color: entry.color }]} numberOfLines={2}>
                    {entry.text}
                  </Text>
                ))}
              </View>

              {/* Move buttons */}
              <Text style={styles.pickMoveLabel}>
                {busy ? 'Wait for it…' : 'Choose a move!'}
              </Text>
              <View style={styles.movesRow}>
                {moves.map((move) => (
                  <TouchableOpacity
                    key={move.name}
                    style={[styles.moveButton, busy && styles.moveButtonDisabled]}
                    onPress={() => handleMove(move)}
                    activeOpacity={0.75}
                    disabled={busy}
                  >
                    <Text style={styles.moveEmoji}>{move.emoji}</Text>
                    <Text style={styles.moveName}>{move.name}</Text>
                    <Text style={styles.moveDmg}>-{move.damage}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={onSkip} style={styles.skipLink}>
                <Text style={styles.skipLinkText}>Flee battle</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── VICTORY phase ───────────────────────────────────────── */}
          {phase === 'victory' && (
            <View style={styles.phaseContainer}>
              <Text style={styles.victoryTitle}>🎉 Victory!</Text>
              <Text style={styles.victorySubtitle}>The {enemy.name} ran away!</Text>

              {selectedAnimal && (
                <View style={styles.victoryHeroBox}>
                  <AnimalSprite
                    type={selectedAnimal.type} size={90}
                    bodyColor={selectedAnimal.bodyColor} accentColor={selectedAnimal.accentColor}
                  />
                  <Text style={styles.victoryHeroName}>{selectedAnimal.name}</Text>
                  <Text style={styles.victoryHeroLine}>saved the day!</Text>
                </View>
              )}

              <View style={styles.xpBox}>
                <Text style={styles.xpBaseText}>+{BASE_XP} battle XP</Text>
                {homeTurfBonus && (
                  <Text style={styles.xpBonusText}>🏡 Home turf bonus! +{HOME_TURF_BONUS}</Text>
                )}
                <View style={styles.xpTotalRow}>
                  <Text style={styles.xpTotalLabel}>Total:</Text>
                  <Text style={styles.xpTotalValue}>+{totalXP} XP ⭐</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.keepGoingButton} onPress={handleVictory} activeOpacity={0.85}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.keepGoingGradient}>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function hpColor(pct: number): string {
  if (pct > 60) return '#4CAF50';
  if (pct > 30) return '#FFC107';
  return '#F44336';
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
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 18,
    minHeight: '75%',
    maxHeight: '93%',
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
  },
  warningLabel: { fontSize: 13, color: '#FCD34D', fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  enemyEmoji:   { fontSize: 48, marginBottom: 4 },
  enemyName:    { fontSize: 22, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  enemyFlavor:  { fontSize: 14, color: '#E9D5FF', marginTop: 4, textAlign: 'center', fontStyle: 'italic' },

  // ── Choose phase ──
  pickLabel: { fontSize: 19, fontWeight: '800', color: '#FCD34D', marginBottom: 12, textAlign: 'center' },
  companionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingBottom: 8 },
  companionCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 8,
    width: 88,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  companionCardHomeTurf: { borderColor: '#FCD34D', backgroundColor: 'rgba(252,211,77,0.18)' },
  companionName: { fontSize: 10, color: '#E9D5FF', textAlign: 'center', marginTop: 4, fontWeight: '600', lineHeight: 13 },
  homeTurfBadge: { backgroundColor: '#FCD34D', borderRadius: 7, paddingHorizontal: 5, paddingVertical: 2, marginTop: 3 },
  homeTurfBadgeText: { fontSize: 9, fontWeight: '800', color: '#78350F' },

  // ── No companions ──
  noCompanionsBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%', gap: 10 },
  noCompanionsEmoji: { fontSize: 44 },
  noCompanionsText: { fontSize: 18, fontWeight: '700', color: '#E9D5FF', textAlign: 'center', lineHeight: 26 },

  // ── Skip ──
  skipLink: { marginTop: 10, paddingVertical: 8 },
  skipLinkText: { fontSize: 14, color: '#C4B5FD', textDecorationLine: 'underline' },
  skipButton: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 26 },
  skipButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // ── Arena ──
  arena: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  arenaSide: { alignItems: 'center', width: 105 },
  arenaSideName: { fontSize: 11, color: '#E9D5FF', fontWeight: '700', marginTop: 4, textAlign: 'center' },
  hpBarTrack: { width: 90, height: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, marginTop: 6, overflow: 'hidden' },
  hpBarFill: { height: '100%', borderRadius: 5 },
  hpLabel: { fontSize: 11, color: '#C4B5FD', marginTop: 2, fontWeight: '700' },
  enemyBigEmoji: { fontSize: 68, lineHeight: 76 },
  vsColumn: { alignItems: 'center', gap: 8, paddingBottom: 16 },
  vsBadge: {
    backgroundColor: '#FF4081', borderRadius: 38,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF4081', shadowOpacity: 0.8, shadowRadius: 8, elevation: 6,
  },
  vsText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  movePopEmoji: { fontSize: 36, marginTop: 4 },

  // ── Battle log ──
  logBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 66,
    marginBottom: 10,
  },
  logLine: { fontSize: 12, lineHeight: 18, fontWeight: '600' },

  // ── Moves ──
  pickMoveLabel: { fontSize: 14, fontWeight: '800', color: '#FCD34D', marginBottom: 8 },
  movesRow: { flexDirection: 'row', gap: 8, width: '100%' },
  moveButton: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  moveButtonDisabled: { opacity: 0.45 },
  moveEmoji: { fontSize: 24 },
  moveName:  { fontSize: 10, color: '#FFFFFF', fontWeight: '800', marginTop: 2, textAlign: 'center' },
  moveDmg:   { fontSize: 11, color: '#FCA5A5', fontWeight: '700', marginTop: 2 },

  // ── Victory ──
  victoryTitle:    { fontSize: 40, fontWeight: '900', color: '#FCD34D', marginBottom: 6, textAlign: 'center' },
  victorySubtitle: { fontSize: 16, color: '#E9D5FF', marginBottom: 16, textAlign: 'center' },
  victoryHeroBox: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22, padding: 16, marginBottom: 16, width: '100%',
  },
  victoryHeroName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  victoryHeroLine: { fontSize: 13, color: '#C4B5FD', fontStyle: 'italic' },
  xpBox: {
    backgroundColor: 'rgba(252,211,77,0.15)', borderRadius: 16,
    borderWidth: 2, borderColor: '#FCD34D',
    paddingVertical: 12, paddingHorizontal: 22,
    alignItems: 'center', width: '100%', marginBottom: 20, gap: 4,
  },
  xpBaseText:  { fontSize: 17, fontWeight: '700', color: '#FCD34D' },
  xpBonusText: { fontSize: 14, fontWeight: '600', color: '#86EFAC' },
  xpTotalRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(252,211,77,0.4)', paddingTop: 6 },
  xpTotalLabel: { fontSize: 15, fontWeight: '700', color: '#E9D5FF' },
  xpTotalValue: { fontSize: 21, fontWeight: '900', color: '#FCD34D' },
  keepGoingButton: {
    width: '100%', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#D97706', shadowOpacity: 0.6, shadowRadius: 10, elevation: 8,
  },
  keepGoingGradient: { paddingVertical: 16, alignItems: 'center' },
  keepGoingText: { fontSize: 21, fontWeight: '900', color: '#1C1917', letterSpacing: 1 },
});
