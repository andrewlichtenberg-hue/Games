import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { LilaCharacter } from '../components/LilaCharacter';
import { BigButton } from '../components/ui/BigButton';
import { C } from '../utils/colors';
import { ITEMS, GameItem, SlotType } from '../game/items';
import { useGameStore } from '../store/gameStore';
import type { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');
const ITEM_W = (width - 52) / 3;

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Wardrobe'> };

type TabType = 'hat' | 'outfit' | 'accessory' | 'powerup';
const TABS: { key: TabType; label: string; emoji: string }[] = [
  { key: 'hat', label: 'Hats', emoji: '👒' },
  { key: 'outfit', label: 'Outfits', emoji: '👗' },
  { key: 'accessory', label: 'Extras', emoji: '🎒' },
  { key: 'powerup', label: 'Powers', emoji: '⚡' },
];

function ItemTile({
  item,
  owned,
  equipped,
  onPress,
}: {
  item: GameItem;
  owned: boolean;
  equipped: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tile,
        !owned && styles.tileLocked,
        equipped && styles.tileEquipped,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={owned ? 0.8 : 1}
    >
      <Text style={styles.tileEmoji}>{item.emoji}</Text>
      <Text style={[styles.tileName, !owned && { color: C.TEXT_LIGHT }]} numberOfLines={2}>
        {item.name}
      </Text>
      {equipped && (
        <View style={styles.equippedBadge}>
          <Text style={styles.equippedBadgeText}>On! ✓</Text>
        </View>
      )}
      {!owned && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>Lv {item.unlocksAtLevel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function WardrobeScreen({ navigation }: Props) {
  const {
    hairColor, skinTone, outfitColor,
    equippedHat, equippedOutfit, equippedAccessory,
    ownedItems, ownedPowerups,
    equipItem, unequipItem,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabType>('hat');
  const [previewHat, setPreviewHat] = useState(equippedHat);

  const filteredItems = ITEMS.filter((i) => i.type === activeTab);

  const isEquipped = (item: GameItem): boolean => {
    if (item.type === 'hat') return equippedHat === item.id;
    if (item.type === 'outfit') return equippedOutfit === item.id;
    if (item.type === 'accessory') return equippedAccessory === item.id;
    return ownedPowerups.includes(item.id);
  };

  const isOwned = (item: GameItem): boolean => {
    if (item.type === 'powerup') return ownedPowerups.includes(item.id);
    return ownedItems.includes(item.id);
  };

  const handleItemPress = (item: GameItem) => {
    if (!isOwned(item)) return;
    if (item.type === 'powerup') return; // powerups are auto-used

    const slot = item.slot as SlotType;
    if (isEquipped(item)) {
      unequipItem(slot);
      if (slot === 'hat') setPreviewHat(null);
    } else {
      equipItem(item.id, slot);
      if (slot === 'hat') setPreviewHat(item.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    audioSfx('pop');
  };

  // Get current outfit for preview
  const previewOutfit = equippedOutfit
    ? ITEMS.find((i) => i.id === equippedOutfit)?.color ?? outfitColor
    : outfitColor;

  return (
    <LinearGradient colors={['#FFF3E0', '#FCE4EC']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👗 Wardrobe</Text>
        <Text style={styles.subtitle}>Dress up your explorer!</Text>
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <LinearGradient colors={['#E8EAF6', '#FFF9C4']} style={styles.previewGradient}>
          <LilaCharacter
            hairColor={hairColor}
            skinTone={skinTone}
            outfitColor={previewOutfit}
            equippedHat={previewHat}
            size={130}
          />
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.key);
            }}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item) => (
          <ItemTile
            key={item.id}
            item={item}
            owned={isOwned(item)}
            equipped={isEquipped(item)}
            onPress={() => handleItemPress(item)}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function audioSfx(_name: string) {
  // stub — wire to audioManager
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
  subtitle: { fontSize: 13, color: C.TEXT_MID, fontWeight: '600', marginTop: 2 },
  preview: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    height: 160,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  previewGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 6,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabEmoji: { fontSize: 20 },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 2,
  },
  tabLabelActive: { color: C.UI_PRIMARY },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  tile: {
    width: ITEM_W,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
    minHeight: 90,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  tileLocked: {
    backgroundColor: '#F5F5F5',
    opacity: 0.65,
  },
  tileEquipped: {
    borderColor: C.UI_PRIMARY,
    backgroundColor: '#FFF0F6',
  },
  tileEmoji: { fontSize: 32, marginBottom: 4 },
  tileName: {
    fontSize: 11,
    fontWeight: '700',
    color: C.TEXT_DARK,
    textAlign: 'center',
  },
  equippedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: C.UI_PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  equippedBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '800',
  },
  lockedOverlay: {
    marginTop: 4,
    backgroundColor: '#EEE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.TEXT_MID,
  },
});
