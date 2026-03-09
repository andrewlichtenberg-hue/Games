import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LilaCharacter } from '../components/LilaCharacter';
import { AnimalSprite } from '../components/AnimalSprite';
import { XPBar } from '../components/XPBar';
import { LevelUpModal } from '../components/LevelUpModal';
import { BigButton } from '../components/ui/BigButton';
import { C } from '../utils/colors';
import { useGameStore } from '../store/gameStore';
import { getAnimalById } from '../game/animals';
import { getItemById } from '../game/items';
import { audioManager } from '../audio/audioManager';
import type { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Home'> };

function NavCard({
  emoji,
  label,
  sublabel,
  color,
  onPress,
}: {
  emoji: string;
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.navCard, { borderColor: color }]}
      activeOpacity={0.82}
    >
      <Text style={styles.navEmoji}>{emoji}</Text>
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
      <Text style={styles.navSublabel}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }: Props) {
  const {
    playerName,
    hairColor,
    skinTone,
    outfitColor,
    level,
    xp,
    equippedHat,
    equippedOutfit,
    companionAnimals,
    discoveredAnimals,
    pendingLevelUp,
    clearPendingLevelUp,
    dailyStreak,
    checkDailyStreak,
  } = useGameStore();

  useFocusEffect(
    React.useCallback(() => {
      audioManager.playMusic('theme');
      checkDailyStreak();
    }, [])
  );

  // Apply the equipped outfit's color (or 'rainbow') to the character
  const activeOutfitColor = equippedOutfit
    ? (getItemById(equippedOutfit)?.color ?? outfitColor)
    : outfitColor;

  return (
    <>
      <LinearGradient colors={['#E8F5E9', '#FFF9C4', '#FFF3E0']} style={styles.flex}>
          {/* Header */}
          <LinearGradient
            colors={['#6C5CE7', '#A29BFE']}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Hi, {playerName}! 👋</Text>
                <Text style={styles.headerSub}>Ready to explore today?</Text>
              </View>
              {/* Mini character */}
              <LilaCharacter
                hairColor={hairColor}
                skinTone={skinTone}
                outfitColor={activeOutfitColor}
                equippedHat={equippedHat}
                size={80}
              />
            </View>
            <View style={styles.xpContainer}>
              <XPBar xp={xp} level={level} />
            </View>
          </LinearGradient>

          {/* Companion room */}
          <View style={styles.roomSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>🏡 {playerName}'s Room</Text>
              {dailyStreak > 1 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 Day {dailyStreak}</Text>
                </View>
              )}
              <Text style={styles.roomTapHint}>Tap to enter →</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Room');
              }}
              activeOpacity={0.88}
              style={styles.room}
            >
              <LinearGradient
                colors={['#FFF3E0', '#FFF9C4']}
                style={styles.roomGradient}
              >
                {/* Floor */}
                <View style={styles.roomFloor} />

                {/* Lila standing in room */}
                <View style={styles.lilaInRoom}>
                  <LilaCharacter
                    hairColor={hairColor}
                    skinTone={skinTone}
                    outfitColor={activeOutfitColor}
                    equippedHat={equippedHat}
                    size={100}
                  />
                </View>

                {/* Companion animals — horizontal scroll, no cap */}
                {companionAnimals.length > 0 ? (
                  <View style={styles.companionScroll}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.companionInner}
                    >
                      {companionAnimals.map((id) => {
                        const animal = getAnimalById(id);
                        if (!animal) return null;
                        return (
                          <View key={id} style={styles.companionItem}>
                            <AnimalSprite
                              type={animal.type}
                              size={44}
                              bodyColor={animal.bodyColor}
                              accentColor={animal.accentColor}
                            />
                            <Text style={styles.companionName}>
                              {animal.name.split(' ')[0]}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.noCompanions}>
                    Go explore to find animal friends! 🌿
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statNum}>{discoveredAnimals.length}</Text>
              <Text style={styles.statLabel}>Animals Found</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statChip}>
              <Text style={styles.statNum}>{companionAnimals.length}</Text>
              <Text style={styles.statLabel}>Companions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statChip}>
              <Text style={styles.statNum}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>

          {/* Main nav */}
          <View style={styles.navGrid}>
            <NavCard
              emoji="🗺️"
              label="Explore!"
              sublabel="Find new places & animals"
              color="#6C5CE7"
              onPress={() => navigation.navigate('WorldMap')}
            />
            <NavCard
              emoji="📓"
              label="Journal"
              sublabel={`${discoveredAnimals.length} animals discovered`}
              color="#00B894"
              onPress={() => navigation.navigate('Journal')}
            />
            <NavCard
              emoji="👗"
              label="Wardrobe"
              sublabel="Dress up your explorer"
              color="#E17055"
              onPress={() => navigation.navigate('Wardrobe')}
            />
            <NavCard
              emoji="📖"
              label="Stickers"
              sublabel="Place & collect stickers"
              color="#7B1FA2"
              onPress={() => navigation.navigate('StickerBook')}
            />
          </View>

          {/* Big explore button */}
          <BigButton
            label="Go on an Adventure!"
            emoji="🌿"
            onPress={() => navigation.navigate('WorldMap')}
            color="purple"
            size="large"
            style={styles.bigExplore}
          />
      </LinearGradient>

      {/* Level-up modal */}
      <LevelUpModal
        visible={pendingLevelUp !== null}
        level={pendingLevelUp ?? 1}
        onClose={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clearPendingLevelUp();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 2,
  },
  xpContainer: {
    marginTop: 2,
  },
  roomSection: {
    flex: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    minHeight: 120,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.TEXT_DARK,
  },
  streakBadge: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E3F00',
  },
  roomTapHint: {
    marginLeft: 'auto',
    fontSize: 12,
    color: C.UI_PRIMARY,
    fontWeight: '700',
  },
  room: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  roomGradient: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  roomFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#D4B483',
    borderTopWidth: 3,
    borderTopColor: '#B8935A',
  },
  lilaInRoom: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  // Companions: horizontal scroll at bottom-left, leaves room for Lila
  companionScroll: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 130, // leave room for Lila (size 100 + 24 margin + 6 extra)
  },
  companionInner: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  companionItem: {
    alignItems: 'center',
  },
  companionName: {
    fontSize: 9,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 2,
  },
  noCompanions: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    fontSize: 13,
    color: C.TEXT_MID,
    fontStyle: 'italic',
    maxWidth: 180,
  },
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
  statChip: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 26,
    fontWeight: '900',
    color: C.UI_PRIMARY,
  },
  statLabel: {
    fontSize: 11,
    color: C.TEXT_MID,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#EEE',
    marginVertical: 4,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 10,
  },
  navCard: {
    flex: 1,
    minWidth: (width - 52) / 3,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  navEmoji: {
    fontSize: 30,
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  navSublabel: {
    fontSize: 10,
    color: C.TEXT_LIGHT,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  bigExplore: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
  },
});
