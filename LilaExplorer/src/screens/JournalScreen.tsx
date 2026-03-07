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
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { AnimalSprite } from '../components/AnimalSprite';
import { BigButton } from '../components/ui/BigButton';
import { C } from '../utils/colors';
import { ANIMALS, Animal } from '../game/animals';
import { useGameStore } from '../store/gameStore';
import type { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 3;

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Journal'> };

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
            {Array.from({ length: 5 }, (_, i) => (
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

const RARITY_COLORS = {
  common: '#90A4AE',
  rare: '#7986CB',
  legendary: '#FFD700',
};

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
  const hearts = Array.from({ length: 5 }, (_, i) =>
    i < friendshipLevel ? '❤️' : '🤍'
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <LinearGradient
            colors={['#E8F5E9', '#F3E5F5']}
            style={styles.modalGradient}
          >
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
            <Text style={styles.heartsLarge}>{hearts.join(' ')}</Text>
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

export function JournalScreen({ navigation }: Props) {
  const { discoveredAnimals, companionAnimals, animalFriendship } = useGameStore();
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'discovered' | 'companions'>('all');

  const filteredAnimals = ANIMALS.filter((a) => {
    if (filterTab === 'discovered') return discoveredAnimals.includes(a.id);
    if (filterTab === 'companions') return companionAnimals.includes(a.id);
    return true;
  });

  const discoveredCount = discoveredAnimals.length;
  const totalCount = ANIMALS.length;

  return (
    <>
      <LinearGradient colors={['#E8F5E9', '#FFF9C4']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
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

        {/* Filter tabs */}
        <View style={styles.tabs}>
          {(['all', 'discovered', 'companions'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, filterTab === tab && styles.tabActive]}
              onPress={() => setFilterTab(tab)}
            >
              <Text style={[styles.tabText, filterTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? `All (${totalCount})` :
                 tab === 'discovered' ? `Found (${discoveredCount})` :
                 `Friends (${companionAnimals.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {filteredAnimals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              discovered={discoveredAnimals.includes(animal.id)}
              isCompanion={companionAnimals.includes(animal.id)}
              friendshipLevel={animalFriendship[animal.id] ?? 0}
              onPress={() => {
                if (discoveredAnimals.includes(animal.id)) {
                  setSelectedAnimal(animal);
                }
              }}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>

      {/* Detail modal */}
      <AnimalDetailModal
        animal={selectedAnimal}
        friendshipLevel={animalFriendship[selectedAnimal?.id ?? ''] ?? 0}
        isCompanion={companionAnimals.includes(selectedAnimal?.id ?? '')}
        visible={selectedAnimal !== null}
        onClose={() => setSelectedAnimal(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: { marginBottom: 4 },
  backText: { fontSize: 15, fontWeight: '700', color: C.TEXT_MID },
  title: { fontSize: 26, fontWeight: '900', color: C.TEXT_DARK },
  progressBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientBar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#EEE',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.TEXT_MID,
  },
  tabTextActive: {
    color: C.UI_PRIMARY,
  },
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
  cardLocked: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  cardName: {
    fontSize: 11,
    fontWeight: '800',
    color: C.TEXT_DARK,
    textAlign: 'center',
    marginTop: 4,
  },
  companionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 14,
  },
  heartsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  heartTiny: {
    fontSize: 8,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    left: 8,
  },
  lockEmoji: { fontSize: 32, marginTop: 8 },
  lockedText: {
    fontSize: 12,
    color: C.TEXT_LIGHT,
    fontWeight: '700',
    marginTop: 4,
  },
  // Modal
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
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modalName: {
    fontSize: 22,
    fontWeight: '900',
    color: C.TEXT_DARK,
    marginTop: 8,
  },
  modalRarity: {
    fontSize: 14,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 4,
    marginBottom: 8,
  },
  heartsLarge: {
    fontSize: 18,
    letterSpacing: 4,
    marginBottom: 14,
  },
  factBox: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 10,
  },
  factLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.UI_PRIMARY,
    marginBottom: 4,
  },
  factText: {
    fontSize: 14,
    color: C.TEXT_DARK,
    lineHeight: 20,
  },
  quoteBox: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  quoteText: {
    fontSize: 14,
    color: C.TEXT_MID,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  closeBtn: {
    alignSelf: 'stretch',
  },
});
