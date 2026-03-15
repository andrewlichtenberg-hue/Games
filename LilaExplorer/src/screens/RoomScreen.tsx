import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Rect, Line } from 'react-native-svg';
import { LilaCharacter } from '../components/LilaCharacter';
import { FurnitureSprite } from '../components/FurnitureSprite';
import { AnimalSprite } from '../components/AnimalSprite';
import { CompanionInteractionModal } from '../components/CompanionInteractionModal';
import { C } from '../utils/colors';
import { useGameStore } from '../store/gameStore';
import { getAnimalById, Animal } from '../game/animals';
import { getItemById } from '../game/items';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

// Room outer dimensions
const ROOM_H = Math.min(370, height * 0.47);
const ROOM_W = width - 32; // 16px margin each side

// Furniture grid constants
const FURN_SIZE = 74;   // px size each furniture SVG renders at
const FLOOR_H  = 68;    // floor strip height
const WALL_H   = ROOM_H - FLOOR_H;

// 6-slot grid: 3 columns × 2 rows along the back wall
const _COL_L = 8;
const _COL_C = Math.round(ROOM_W / 2 - FURN_SIZE / 2);
const _COL_R_RIGHT = 8; // use `right:` positioning
const _ROW1 = 8;
const _ROW2 = 8 + FURN_SIZE + 8;

const FURNITURE_SLOTS = [
  { top: _ROW1, left:  _COL_L },       // 0 back-left
  { top: _ROW1, left:  _COL_C },       // 1 back-center
  { top: _ROW1, right: _COL_R_RIGHT }, // 2 back-right
  { top: _ROW2, left:  _COL_L },       // 3 mid-left
  { top: _ROW2, left:  _COL_C },       // 4 mid-center
  { top: _ROW2, right: _COL_R_RIGHT }, // 5 mid-right
] as const;

type Slot = typeof FURNITURE_SLOTS[number];

/** Pixel center of a furniture slot (within the wall area). */
function slotCenter(slot: Slot): { x: number; y: number } {
  const x = 'left' in slot && slot.left !== undefined
    ? slot.left + FURN_SIZE / 2
    : ROOM_W - (slot as any).right - FURN_SIZE / 2;
  // Bed mattress centre is roughly 55% down the sprite
  return { x, y: slot.top + FURN_SIZE * 0.55 };
}

// ── Decorative sub-components ────────────────────────────────────────────────

/** Wood-plank floor with baseboard */
function WoodFloor() {
  const planks = 5;
  const plankW = ROOM_W / planks;
  return (
    <Svg width={ROOM_W} height={FLOOR_H} viewBox={`0 0 ${ROOM_W} ${FLOOR_H}`} style={StyleSheet.absoluteFill}>
      {/* Main floor colour */}
      <Rect x={0} y={0} width={ROOM_W} height={FLOOR_H} fill="#D4A86A" />
      {/* Baseboard strip */}
      <Rect x={0} y={0} width={ROOM_W} height={7} fill="#8B5E3C" />
      <Rect x={0} y={7} width={ROOM_W} height={2} fill="#A07040" />
      {/* Plank dividers */}
      {Array.from({ length: planks - 1 }, (_, i) => (
        <Line key={i} x1={(i + 1) * plankW} y1={9} x2={(i + 1) * plankW} y2={FLOOR_H} stroke="#C49060" strokeWidth={1.5} />
      ))}
      {/* Grain lines per plank */}
      {Array.from({ length: planks }, (_, i) => (
        <Line key={`g${i}`} x1={i * plankW + plankW * 0.3} y1={14} x2={i * plankW + plankW * 0.5} y2={FLOOR_H} stroke="rgba(160,110,50,0.35)" strokeWidth={1} />
      ))}
    </Svg>
  );
}

/** Pastel polka-dot wallpaper (non-interactive) */
function WallpaperDots() {
  const rows = 4, cols = 10;
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({
        x: (c + 0.5) * (ROOM_W / cols) + (r % 2 === 0 ? 0 : ROOM_W / cols / 2),
        y: r * (WALL_H / rows) + (WALL_H / rows) / 2,
      });
    }
  }
  return (
    <Svg
      width={ROOM_W}
      height={WALL_H}
      viewBox={`0 0 ${ROOM_W} ${WALL_H}`}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {dots.map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={3.5} fill="rgba(255,107,157,0.11)" />
      ))}
    </Svg>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Room'> };

export function RoomScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    playerName, hairColor, skinTone, outfitColor,
    equippedHat, equippedOutfit, equippedFurniture, companionAnimals,
    earnSticker, gainXP,
  } = useGameStore();

  const [interactAnimalId, setInteractAnimalId] = useState<string | null>(null);
  const [isSleeping, setIsSleeping]             = useState(false);
  const bounceAnims = useRef<Record<string, Animated.Value>>({}).current;

  const activeOutfitColor = equippedOutfit
    ? (getItemById(equippedOutfit)?.color ?? outfitColor)
    : outfitColor;

  const getOrCreateBounce = (id: string) => {
    if (!bounceAnims[id]) bounceAnims[id] = new Animated.Value(0);
    return bounceAnims[id];
  };

  const handleAnimalTap = (id: string, _animal: Animal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const bounce = getOrCreateBounce(id);
    Animated.sequence([
      Animated.timing(bounce, { toValue: -12, duration: 120, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
    setInteractAnimalId(id);
  };

  const interactAnimal = interactAnimalId ? getAnimalById(interactAnimalId) : null;

  // Sleeping-on-bed: compute where to overlay the lying-down character
  const bedIndex   = equippedFurniture.indexOf('furn-bed');
  const bedSlot    = bedIndex >= 0 ? FURNITURE_SLOTS[bedIndex % FURNITURE_SLOTS.length] : null;
  const bedCenter  = bedSlot ? slotCenter(bedSlot) : null;

  // Sleeping sprite dimensions (rotated 90° to lie horizontal)
  const SLEEP_SIZE = 54;                           // sprite height (= lying width)
  const SLEEP_W    = SLEEP_SIZE * (100 / 180);     // sprite width  (≈ lying height) ~30px

  return (
    <LinearGradient colors={['#FFF3E0', '#FFF9C4', '#E8F5E9']} style={styles.container}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>🏡 {playerName}'s Room</Text>
          <Text style={styles.subtitle}>
            {isSleeping ? '😴 Taking a little nap…' : `${playerName}'s cozy hideout`}
          </Text>
        </View>
      </View>

      {/* ── Room ───────────────────────────────────────────────── */}
      <View style={styles.room}>

        {/* WALL AREA — furniture + sleeping overlay */}
        <LinearGradient
          colors={['#FDEEF7', '#FFF0FB', '#FFFCF0']}
          style={styles.wallArea}
          pointerEvents="box-none"
        >
          {/* Decorative wallpaper dots */}
          <WallpaperDots />

          {/* Furniture grid */}
          {equippedFurniture.map((furnId, i) => {
            const item = getItemById(furnId);
            if (!item) return null;
            const slot = FURNITURE_SLOTS[i % FURNITURE_SLOTS.length];
            const isBed = furnId === 'furn-bed';
            const inner = (
              <>
                <FurnitureSprite furnId={furnId} size={FURN_SIZE} />
                <Text style={styles.furnName}>
                  {isBed && isSleeping ? '😴' : item.name}
                </Text>
              </>
            );
            if (isBed) {
              return (
                <TouchableOpacity
                  key={furnId}
                  style={[styles.furnItem, slot]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsSleeping(s => !s);
                  }}
                  activeOpacity={0.85}
                >
                  {inner}
                </TouchableOpacity>
              );
            }
            return (
              <View key={furnId} style={[styles.furnItem, slot]}>
                {inner}
              </View>
            );
          })}

          {/* Sleeping Lila overlaid on the bed */}
          {isSleeping && bedCenter && (
            <>
              {/* Character lying horizontally on the mattress */}
              <View
                style={{
                  position: 'absolute',
                  // Center the pre-rotation bounding box over the mattress
                  top:  bedCenter.y - SLEEP_SIZE / 2,
                  left: bedCenter.x - SLEEP_W / 2,
                  zIndex: 6,
                  transform: [{ rotate: '90deg' }],
                }}
              >
                <LilaCharacter
                  hairColor={hairColor}
                  skinTone={skinTone}
                  outfitColor={activeOutfitColor}
                  equippedHat={null}
                  size={SLEEP_SIZE}
                />
              </View>
              {/* Floating ZZZ bubble */}
              <Text
                style={{
                  position: 'absolute',
                  top:  bedCenter.y - SLEEP_SIZE / 2 - 20,
                  left: bedCenter.x + SLEEP_W / 2 + 2,
                  zIndex: 7,
                  fontSize: 15,
                }}
              >
                💤
              </Text>
            </>
          )}
        </LinearGradient>

        {/* FLOOR AREA — character + companions */}
        <View style={styles.floorArea}>
          <WoodFloor />

          {/* Lila standing (hidden while sleeping) */}
          {!isSleeping && (
            <View style={styles.lilaPos}>
              <LilaCharacter
                hairColor={hairColor}
                skinTone={skinTone}
                outfitColor={activeOutfitColor}
                equippedHat={equippedHat}
                size={112}
              />
            </View>
          )}

          {/* Companion animals spread along the floor */}
          {companionAnimals.slice(0, 6).map((id, i) => {
            const animal = getAnimalById(id);
            if (!animal) return null;
            const bounce   = getOrCreateBounce(id);
            const side     = i % 2 === 0 ? 'left' : 'right';
            const offset   = Math.floor(i / 2) * 66 + 10;
            const animalPos = side === 'left'
              ? { left: offset, bottom: 6 }
              : { right: offset, bottom: 6 };
            return (
              <Animated.View
                key={id}
                style={[styles.companionInRoom, animalPos, { transform: [{ translateY: bounce }] }]}
              >
                <TouchableOpacity onPress={() => handleAnimalTap(id, animal)} activeOpacity={0.85}>
                  <AnimalSprite
                    type={animal.type}
                    size={48}
                    bodyColor={animal.bodyColor}
                    accentColor={animal.accentColor}
                  />
                </TouchableOpacity>
                <Text style={styles.companionNameLabel}>{animal.name.split(' ')[0]}</Text>
                <Text style={styles.companionTapHint}>tap!</Text>
              </Animated.View>
            );
          })}

          {companionAnimals.length === 0 && (
            <View style={styles.emptyRoom}>
              <Text style={styles.emptyRoomText}>
                Explore to find animal friends!{'\n'}Max friendship → they move in 🌿
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Overflow companions (> 6) */}
      {companionAnimals.length > 6 && (
        <View style={styles.overflowSection}>
          <Text style={styles.overflowTitle}>Also here:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.overflowScroll}>
            {companionAnimals.slice(6).map((id) => {
              const animal = getAnimalById(id);
              if (!animal) return null;
              return (
                <View key={id} style={styles.overflowItem}>
                  <AnimalSprite type={animal.type} size={40} bodyColor={animal.bodyColor} accentColor={animal.accentColor} />
                  <Text style={styles.overflowName}>{animal.name.split(' ')[0]}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Stats / nav strip */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{companionAnimals.length}</Text>
          <Text style={styles.statLabel}>Companions</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('StickerBook')}>
          <Text style={styles.statNum}>📖</Text>
          <Text style={[styles.statLabel, { color: C.UI_PRIMARY }]}>Stickers</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Wardrobe')}>
          <Text style={styles.statNum}>🏡</Text>
          <Text style={[styles.statLabel, { color: C.UI_PRIMARY }]}>Decorate</Text>
        </TouchableOpacity>
      </View>

      {interactAnimal && (
        <CompanionInteractionModal
          visible
          animal={interactAnimal}
          onEarnSticker={(id) => earnSticker(id)}
          onGainXP={(xp) => gainXP(xp)}
          onClose={() => setInteractAnimalId(null)}
        />
      )}
    </LinearGradient>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header:    { paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:   { marginBottom: 6 },
  backText:  { fontSize: 15, fontWeight: '700', color: C.TEXT_MID },
  title:     { fontSize: 26, fontWeight: '900', color: C.TEXT_DARK },
  subtitle:  { fontSize: 13, color: C.TEXT_MID, fontWeight: '600', marginTop: 2 },

  room: {
    marginHorizontal: 16,
    height: ROOM_H,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Upper wall region (furniture lives here)
  wallArea: {
    height: WALL_H,
    position: 'relative',
  },
  // Lower floor region (character + animals live here)
  floorArea: {
    height: FLOOR_H,
    position: 'relative',
    overflow: 'visible', // allow Lila to extend upward into wall area
  },

  furnItem: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  furnName: {
    fontSize: 8,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: FURN_SIZE,
  },

  lilaPos: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    zIndex: 3,
  },

  companionInRoom: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 3,
  },
  companionNameLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  companionTapHint: {
    fontSize: 7,
    color: C.UI_PRIMARY,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyRoom: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyRoomText: {
    fontSize: 12,
    color: C.TEXT_MID,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  overflowSection: { marginTop: 10, paddingHorizontal: 16 },
  overflowTitle:   { fontSize: 12, fontWeight: '700', color: C.TEXT_MID, marginBottom: 6 },
  overflowScroll:  { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  overflowItem:    { alignItems: 'center' },
  overflowName:    { fontSize: 9, fontWeight: '700', color: C.TEXT_MID, marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem:   { flex: 1, alignItems: 'center' },
  statNum:    { fontSize: 22, fontWeight: '900', color: C.UI_PRIMARY },
  statLabel:  { fontSize: 11, color: C.TEXT_MID, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#EEE', marginVertical: 4 },
});
