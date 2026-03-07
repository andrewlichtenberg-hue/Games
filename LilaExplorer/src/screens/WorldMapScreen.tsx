import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C } from '../utils/colors';
import { LOCATIONS, Location } from '../game/locations';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../audio/audioManager';
import type { RootStackParamList } from '../../App';

// ── Layout math ──────────────────────────────────────────────────────────────
// Card grid fills the screen exactly — no scroll needed on iPad.

const { width, height } = Dimensions.get('window');
const IS_IPAD = width >= 768;
const NUM_COLS = IS_IPAD ? 3 : 2;
const NUM_ROWS = Math.ceil(LOCATIONS.length / NUM_COLS); // 4 rows on iPad, 5 on phone
const HEADER_H = IS_IPAD ? 100 : 120; // compact on iPad
const GRID_PAD = IS_IPAD ? 16 : 12;
const CARD_GAP = IS_IPAD ? 14 : 10;
const CARD_W = (width - GRID_PAD * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;
const CARD_H = Math.floor(
  (height - HEADER_H - GRID_PAD * 2 - CARD_GAP * (NUM_ROWS - 1)) / NUM_ROWS
);

// Scene emoji per type
const SCENE_EMOJI: Record<string, string> = {
  park:     '🌳',
  beach:    '🏖️',
  forest:   '🌲',
  mountain: '⛰️',
  city:     '🏙️',
};

type Props = { navigation: StackNavigationProp<RootStackParamList, 'WorldMap'> };

// ── Individual location card ──────────────────────────────────────────────────

function LocationCard({
  location,
  unlocked,
  visited,
  animalFoundCount,
  onPress,
}: {
  location: Location;
  unlocked: boolean;
  visited: boolean;
  animalFoundCount: number;
  onPress: () => void;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isNew = unlocked && !visited;

  React.useEffect(() => {
    if (isNew) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isNew]);

  const emoji = SCENE_EMOJI[location.sceneType] ?? '🌍';
  const totalAnimals = location.animalIds.length;
  const emojiSize = IS_IPAD ? 56 : 40;

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        { width: CARD_W, height: CARD_H },
        { transform: [{ scale: pulseAnim }] },
        !unlocked && styles.cardWrapLocked,
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (unlocked) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }}
        activeOpacity={unlocked ? 0.8 : 0.97}
      >
        {/* Sky — top 60% */}
        <LinearGradient
          colors={[location.skyTop, location.skyBottom]}
          style={styles.cardSky}
        >
          <Text style={[styles.cardEmoji, { fontSize: emojiSize }]}>{emoji}</Text>

          {/* Visited tick */}
          {visited && (
            <View style={styles.visitedBadge}>
              <Text style={styles.visitedText}>✓</Text>
            </View>
          )}
          {/* "New!" sparkle */}
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newText}>✨</Text>
            </View>
          )}
        </LinearGradient>

        {/* Ground — bottom 40% */}
        <View style={[styles.cardGround, { backgroundColor: location.groundColor }]}>
          <Text style={styles.cardName} numberOfLines={1}>{location.name}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>{location.subtitle}</Text>
          <View style={styles.animalRow}>
            <Text style={styles.animalCount}>
              {animalFoundCount > 0
                ? `${animalFoundCount}/${totalAnimals} animals`
                : `${totalAnimals} animals`}
            </Text>
            {/* Small paw dots per animal discovered */}
            <View style={styles.pawDots}>
              {location.animalIds.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pawDot,
                    { backgroundColor: i < animalFoundCount ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)' },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Lock overlay for locked locations */}
        {!unlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={styles.lockLevel}>Level {location.unlockLevel}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function WorldMapScreen({ navigation }: Props) {
  const { unlockedLocations, visitedLocations, discoveredAnimals, level } = useGameStore();

  useFocusEffect(
    React.useCallback(() => {
      audioManager.playMusic('theme');
    }, [])
  );

  // Chunk into rows of NUM_COLS
  const rows: Location[][] = [];
  for (let i = 0; i < LOCATIONS.length; i += NUM_COLS) {
    rows.push(LOCATIONS.slice(i, i + NUM_COLS));
  }

  return (
    <LinearGradient colors={['#E8F5E9', '#E3F2FD']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Where do you want to explore? 🗺️</Text>
      </View>

      {/* Card grid */}
      <View style={[styles.grid, { padding: GRID_PAD, gap: CARD_GAP }]}>
        {rows.map((row, r) => (
          <View key={r} style={[styles.row, { gap: CARD_GAP }]}>
            {row.map((loc) => {
              const unlocked = unlockedLocations.includes(loc.id);
              const visited = visitedLocations.includes(loc.id);
              const found = loc.animalIds.filter((id) => discoveredAnimals.includes(id)).length;
              return (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  unlocked={unlocked}
                  visited={visited}
                  animalFoundCount={found}
                  onPress={() => navigation.navigate('Exploration', { locationId: loc.id })}
                />
              );
            })}
            {/* Fill last row if incomplete */}
            {row.length < NUM_COLS &&
              Array(NUM_COLS - row.length).fill(0).map((_, i) => (
                <View key={`spacer-${i}`} style={{ width: CARD_W, height: CARD_H }} />
              ))}
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: IS_IPAD ? 48 : 52,
    paddingBottom: IS_IPAD ? 12 : 10,
    paddingHorizontal: GRID_PAD,
    height: HEADER_H,
    justifyContent: 'flex-end',
  },
  backBtn: { position: 'absolute', top: IS_IPAD ? 54 : 58, left: GRID_PAD },
  backText: { fontSize: 15, fontWeight: '700', color: C.TEXT_MID },
  title: {
    fontSize: IS_IPAD ? 22 : 18,
    fontWeight: '900',
    color: C.TEXT_DARK,
    marginBottom: 4,
  },

  grid: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },

  // Card shell
  cardWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardWrapLocked: {
    shadowOpacity: 0.05,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 22,
  },

  // Top sky section
  cardSky: {
    flex: 3,  // 60% of card height
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardEmoji: {
    // fontSize set dynamically
  },

  // Visited / New badges (top-right corner of sky)
  visitedBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitedText: { fontSize: 14, fontWeight: '900', color: '#27AE60' },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newText: { fontSize: 16 },

  // Bottom ground section
  cardGround: {
    flex: 2,  // 40% of card height
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: IS_IPAD ? 15 : 12,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardSub: {
    fontSize: IS_IPAD ? 11 : 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  animalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  animalCount: {
    fontSize: IS_IPAD ? 11 : 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  pawDots: {
    flexDirection: 'row',
    gap: 3,
    flexWrap: 'wrap',
  },
  pawDot: {
    width: IS_IPAD ? 7 : 6,
    height: IS_IPAD ? 7 : 6,
    borderRadius: 4,
  },

  // Lock overlay
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(200,200,210,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockEmoji: { fontSize: IS_IPAD ? 44 : 34 },
  lockLevel: {
    fontSize: IS_IPAD ? 16 : 14,
    fontWeight: '900',
    color: '#555',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
});
