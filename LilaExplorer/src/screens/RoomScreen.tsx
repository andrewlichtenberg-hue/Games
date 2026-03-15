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
const ROOM_H = Math.min(340, height * 0.42);

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Room'> };

// Fixed positions for up to 5 furniture items in the room
const FURNITURE_SLOTS: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
  { top: 20, left: 18 },
  { top: 20, right: 18 },
  { top: 80, left: 18 },
  { top: 80, right: 18 },
  { top: 150, left: width / 2 - 30 },
];

export function RoomScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    playerName, hairColor, skinTone, outfitColor,
    equippedHat, equippedOutfit, equippedFurniture, companionAnimals,
    earnSticker, gainXP,
  } = useGameStore();

  const [interactAnimalId, setInteractAnimalId] = useState<string | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
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

  return (
    <LinearGradient colors={['#FFF3E0', '#FFF9C4', '#E8F5E9']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>🏡 {playerName}'s Room</Text>
          <Text style={styles.subtitle}>{playerName}'s cozy hideout</Text>
        </View>
      </View>

      {/* Room */}
      <View style={styles.room}>
        <LinearGradient colors={['#FCE4EC', '#FFF9C4']} style={styles.roomGradient}>
          {/* Wallpaper stripes (decorative) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {Array.from({ length: 6 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.wallStripe,
                  { left: i * (width / 6), opacity: i % 2 === 0 ? 0.06 : 0 },
                ]}
              />
            ))}
          </View>

          {/* Furniture */}
          {equippedFurniture.map((furnId, i) => {
            const item = getItemById(furnId);
            if (!item) return null;
            const pos = FURNITURE_SLOTS[i % FURNITURE_SLOTS.length];
            if (furnId === 'furn-bed') {
              return (
                <TouchableOpacity
                  key={furnId}
                  style={[styles.furnItem, pos]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsSleeping((s) => !s);
                  }}
                  activeOpacity={0.8}
                >
                  <FurnitureSprite furnId={furnId} size={70} />
                  <Text style={styles.furnName}>{isSleeping ? '😴 Napping...' : item.name}</Text>
                </TouchableOpacity>
              );
            }
            return (
              <View key={furnId} style={[styles.furnItem, pos]}>
                <FurnitureSprite furnId={furnId} size={60} />
                <Text style={styles.furnName}>{item.name}</Text>
              </View>
            );
          })}

          {/* Floor */}
          <View style={styles.floor} />

          {/* Lila — standing or sleeping on the bed */}
          <View style={styles.lilaPos}>
            {isSleeping ? (
              <View style={styles.sleepingWrapper}>
                <View style={styles.sleepingCharacter}>
                  <LilaCharacter
                    hairColor={hairColor}
                    skinTone={skinTone}
                    outfitColor={activeOutfitColor}
                    equippedHat={equippedHat}
                    size={80}
                  />
                </View>
                <Text style={styles.zzzText}>💤</Text>
              </View>
            ) : (
              <LilaCharacter
                hairColor={hairColor}
                skinTone={skinTone}
                outfitColor={activeOutfitColor}
                equippedHat={equippedHat}
                size={120}
              />
            )}
          </View>

          {/* Companion animals — up to 6 visible in the room */}
          {companionAnimals.slice(0, 6).map((id, i) => {
            const animal = getAnimalById(id);
            if (!animal) return null;
            const bounce = getOrCreateBounce(id);
            // Spread animals left and right of Lila along the floor
            const side = i % 2 === 0 ? 'left' : 'right';
            const offset = Math.floor(i / 2) * 72 + 16;
            const pos = side === 'left'
              ? { left: offset, bottom: 28 }
              : { right: offset, bottom: 28 };

            return (
              <Animated.View
                key={id}
                style={[
                  styles.companionInRoom,
                  pos,
                  { transform: [{ translateY: bounce }] },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleAnimalTap(id, animal)}
                  activeOpacity={0.85}
                >
                  <AnimalSprite
                    type={animal.type}
                    size={52}
                    bodyColor={animal.bodyColor}
                    accentColor={animal.accentColor}
                  />
                </TouchableOpacity>
                <Text style={styles.companionNameLabel}>
                  {animal.name.split(' ')[0]}
                </Text>
                <Text style={styles.companionTapHint}>tap me!</Text>
              </Animated.View>
            );
          })}

          {/* Empty state */}
          {companionAnimals.length === 0 && (
            <View style={styles.emptyRoom}>
              <Text style={styles.emptyRoomText}>
                Find animal friends by exploring!{'\n'}Max friendship → they move in! 🌿
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Overflow companions (beyond 6) — scrollable strip */}
      {companionAnimals.length > 6 && (
        <View style={styles.overflowSection}>
          <Text style={styles.overflowTitle}>Also here:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.overflowScroll}
          >
            {companionAnimals.slice(6).map((id) => {
              const animal = getAnimalById(id);
              if (!animal) return null;
              return (
                <View key={id} style={styles.overflowItem}>
                  <AnimalSprite
                    type={animal.type}
                    size={40}
                    bodyColor={animal.bodyColor}
                    accentColor={animal.accentColor}
                  />
                  <Text style={styles.overflowName}>{animal.name.split(' ')[0]}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Furniture & companion counts */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{companionAnimals.length}</Text>
          <Text style={styles.statLabel}>Companions</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => navigation.navigate('StickerBook')}
        >
          <Text style={styles.statNum}>📖</Text>
          <Text style={[styles.statLabel, { color: C.UI_PRIMARY }]}>Stickers</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => navigation.navigate('Wardrobe')}
        >
          <Text style={styles.statNum}>🏡</Text>
          <Text style={[styles.statLabel, { color: C.UI_PRIMARY }]}>Decorate</Text>
        </TouchableOpacity>
      </View>

      {/* Companion interaction modal */}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { marginBottom: 6 },
  backText: { fontSize: 15, fontWeight: '700', color: C.TEXT_MID },
  title: { fontSize: 26, fontWeight: '900', color: C.TEXT_DARK },
  subtitle: { fontSize: 13, color: C.TEXT_MID, fontWeight: '600', marginTop: 2 },
  room: {
    marginHorizontal: 16,
    height: ROOM_H,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  roomGradient: {
    flex: 1,
    position: 'relative',
  },
  wallStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width / 6,
    backgroundColor: '#FF6B9D',
  },
  furnItem: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  furnName: {
    fontSize: 9,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 60,
  },
  floor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: '#D4B483',
    borderTopWidth: 3,
    borderTopColor: '#B8935A',
    zIndex: 1,
  },
  lilaPos: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    zIndex: 3,
  },
  sleepingWrapper: {
    alignItems: 'center',
  },
  sleepingCharacter: {
    transform: [{ rotate: '90deg' }],
  },
  zzzText: {
    fontSize: 20,
    marginTop: 4,
    textAlign: 'center',
  },
  companionInRoom: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 3,
  },
  companionNameLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  companionTapHint: {
    fontSize: 8,
    color: C.UI_PRIMARY,
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
  },
  emptyRoom: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyRoomText: {
    fontSize: 13,
    color: C.TEXT_MID,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  overflowSection: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  overflowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginBottom: 6,
  },
  overflowScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
  },
  overflowItem: { alignItems: 'center' },
  overflowName: {
    fontSize: 9,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: C.UI_PRIMARY },
  statLabel: { fontSize: 11, color: C.TEXT_MID, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#EEE', marginVertical: 4 },
});
