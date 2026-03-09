import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { AnimalSprite } from '../components/AnimalSprite';
import { BigButton } from '../components/ui/BigButton';
import { C } from '../utils/colors';
import { ANIMALS, Animal } from '../game/animals';
import { LOCATIONS } from '../game/locations';
import { useGameStore } from '../store/gameStore';
import type { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 3;
const STICKER_W = (width - 64) / 4;

type Tab = 'scrapbook' | 'all' | 'companions';
type Props = { navigation: StackNavigationProp<RootStackParamList, 'Journal'> };

// ── Rarity colours ───────────────────────────────────────────────────────────

const RARITY_COLORS = {
  common: '#90A4AE',
  rare: '#7986CB',
  legendary: '#FFD700',
};

// ── Animal detail modal ──────────────────────────────────────────────────────

function AnimalDetailModal({
  animal,
  friendshipLevel,
  isCompanion,
  visible,
  onClose,
}: {
  animal: Animal | null;
  friendshipLevel: number;
  isCompanion: boolean;
  visible: boolean;
  onClose: () => void;
}) {
  if (!animal) return null;
  const threshold = animal.companionThreshold ?? 3;
  const hearts = Array.from({ length: threshold }, (_, i) =>
    i < friendshipLevel ? '❤️' : '🤍'
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <LinearGradient colors={['#E8F5E9', '#F3E5F5']} style={styles.modalGradient}>
            <AnimalSprite
              type={animal.type}
              size={110}
              bodyColor={animal.bodyColor}
              accentColor={animal.accentColor}
            />
            <Text style={styles.modalName}>{animal.name}</Text>
            <Text style={styles.modalRarity}>
              {animal.rarity === 'legendary' ? '✨ Legendary' :
               animal.rarity === 'rare' ? '💜 Rare' : '🌿 Common'}
              {isCompanion ? '  🏠 Companion' : ''}
            </Text>
            <Text style={styles.heartsLarge}>{hearts.join('  ')}</Text>
            <View style={styles.factBox}>
              <Text style={styles.factLabel}>Fun Fact!</Text>
              <Text style={styles.factText}>{animal.funFact}</Text>
            </View>
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>"{animal.greetings[0]}"</Text>
            </View>
            <BigButton
              label="Close"
              onPress={onClose}
              color="purple"
              size="small"
              style={styles.closeBtn}
            />
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

// ── Grid card (All / Companions tab) ────────────────────────────────────────

function AnimalCard({
  animal,
  discovered,
  isCompanion,
  friendshipLevel,
  onPress,
}: {
  animal: Animal;
  discovered: boolean;
  isCompanion: boolean;
  friendshipLevel: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, !discovered && styles.cardLocked]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
    >
      {discovered ? (
        <>
          <AnimalSprite
            type={animal.type}
            size={56}
            bodyColor={animal.bodyColor}
            accentColor={animal.accentColor}
          />
          <Text style={styles.cardName} numberOfLines={2}>
            {animal.name.split(' ')[0]}
          </Text>
          {isCompanion && <Text style={styles.companionBadge}>🏠</Text>}
          <View style={styles.heartsRow}>
            {Array.from({ length: animal.companionThreshold ?? 3 }, (_, i) => (
              <Text key={i} style={styles.heartTiny}>
                {i < friendshipLevel ? '❤️' : '🤍'}
              </Text>
            ))}
          </View>
          <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[animal.rarity] }]} />
        </>
      ) : (
        <>
          <Text style={styles.lockEmoji}>❓</Text>
          <Text style={styles.lockedText}>???</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Scrapbook sticker ────────────────────────────────────────────────────────

function Sticker({
  animal,
  discovered,
  onPress,
}: {
  animal: Animal;
  discovered: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sticker, !discovered && styles.stickerLocked]}
      onPress={() => discovered && onPress()}
      activeOpacity={discovered ? 0.8 : 1}
    >
      {discovered ? (
        <>
          <AnimalSprite
            type={animal.type}
            size={44}
            bodyColor={animal.bodyColor}
            accentColor={animal.accentColor}
          />
          <Text style={styles.stickerName} numberOfLines={1}>
            {animal.name.split(' ')[0]}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.stickerQuestion}>❓</Text>
          <Text style={styles.stickerLockedName}>???</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── One location's page in the scrapbook ────────────────────────────────────

function LocationPage({
  location,
  discoveredAnimals,
  claimed,
  onAnimalPress,
  onClaimBonus,
}: {
  location: typeof LOCATIONS[0];
  discoveredAnimals: string[];
  claimed: boolean;
  onAnimalPress: (a: Animal) => void;
  onClaimBonus: () => void;
}) {
  const locationAnimals = ANIMALS.filter((a) => a.locationIds.includes(location.id));
  const foundHere = locationAnimals.filter((a) => discoveredAnimals.includes(a.id));
  const allFound = foundHere.length === locationAnimals.length && locationAnimals.length > 0;
  const bonusXP = location.unlockLevel * 30;

  const sceneEmoji =
    location.sceneType === 'park' ? '🌳' :
    location.sceneType === 'beach' ? '🏖️' :
    location.sceneType === 'forest' ? '🌲' :
    location.sceneType === 'jungle' ? '🌴' :
    location.sceneType === 'mountain' ? '⛰️' : '🏙️';

  return (
    <View style={styles.locationPage}>
      {/* Header bar with location sky colours */}
      <LinearGradient
        colors={[location.skyTop, location.skyBottom]}
        style={styles.locationHeader}
      >
        <Text style={styles.locationEmoji}>{sceneEmoji}</Text>
        <View style={styles.locationHeaderText}>
          <Text style={styles.locationPageName}>{location.name}</Text>
          <Text style={styles.locationPageSub}>{location.subtitle}</Text>
        </View>
        <Text style={styles.locationProgress}>
          {foundHere.length}/{locationAnimals.length}
        </Text>
      </LinearGradient>

      {/* Animal sticker slots */}
      <View style={styles.stickersRow}>
        {locationAnimals.map((animal) => (
          <Sticker
            key={animal.id}
            animal={animal}
            discovered={discoveredAnimals.includes(animal.id)}
            onPress={() => onAnimalPress(animal)}
          />
        ))}
      </View>

      {/* Completion bonus claim */}
      {allFound && (
        <View style={styles.completionBanner}>
          {claimed ? (
            <View style={styles.completionDone}>
              <Text style={styles.completionDoneText}>⭐ Complete! Bonus collected!</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.claimBtn}
              onPress={onClaimBonus}
              activeOpacity={0.8}
            >
              <Text style={styles.claimBtnText}>⭐ Complete! Claim +{bonusXP} XP!</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export function JournalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    discoveredAnimals,
    companionAnimals,
    animalFriendship,
    claimedLocationBonuses,
    claimLocationBonus,
  } = useGameStore();

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('scrapbook');

  const discoveredCount = discoveredAnimals.length;
  const totalCount = ANIMALS.length;

  const gridAnimals =
    activeTab === 'companions'
      ? ANIMALS.filter((a) => companionAnimals.includes(a.id))
      : ANIMALS;

  // Locations that have at least one discovered animal
  const visitedLocations = LOCATIONS.filter((loc) =>
    ANIMALS.some((a) => a.locationIds.includes(loc.id) && discoveredAnimals.includes(a.id))
  );

  return (
    <>
      <LinearGradient colors={['#E8F5E9', '#FFF9C4']} style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📓 Nature Journal</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.gradientBar}>
            <Text style={styles.progressText}>
              {discoveredCount} / {totalCount} Animals Found 🌿
            </Text>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(
            [
              { key: 'scrapbook' as Tab, label: '📍 Places' },
              { key: 'all' as Tab, label: `All (${totalCount})` },
              { key: 'companions' as Tab, label: `🏠 Friends (${companionAnimals.length})` },
            ]
          ).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scrapbook: location pages */}
        {activeTab === 'scrapbook' && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {visitedLocations.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌿</Text>
                <Text style={styles.emptyText}>Go explore to fill your scrapbook!</Text>
              </View>
            )}
            {visitedLocations.map((loc) => (
              <LocationPage
                key={loc.id}
                location={loc}
                discoveredAnimals={discoveredAnimals}
                claimed={claimedLocationBonuses.includes(loc.id)}
                onAnimalPress={(a) => setSelectedAnimal(a)}
                onClaimBonus={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  claimLocationBonus(loc.id, loc.unlockLevel * 30);
                }}
              />
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* All / Companions: flat grid */}
        {activeTab !== 'scrapbook' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {gridAnimals.map((animal) => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                discovered={discoveredAnimals.includes(animal.id)}
                isCompanion={companionAnimals.includes(animal.id)}
                friendshipLevel={Math.min(animalFriendship[animal.id] ?? 0, animal.companionThreshold ?? 3)}
                onPress={() => {
                  if (discoveredAnimals.includes(animal.id)) setSelectedAnimal(animal);
                }}
              />
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </LinearGradient>

      {/* Detail modal */}
      <AnimalDetailModal
        animal={selectedAnimal}
        friendshipLevel={Math.min(animalFriendship[selectedAnimal?.id ?? ''] ?? 0, selectedAnimal?.companionThreshold ?? 3)}
        isCompanion={companionAnimals.includes(selectedAnimal?.id ?? '')}
        visible={selectedAnimal !== null}
        onClose={() => setSelectedAnimal(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  backBtn: { marginBottom: 4 },
  backText: { fontSize: 15, fontWeight: '700', color: C.TEXT_MID },
  title: { fontSize: 26, fontWeight: '900', color: C.TEXT_DARK },
  progressBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientBar: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  progressText: { color: 'white', fontSize: 14, fontWeight: '800' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#EEE',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 11, fontWeight: '700', color: C.TEXT_MID },
  tabTextActive: { color: C.UI_PRIMARY },

  // ── Scrapbook ──────────────────────────────────────────────────
  locationPage: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationEmoji: { fontSize: 24, marginRight: 10 },
  locationHeaderText: { flex: 1 },
  locationPageName: { fontSize: 15, fontWeight: '900', color: 'white' },
  locationPageSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  locationProgress: {
    fontSize: 13,
    fontWeight: '800',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stickersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  sticker: {
    width: STICKER_W,
    minHeight: 80,
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  stickerLocked: { backgroundColor: '#F0F0F0', opacity: 0.6 },
  stickerName: {
    fontSize: 10,
    fontWeight: '700',
    color: C.TEXT_DARK,
    marginTop: 4,
    textAlign: 'center',
  },
  stickerQuestion: { fontSize: 28 },
  stickerLockedName: {
    fontSize: 10,
    color: C.TEXT_LIGHT,
    fontWeight: '700',
    marginTop: 2,
  },
  completionBanner: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  completionDone: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.UI_GOLD,
    alignItems: 'center',
  },
  completionDoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#856404',
  },
  claimBtn: {
    backgroundColor: C.UI_GOLD,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#C9A700',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  claimBtnText: { fontSize: 15, fontWeight: '900', color: '#3D2B00' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 16,
    color: C.TEXT_MID,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // ── Grid (All / Companions) ────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: CARD_W,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    minHeight: 100,
  },
  cardLocked: { backgroundColor: '#F5F5F5', opacity: 0.7 },
  cardName: {
    fontSize: 11,
    fontWeight: '800',
    color: C.TEXT_DARK,
    textAlign: 'center',
    marginTop: 4,
  },
  companionBadge: { position: 'absolute', top: 6, right: 6, fontSize: 14 },
  heartsRow: { flexDirection: 'row', marginTop: 4, gap: 1 },
  heartTiny: { fontSize: 9 },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    left: 8,
  },
  lockEmoji: { fontSize: 32, marginTop: 8 },
  lockedText: { fontSize: 12, color: C.TEXT_LIGHT, fontWeight: '700', marginTop: 4 },

  // ── Animal detail modal ────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: { padding: 24, alignItems: 'center' },
  modalName: { fontSize: 22, fontWeight: '900', color: C.TEXT_DARK, marginTop: 8 },
  modalRarity: {
    fontSize: 14,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 4,
    marginBottom: 8,
  },
  heartsLarge: { fontSize: 22, letterSpacing: 6, marginBottom: 14 },
  factBox: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 10,
  },
  factLabel: { fontSize: 13, fontWeight: '800', color: C.UI_PRIMARY, marginBottom: 4 },
  factText: { fontSize: 14, color: C.TEXT_DARK, lineHeight: 20 },
  quoteBox: { marginBottom: 16, paddingHorizontal: 8 },
  quoteText: { fontSize: 14, color: C.TEXT_MID, fontStyle: 'italic', textAlign: 'center' },
  closeBtn: { alignSelf: 'stretch' },
});
