import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { LilaCharacter } from '../components/LilaCharacter';
import { C } from '../utils/colors';
import { ITEMS, GameItem, SlotType } from '../game/items';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../audio/audioManager';
import type { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');
const ITEM_W = (width - 52) / 3;

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Wardrobe'> };

type TabType = 'hat' | 'outfit' | 'accessory' | 'powerup' | 'furniture';
const TABS: { key: TabType; label: string; emoji: string }[] = [
  { key: 'hat', label: 'Hats', emoji: '👒' },
  { key: 'outfit', label: 'Outfits', emoji: '👗' },
  { key: 'accessory', label: 'Extras', emoji: '🎒' },
  { key: 'powerup', label: 'Powers', emoji: '⚡' },
  { key: 'furniture', label: 'Room', emoji: '🏡' },
];

function ItemTile({
  item,
  owned,
  equipped,
  equippedLabel,
  onPress,
}: {
  item: GameItem;
  owned: boolean;
  equipped: boolean;
  equippedLabel?: string;
  onPress: () => void;
}) {
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (owned) {
      sparkleAnim.setValue(0);
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        !owned && styles.tileLocked,
        equipped && styles.tileEquipped,
      ]}
      onPress={handlePress}
      activeOpacity={owned ? 0.8 : 1}
    >
      <Text style={styles.tileEmoji}>{item.emoji}</Text>
      <Text style={[styles.tileName, !owned && { color: C.TEXT_LIGHT }]} numberOfLines={2}>
        {item.name}
      </Text>
      {equipped && (
        <View style={styles.equippedBadge}>
          <Text style={styles.equippedBadgeText}>{equippedLabel ?? 'On! ✓'}</Text>
        </View>
      )}
      {!owned && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>Lv {item.unlocksAtLevel}</Text>
        </View>
      )}
      {/* Sparkle on tap */}
      <Animated.Text
        style={[
          styles.sparkle,
          {
            opacity: sparkleAnim,
            transform: [
              {
                scale: sparkleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.6, 0.5],
                }),
              },
            ],
          },
        ]}
      >
        ✨
      </Animated.Text>
    </TouchableOpacity>
  );
}

export function WardrobeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    hairColor, skinTone, outfitColor,
    equippedHat, equippedOutfit, equippedAccessories,
    ownedItems, ownedPowerups, activePowerups, equippedFurniture,
    equipItem, unequipItem, toggleActivePowerup, toggleFurniture,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabType>('hat');
  const [previewHat, setPreviewHat] = useState(equippedHat);

  const filteredItems = ITEMS.filter((i) => i.type === activeTab);

  const isEquipped = (item: GameItem): boolean => {
    if (item.type === 'hat') return equippedHat === item.id;
    if (item.type === 'outfit') return equippedOutfit === item.id;
    if (item.type === 'accessory') return equippedAccessories.includes(item.id);
    if (item.type === 'powerup') return activePowerups.includes(item.id);
    if (item.type === 'furniture') return equippedFurniture.includes(item.id);
    return false;
  };

  const isOwned = (item: GameItem): boolean => {
    if (item.type === 'powerup') return ownedPowerups.includes(item.id);
    if (item.type === 'furniture') return ownedItems.includes(item.id);
    return ownedItems.includes(item.id);
  };

  const getEquippedLabel = (item: GameItem): string => {
    if (item.type === 'powerup') return '⚡ Active';
    if (item.type === 'furniture') return '🏡 Placed';
    return 'On! ✓';
  };

  const handleItemPress = (item: GameItem) => {
    if (!isOwned(item)) return;

    if (item.type === 'powerup') {
      toggleActivePowerup(item.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      audioManager.playSfx('pop');
      return;
    }

    if (item.type === 'furniture') {
      toggleFurniture(item.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      audioManager.playSfx('pop');
      return;
    }

    if (item.type === 'accessory') {
      // equipItem handles toggle (add if not equipped, remove if already equipped)
      equipItem(item.id, 'accessory');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      audioManager.playSfx('pop');
      return;
    }

    const slot = item.slot as SlotType;
    if (isEquipped(item)) {
      unequipItem(slot);
      if (slot === 'hat') setPreviewHat(null);
    } else {
      equipItem(item.id, slot);
      if (slot === 'hat') setPreviewHat(item.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    audioManager.playSfx('pop');
  };

  // Get current outfit for preview
  const previewOutfit = equippedOutfit
    ? ITEMS.find((i) => i.id === equippedOutfit)?.color ?? outfitColor
    : outfitColor;

  // Status chips for powerup and furniture tabs
  const powerupStatusText = activePowerups.length === 0
    ? '⚡ No powers active — tap one to turn it on!'
    : `⚡ ${activePowerups.length} Power${activePowerups.length === 1 ? '' : 's'} Active — All can be on at once!`;
  const furnitureStatusText = `🏡 ${equippedFurniture.length}/5 Items in Room`;

  return (
    <LinearGradient colors={['#FFF3E0', '#FCE4EC']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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

      {/* Status chip for powerup/furniture tabs */}
      {(activeTab === 'powerup' || activeTab === 'furniture') && (
        <View style={styles.statusChipRow}>
          <View style={[styles.statusChip, { backgroundColor: activeTab === 'powerup' ? '#FFF8E1' : '#E8F5E9' }]}>
            <Text style={styles.statusChipText}>
              {activeTab === 'powerup' ? powerupStatusText : furnitureStatusText}
            </Text>
          </View>
          {activeTab === 'powerup' && (
            <Text style={styles.statusHint}>Tap to activate or deactivate</Text>
          )}
          {activeTab === 'furniture' && (
            <Text style={styles.statusHint}>Tap to add or remove from your room</Text>
          )}
        </View>
      )}

      {/* Accessory hint */}
      {activeTab === 'accessory' && (
        <View style={styles.statusChipRow}>
          <View style={[styles.statusChip, { backgroundColor: '#EDE7F6' }]}>
            <Text style={styles.statusChipText}>
              🎒 {equippedAccessories.length}/2 Extras Equipped
            </Text>
          </View>
          <Text style={styles.statusHint}>Equip up to 2 at once!</Text>
        </View>
      )}

      {/* Items grid */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item) => (
          <ItemTile
            key={item.id}
            item={item}
            owned={isOwned(item)}
            equipped={isEquipped(item)}
            equippedLabel={getEquippedLabel(item)}
            onPress={() => handleItemPress(item)}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
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
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 5,
    gap: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabEmoji: { fontSize: 18 },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.TEXT_MID,
    marginTop: 2,
  },
  tabLabelActive: { color: C.UI_PRIMARY },
  statusChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  statusChip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.TEXT_DARK,
  },
  statusHint: {
    fontSize: 11,
    color: C.TEXT_LIGHT,
    fontWeight: '600',
    flex: 1,
  },
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
  sparkle: {
    position: 'absolute',
    fontSize: 22,
    top: '30%',
    left: '30%',
    pointerEvents: 'none',
  },
});
