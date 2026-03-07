import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
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

// ── Layout constants ──────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');
const IS_IPAD = width >= 768;

const NUM_COLS   = IS_IPAD ? 3 : 2;
const NUM_ROWS   = Math.ceil(LOCATIONS.length / NUM_COLS);
const HEADER_H   = IS_IPAD ? 100 : 108;
const GRID_PAD   = IS_IPAD ? 16 : 12;
const CARD_GAP   = IS_IPAD ? 14 : 10;

const CARD_W = (width - GRID_PAD * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

// iPad: cards fill the screen height exactly (no scroll).
// iPhone: a comfortable fixed height; grid scrolls lightly.
const CARD_H = IS_IPAD
  ? Math.floor((height - HEADER_H - GRID_PAD * 2 - CARD_GAP * (NUM_ROWS - 1)) / NUM_ROWS)
  : 152;

// Scene emoji per scene type
const SCENE_EMOJI: Record<string, string> = {
  park:     '🌳',
  beach:    '🏖️',
  forest:   '🌲',
  mountain: '⛰️',
  city:     '🏙️',
};

type Props = { navigation: StackNavigationProp<RootStackParamList, 'WorldMap'> };

// ── Location card ─────────────────────────────────────────────────────────────

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
  const emojiSize = IS_IPAD ? 52 : 38;

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
        {/* ── Sky (top ~60%) ── */}
        <LinearGradient
          colors={[location.skyTop, location.skyBottom]}
          style={styles.cardSky}
        >
          <Text style={{ fontSize: emojiSize }}>{emoji}</Text>

          {visited && (
            <View style={styles.cornerBadge}>
              <Text style={styles.visitedText}>✓</Text>
            </View>
          )}
          {isNew && !visited && (
            <View style={styles.cornerBadge}>
              <Text style={styles.newText}>✨</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Ground strip (bottom ~40%) ── */}
        <View style={[styles.cardGround, { backgroundColor: location.groundColor }]}>
          <Text style={styles.cardName} numberOfLines={1}>{location.name}</Text>
          <Text style={styles.cardSub}  numberOfLines={1}>{location.subtitle}</Text>
          <View style={styles.animalRow}>
            <Text style={styles.animalCount}>
              {animalFoundCount > 0
                ? `${animalFoundCount}/${totalAnimals} 🐾`
                : `${totalAnimals} animals`}
            </Text>
            <View style={styles.pawDots}>
              {location.animalIds.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pawDot,
                    { backgroundColor: i < animalFoundCount
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.28)' },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* ── Lock overlay ── */}
        {!unlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockEmoji}>🔒</Text>
            <View style={styles.lockPill}>
              <Text style={styles.lockLevel}>Level {location.unlockLevel}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function WorldMapScreen({ navigation }: Props) {
  const { unlockedLocations, visitedLocations, discoveredAnimals } = useGameStore();

  useFocusEffect(
    React.useCallback(() => {
      audioManager.playMusic('theme');
    }, [])
  );

  // Chunk locations into rows
  const rows: Location[][] = [];
  for (let i = 0; i < LOCATIONS.length; i += NUM_COLS) {
    rows.push(LOCATIONS.slice(i, i + NUM_COLS));
  }

  const renderRow = (row: Location[], r: number) => (
    <View key={r} style={[styles.row, { gap: CARD_GAP }]}>
      {row.map((loc) => {
        const unlocked = unlockedLocations.includes(loc.id);
        const visited  = visitedLocations.includes(loc.id);
        const found    = loc.animalIds.filter((id) => discoveredAnimals.includes(id)).length;
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
      {/* Spacer for an incomplete final row */}
      {row.length < NUM_COLS &&
        Array(NUM_COLS - row.length).fill(0).map((_, i) => (
          <View key={`sp-${i}`} style={{ width: CARD_W, height: CARD_H }} />
        ))}
    </View>
  );

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Home</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Where do you want to go? 🗺️</Text>
    </View>
  );

  // ── iPad: exact-fit grid, no scroll ─────────────────────────────────────────
  if (IS_IPAD) {
    return (
      <LinearGradient colors={['#E8F5E9', '#E3F2FD']} style={styles.container}>
        {header}
        <View style={[styles.ipadGrid, { padding: GRID_PAD, gap: CARD_GAP }]}>
          {rows.map(renderRow)}
        </View>
      </LinearGradient>
    );
  }

  // ── iPhone: scrollable grid with comfortable fixed card sizes ────────────────
  return (
    <LinearGradient colors={['#E8F5E9', '#E3F2FD']} style={styles.container}>
      {header}
      <ScrollView
        contentContainerStyle={[styles.phoneGrid, { padding: GRID_PAD, gap: CARD_GAP }]}
        showsVerticalScrollIndicator={false}
      >
        {rows.map(renderRow)}
        <View style={{ height: 16 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: HEADER_H,
    paddingTop: IS_IPAD ? 48 : 52,
    paddingHorizontal: GRID_PAD,
    justifyContent: 'flex-end',
    paddingBottom: IS_IPAD ? 10 : 8,
  },
  backBtn: { marginBottom: 4 },
  backText: { fontSize: 15, fontWeight: '700', color: C.TEXT_MID },
  title: {
    fontSize: IS_IPAD ? 22 : 19,
    fontWeight: '900',
    color: C.TEXT_DARK,
  },

  // iPad: rows fill available height equally
  ipadGrid: {
    flex: 1,
  },

  // iPhone: natural height, scrollable
  phoneGrid: {
    flexGrow: 1,
  },

  row: {
    flex: IS_IPAD ? 1 : undefined,    // iPad rows stretch to fill; phone rows are natural height
    flexDirection: 'row',
    marginBottom: IS_IPAD ? 0 : CARD_GAP,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  cardWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardWrapLocked: {
    shadowOpacity: 0.04,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },

  cardSky: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Top-right corner badge (visited ✓ or sparkle ✨)
  cornerBadge: {
    position: 'absolute',
    top: 7,
    right: 9,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 12,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitedText: { fontSize: 13, fontWeight: '900', color: '#27AE60' },
  newText:     { fontSize: 15 },

  cardGround: {
    flex: 2,
    paddingHorizontal: 9,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: IS_IPAD ? 14 : 12,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardSub: {
    fontSize: IS_IPAD ? 11 : 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
    marginTop: 1,
  },
  animalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: IS_IPAD ? 5 : 4,
    gap: 5,
    flexWrap: 'wrap',
  },
  animalCount: {
    fontSize: IS_IPAD ? 11 : 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  pawDots: { flexDirection: 'row', gap: 3, flexWrap: 'wrap' },
  pawDot: {
    width: IS_IPAD ? 7 : 6,
    height: IS_IPAD ? 7 : 6,
    borderRadius: 4,
  },

  // ── Lock overlay ────────────────────────────────────────────────────────────
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(200,200,212,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockEmoji: { fontSize: IS_IPAD ? 42 : 32 },
  lockPill: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockLevel: {
    fontSize: IS_IPAD ? 15 : 13,
    fontWeight: '900',
    color: '#444',
  },
});
