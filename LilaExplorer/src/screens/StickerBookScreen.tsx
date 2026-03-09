import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../utils/colors';
import { useGameStore, StickerPlacement } from '../store/gameStore';
import {
  STICKERS,
  STICKER_BOOK_PAGES,
  NUM_STICKER_BOOK_PAGES,
  getStickerById,
  isCompanionSticker,
  animalIdFromSticker,
} from '../game/stickers';
import { getAnimalById } from '../game/animals';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');
const PAGE_H = Math.min(420, height * 0.52);
const TRAY_H = 160;

type Props = { navigation: StackNavigationProp<RootStackParamList, 'StickerBook'> };

// ── helpers ──────────────────────────────────────────────────────────────────

function stickerEmoji(stickerId: string): string {
  if (isCompanionSticker(stickerId)) {
    const a = getAnimalById(animalIdFromSticker(stickerId));
    return a?.emoji ?? '🐾';
  }
  return getStickerById(stickerId)?.emoji ?? '⭐';
}

function stickerName(stickerId: string): string {
  if (isCompanionSticker(stickerId)) {
    const a = getAnimalById(animalIdFromSticker(stickerId));
    return a ? a.name.split(' ')[0] : 'Pal';
  }
  return getStickerById(stickerId)?.name ?? 'Sticker';
}

function stickerRarityColor(stickerId: string): string {
  if (isCompanionSticker(stickerId)) return '#7B1FA2';
  const r = getStickerById(stickerId)?.rarity ?? 'common';
  return { common: '#546E7A', rare: '#7B1FA2', legendary: '#E65100' }[r] ?? '#546E7A';
}

function randRotation() { return (Math.random() * 36 - 18); }
function randScale()    { return 0.85 + Math.random() * 0.5; }

let nextInstanceId = Date.now();
function makeInstanceId() { return `inst-${nextInstanceId++}`; }

// ── component ─────────────────────────────────────────────────────────────────

export function StickerBookScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    ownedStickers, stickerBookPages,
    placeStickerOnPage, removeStickerFromPage,
  } = useGameStore();

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const pageAnim = useRef(new Animated.Value(0)).current;

  const page = STICKER_BOOK_PAGES[pageIndex];
  const placedOnPage = stickerBookPages[pageIndex] ?? [];

  // All unplaced stickers (including duplicates shown once with count)
  const trayEntries = Object.entries(ownedStickers).filter(([, count]) => count > 0);

  // ── Page ref for measuring taps ───────────────────────────────
  const pageRef = useRef<View>(null);
  const [pageLayout, setPageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handlePagePress = (evt: any) => {
    if (!selectedStickerId) return;
    const { locationX, locationY } = evt.nativeEvent;
    const xPct = Math.max(0.04, Math.min(0.96, locationX / pageLayout.width));
    const yPct = Math.max(0.04, Math.min(0.93, locationY / pageLayout.height));

    const placement: StickerPlacement = {
      instanceId: makeInstanceId(),
      stickerId: selectedStickerId,
      xPct,
      yPct,
      rotation: randRotation(),
      scale: randScale(),
    };

    placeStickerOnPage(pageIndex, placement);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Deselect if count drops to zero after this placement
    const newCount = (ownedStickers[selectedStickerId] ?? 1) - 1;
    if (newCount <= 0) setSelectedStickerId(null);
  };

  const handlePlacedStickerPress = (inst: StickerPlacement) => {
    removeStickerFromPage(pageIndex, inst.instanceId, inst.stickerId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animatePage = (dir: 1 | -1) => {
    Animated.sequence([
      Animated.timing(pageAnim, { toValue: dir * 60, duration: 130, useNativeDriver: true }),
      Animated.timing(pageAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const goPage = (dir: 1 | -1) => {
    const next = pageIndex + dir;
    if (next < 0 || next >= NUM_STICKER_BOOK_PAGES) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animatePage((-dir) as 1 | -1);
    setPageIndex(next);
    setSelectedStickerId(null);
  };

  const totalStickers = Object.values(ownedStickers).reduce((a, b) => a + b, 0)
    + stickerBookPages.reduce((a, p) => a + p.length, 0);

  return (
    <LinearGradient colors={['#1A237E', '#311B92', '#4A148C']} style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>📖 Sticker Book</Text>
          <Text style={styles.headerSub}>{totalStickers} stickers collected</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.trayCount}>{trayEntries.length > 0 ? `🎁 ${trayEntries.reduce((a,[,c])=>a+c,0)} ready` : '📖'}</Text>
        </View>
      </View>

      {/* Page navigator */}
      <View style={styles.pageNav}>
        <TouchableOpacity onPress={() => goPage(-1)} style={[styles.navArrow, pageIndex === 0 && styles.navArrowDisabled]} disabled={pageIndex === 0}>
          <Text style={styles.navArrowText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.pageIndicatorRow}>
          {STICKER_BOOK_PAGES.map((p, i) => (
            <TouchableOpacity key={p.id} onPress={() => { setPageIndex(i); setSelectedStickerId(null); }}>
              <View style={[styles.pageDot, i === pageIndex && styles.pageDotActive]}>
                <Text style={styles.pageDotEmoji}>{p.emoji}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => goPage(1)} style={[styles.navArrow, pageIndex === NUM_STICKER_BOOK_PAGES - 1 && styles.navArrowDisabled]} disabled={pageIndex === NUM_STICKER_BOOK_PAGES - 1}>
          <Text style={styles.navArrowText}>▶</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.pageLabel}>{page.name}</Text>

      {/* Sticker page canvas */}
      <Animated.View style={{ transform: [{ translateX: pageAnim }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePagePress}
          style={styles.pageCanvas}
        >
          <View
            ref={pageRef}
            style={styles.pageCanvas}
            onLayout={(evt) => setPageLayout(evt.nativeEvent.layout)}
          >
            <LinearGradient
              colors={page.skyColors}
              style={StyleSheet.absoluteFill}
            />
            {/* Ground strip */}
            <View style={[styles.groundStrip, { backgroundColor: page.groundColor }]} />
            {/* Decorative emojis */}
            <Text style={styles.decoLeft}>{page.accentDeco[0]}</Text>
            <Text style={styles.decoRight}>{page.accentDeco[page.accentDeco.length - 1]}</Text>

            {/* Placed stickers */}
            {placedOnPage.map((inst) => (
              <TouchableOpacity
                key={inst.instanceId}
                onPress={() => handlePlacedStickerPress(inst)}
                style={[
                  styles.placedSticker,
                  {
                    left:  inst.xPct * (pageLayout.width  || width - 32) - 22,
                    top:   inst.yPct * (pageLayout.height || PAGE_H)     - 22,
                    transform: [
                      { rotate: `${inst.rotation}deg` },
                      { scale: inst.scale },
                    ],
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.placedStickerEmoji}>{stickerEmoji(inst.stickerId)}</Text>
              </TouchableOpacity>
            ))}

            {/* Placement hint */}
            {selectedStickerId && (
              <View style={styles.placementHint}>
                <Text style={styles.placementHintText}>Tap anywhere to place {stickerEmoji(selectedStickerId)}</Text>
              </View>
            )}
            {!selectedStickerId && trayEntries.length > 0 && placedOnPage.length === 0 && (
              <View style={styles.emptyPageHint}>
                <Text style={styles.emptyPageHintText}>Pick a sticker below, then tap here to place it!</Text>
              </View>
            )}
            {!selectedStickerId && trayEntries.length === 0 && (
              <View style={styles.emptyPageHint}>
                <Text style={styles.emptyPageHintText}>Solve puzzles with your companion animals to earn stickers! 🧩</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Sticker tray */}
      <View style={styles.tray}>
        <Text style={styles.trayTitle}>
          {selectedStickerId
            ? `Selected: ${stickerName(selectedStickerId)} — tap page to place`
            : 'Your Stickers — tap to select'}
        </Text>
        {trayEntries.length === 0 ? (
          <View style={styles.trayEmpty}>
            <Text style={styles.trayEmptyText}>
              No stickers yet! Ask your companions for puzzles 🧩
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trayScroll}
          >
            {trayEntries.map(([stickerId, count]) => {
              const selected = selectedStickerId === stickerId;
              return (
                <TouchableOpacity
                  key={stickerId}
                  style={[styles.trayItem, selected && styles.trayItemSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedStickerId(selected ? null : stickerId);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.trayItemEmoji}>{stickerEmoji(stickerId)}</Text>
                  <Text style={[styles.trayItemName, { color: stickerRarityColor(stickerId) }]}>{stickerName(stickerId)}</Text>
                  {count > 1 && <View style={styles.countBadge}><Text style={styles.countBadgeText}>×{count}</Text></View>}
                  {selected && <View style={styles.selectedDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 1 },
  headerRight: { width: 80, alignItems: 'flex-end' },
  trayCount: { fontSize: 12, fontWeight: '700', color: '#FCD34D' },

  // Page nav
  pageNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 10 },
  navArrow: { padding: 8 },
  navArrowDisabled: { opacity: 0.25 },
  navArrowText: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  pageIndicatorRow: { flexDirection: 'row', gap: 6 },
  pageDot: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  pageDotActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: '#FCD34D',
    borderWidth: 2.5,
  },
  pageDotEmoji: { fontSize: 16 },
  pageLabel: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginBottom: 6 },

  // Page canvas
  pageCanvas: {
    width: width - 32,
    height: PAGE_H,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#FCD34D',
  },
  groundStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PAGE_H * 0.22,
    borderTopWidth: 3,
    borderTopColor: 'rgba(0,0,0,0.15)',
  },
  decoLeft:  { position: 'absolute', bottom: PAGE_H * 0.22 - 2, left: 10,  fontSize: 28, opacity: 0.45 },
  decoRight: { position: 'absolute', bottom: PAGE_H * 0.22 - 2, right: 10, fontSize: 28, opacity: 0.45 },
  placedSticker: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placedStickerEmoji: { fontSize: 38, lineHeight: 44, textAlign: 'center' },
  placementHint: {
    position: 'absolute',
    bottom: PAGE_H * 0.22 + 8,
    left: 0, right: 0,
    alignItems: 'center',
  },
  placementHintText: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: '#FFFFFF',
    fontSize: 13, fontWeight: '700',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6,
  },
  emptyPageHint: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyPageHintText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14, fontWeight: '600', textAlign: 'center',
    paddingHorizontal: 28, lineHeight: 20,
  },

  // Tray
  tray: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  trayTitle: {
    fontSize: 12, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    textAlign: 'center',
  },
  trayEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  trayEmptyText: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  trayScroll: { flexDirection: 'row', gap: 10, paddingBottom: 8, paddingHorizontal: 4 },
  trayItem: {
    width: 70, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  trayItemSelected: {
    backgroundColor: 'rgba(252,211,77,0.25)',
    borderColor: '#FCD34D',
    borderWidth: 2.5,
  },
  trayItemEmoji: { fontSize: 30, marginBottom: 4 },
  trayItemName: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  countBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#E91E63',
    borderRadius: 9, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  countBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
  selectedDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FCD34D',
    marginTop: 4,
  },
});
