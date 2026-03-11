import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore, StickerPlacement } from '../store/gameStore';
import {
  STICKER_BOOK_PAGES,
  NUM_STICKER_BOOK_PAGES,
  getStickerById,
  isCompanionSticker,
  animalIdFromSticker,
} from '../game/stickers';
import { getAnimalById } from '../game/animals';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');
const PAGE_H = Math.min(480, height * 0.56);
const EMOJI_BASE = 40; // base font size for stickers

type Props = { navigation: StackNavigationProp<RootStackParamList, 'StickerBook'> };
type StickerSize = 'S' | 'M' | 'L';

const SIZE_SCALE: Record<StickerSize, number> = { S: 0.62, M: 1.0, L: 1.55 };

// ── helpers ───────────────────────────────────────────────────────────────────

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

function rarityColor(stickerId: string): string {
  if (isCompanionSticker(stickerId)) return '#E040FB';
  const r = getStickerById(stickerId)?.rarity ?? 'common';
  return { common: '#90A4AE', rare: '#CE93D8', legendary: '#FFAB40' }[r] ?? '#90A4AE';
}

function randRotation() { return Math.random() * 30 - 15; }

let _nextId = Date.now();
function makeInstanceId() { return `inst-${_nextId++}`; }

// ── component ─────────────────────────────────────────────────────────────────

export function StickerBookScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    ownedStickers, stickerBookPages,
    placeStickerOnPage, removeStickerFromPage, moveStickerOnPage,
  } = useGameStore();

  const [pageIndex, setPageIndex]               = useState(0);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [stickerSize, setStickerSize]            = useState<StickerSize>('M');
  const [previewPos, setPreviewPos]              = useState<{ x: number; y: number } | null>(null);
  const [draggingInstId, setDraggingInstId]      = useState<string | null>(null);
  const [pageLayout, setPageLayout]              = useState({ width: 0, height: 0 });

  const pageAnim = useRef(new Animated.Value(0)).current;
  const page       = STICKER_BOOK_PAGES[pageIndex];
  const placedOnPage = stickerBookPages[pageIndex] ?? [];
  const trayEntries  = Object.entries(ownedStickers).filter(([, c]) => c > 0);
  const totalStickers = Object.values(ownedStickers).reduce((a, b) => a + b, 0)
    + stickerBookPages.reduce((a, p) => a + p.length, 0);

  // ── Ref snapshot so PanResponder (created once) always reads fresh state ──
  const S = useRef({
    selectedStickerId,
    stickerSize,
    pageLayout,
    placedOnPage,
    ownedStickers,
    pageIndex,
    placeStickerOnPage,
    removeStickerFromPage,
    moveStickerOnPage,
    setPreviewPos,
    setDraggingInstId,
    setSelectedStickerId,
  });
  S.current = {
    selectedStickerId, stickerSize, pageLayout, placedOnPage, ownedStickers,
    pageIndex, placeStickerOnPage, removeStickerFromPage, moveStickerOnPage,
    setPreviewPos, setDraggingInstId, setSelectedStickerId,
  };

  // PanResponder internal mutable refs
  const panMode      = useRef<'place' | 'reposition' | 'none'>('none');
  const panTarget    = useRef<StickerPlacement | null>(null);
  const panStart     = useRef({ x: 0, y: 0 });
  const panMoved     = useRef(false);
  const longTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Page canvas PanResponder ──────────────────────────────────────────────
  const pagePan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,

    onPanResponderGrant: (e) => {
      const s = S.current;
      const pw = s.pageLayout.width  || (width - 32);
      const ph = s.pageLayout.height || PAGE_H;
      const { locationX: lx, locationY: ly } = e.nativeEvent;
      const txPct = lx / pw;
      const tyPct = ly / ph;

      // Find closest placed sticker within hit radius (32px)
      let best: StickerPlacement | null = null;
      let bestDist = Infinity;
      for (const inst of s.placedOnPage) {
        const dx = (inst.xPct - txPct) * pw;
        const dy = (inst.yPct - tyPct) * ph;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 32 && d < bestDist) { best = inst; bestDist = d; }
      }

      if (best) {
        panMode.current   = 'reposition';
        panTarget.current = best;
        panStart.current  = { x: best.xPct, y: best.yPct };
        panMoved.current  = false;
        s.setDraggingInstId(best.instanceId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Long-press (500 ms without moving) → remove sticker
        longTimer.current = setTimeout(() => {
          if (!panMoved.current && panTarget.current) {
            const t = panTarget.current;
            S.current.removeStickerFromPage(S.current.pageIndex, t.instanceId, t.stickerId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            S.current.setDraggingInstId(null);
            panMode.current   = 'none';
            panTarget.current = null;
          }
        }, 500);

      } else if (s.selectedStickerId) {
        panMode.current = 'place';
        s.setPreviewPos({ x: lx, y: ly });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        panMode.current = 'none';
      }
    },

    onPanResponderMove: (e, gs) => {
      const s  = S.current;
      const pw = s.pageLayout.width  || (width - 32);
      const ph = s.pageLayout.height || PAGE_H;
      const { locationX: lx, locationY: ly } = e.nativeEvent;

      if (panMode.current === 'place') {
        s.setPreviewPos({ x: lx, y: ly });

      } else if (panMode.current === 'reposition' && panTarget.current) {
        if (!panMoved.current && (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5)) {
          panMoved.current = true;
          if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; }
        }
        if (panMoved.current) {
          const xPct = Math.max(0.03, Math.min(0.97, panStart.current.x + gs.dx / pw));
          const yPct = Math.max(0.03, Math.min(0.97, panStart.current.y + gs.dy / ph));
          s.moveStickerOnPage(s.pageIndex, panTarget.current.instanceId, xPct, yPct);
        }
      }
    },

    onPanResponderRelease: (e) => {
      if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; }
      const s  = S.current;
      const pw = s.pageLayout.width  || (width - 32);
      const ph = s.pageLayout.height || PAGE_H;
      const { locationX: lx, locationY: ly } = e.nativeEvent;

      if (panMode.current === 'place' && s.selectedStickerId) {
        const xPct = Math.max(0.03, Math.min(0.97, lx / pw));
        const yPct = Math.max(0.03, Math.min(0.97, ly / ph));
        s.placeStickerOnPage(s.pageIndex, {
          instanceId: makeInstanceId(),
          stickerId: s.selectedStickerId,
          xPct, yPct,
          rotation: randRotation(),
          scale: SIZE_SCALE[s.stickerSize],
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        s.setPreviewPos(null);
        const remaining = (s.ownedStickers[s.selectedStickerId] ?? 1) - 1;
        if (remaining <= 0) s.setSelectedStickerId(null);

      } else if (panMode.current === 'reposition') {
        s.setDraggingInstId(null);
      }

      panMode.current   = 'none';
      panTarget.current = null;
      panMoved.current  = false;
    },

    onPanResponderTerminate: () => {
      if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; }
      panMode.current   = 'none';
      panTarget.current = null;
      panMoved.current  = false;
      S.current.setPreviewPos(null);
      S.current.setDraggingInstId(null);
    },
  })).current;

  // ── Page navigation ───────────────────────────────────────────────────────
  const goPage = (dir: 1 | -1) => {
    const next = pageIndex + dir;
    if (next < 0 || next >= NUM_STICKER_BOOK_PAGES) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(pageAnim, { toValue: dir * -50, duration: 100, useNativeDriver: true }),
      Animated.timing(pageAnim, { toValue: 0,         duration: 160, useNativeDriver: true }),
    ]).start();
    setPageIndex(next);
    setSelectedStickerId(null);
    setPreviewPos(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#0D1B2A', '#1B2848', '#2D1B69']} style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>📖 Sticker Book</Text>
          <Text style={styles.headerSub}>{totalStickers} stickers collected</Text>
        </View>
        <View style={styles.headerRight}>
          {trayEntries.reduce((a, [, c]) => a + c, 0) > 0 && (
            <Text style={styles.readyBadge}>
              🎁 {trayEntries.reduce((a, [, c]) => a + c, 0)} ready
            </Text>
          )}
        </View>
      </View>

      {/* Page tabs */}
      <View style={styles.pageNav}>
        <TouchableOpacity
          onPress={() => goPage(-1)}
          disabled={pageIndex === 0}
          style={[styles.navArrow, pageIndex === 0 && styles.navArrowOff]}
        >
          <Text style={styles.navArrowText}>◀</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {STICKER_BOOK_PAGES.map((p, i) => {
            const placedCount = (stickerBookPages[i] ?? []).length;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => { setPageIndex(i); setSelectedStickerId(null); setPreviewPos(null); }}
                style={[styles.tab, i === pageIndex && styles.tabActive]}
              >
                <Text style={styles.tabEmoji}>{p.emoji}</Text>
                {i === pageIndex
                  ? <Text style={styles.tabLabelActive}>{p.name}</Text>
                  : placedCount > 0 && <Text style={styles.tabCount}>{placedCount}</Text>
                }
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={() => goPage(1)}
          disabled={pageIndex === NUM_STICKER_BOOK_PAGES - 1}
          style={[styles.navArrow, pageIndex === NUM_STICKER_BOOK_PAGES - 1 && styles.navArrowOff]}
        >
          <Text style={styles.navArrowText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Sticker page canvas */}
      <Animated.View style={{ transform: [{ translateX: pageAnim }] }}>
        <View
          style={styles.pageCanvas}
          onLayout={(e) => setPageLayout({
            width:  e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })}
          {...pagePan.panHandlers}
        >
          <LinearGradient colors={page.skyColors} style={StyleSheet.absoluteFill} />
          <View style={[styles.groundStrip, { backgroundColor: page.groundColor }]} />
          <Text style={styles.decoLeft}  pointerEvents="none">{page.accentDeco[0]}</Text>
          <Text style={styles.decoRight} pointerEvents="none">{page.accentDeco[page.accentDeco.length - 1]}</Text>

          {/* Placed stickers */}
          {placedOnPage.map((inst) => {
            const isDragging = inst.instanceId === draggingInstId;
            const fs = inst.scale * EMOJI_BASE;
            const half = fs / 2 + 2;
            return (
              <View
                key={inst.instanceId}
                pointerEvents="none"
                style={[
                  styles.placedSticker,
                  {
                    left:      inst.xPct * (pageLayout.width  || width - 32) - half,
                    top:       inst.yPct * (pageLayout.height || PAGE_H)     - half,
                    transform: [
                      { rotate: `${inst.rotation}deg` },
                      { scale: isDragging ? 1.25 : 1 },
                    ],
                    opacity:  isDragging ? 0.8 : 1,
                    zIndex:   isDragging ? 99  : 1,
                  },
                ]}
              >
                <Text style={[styles.placedEmoji, { fontSize: fs }]}>
                  {stickerEmoji(inst.stickerId)}
                </Text>
              </View>
            );
          })}

          {/* Ghost preview while dragging to place */}
          {previewPos && selectedStickerId && (
            <View
              pointerEvents="none"
              style={[
                styles.ghost,
                {
                  left: previewPos.x - (SIZE_SCALE[stickerSize] * EMOJI_BASE) / 2 - 2,
                  top:  previewPos.y - (SIZE_SCALE[stickerSize] * EMOJI_BASE) / 2 - 2,
                },
              ]}
            >
              <Text style={{ fontSize: SIZE_SCALE[stickerSize] * EMOJI_BASE }}>
                {stickerEmoji(selectedStickerId)}
              </Text>
            </View>
          )}

          {/* Contextual hints */}
          {selectedStickerId && !previewPos && (
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>
                Touch &amp; drag anywhere to place {stickerEmoji(selectedStickerId)}
              </Text>
            </View>
          )}
          {!selectedStickerId && !draggingInstId && trayEntries.length > 0 && placedOnPage.length === 0 && (
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>Pick a sticker below, then drag it onto the page!</Text>
            </View>
          )}
          {!selectedStickerId && !draggingInstId && trayEntries.length === 0 && placedOnPage.length === 0 && (
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>Solve puzzles with your companions to earn stickers! 🧩</Text>
            </View>
          )}
          {placedOnPage.length > 0 && !selectedStickerId && !draggingInstId && (
            <View style={styles.microHint} pointerEvents="none">
              <Text style={styles.microHintText}>Drag to move • Hold to remove</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Tray area */}
      <View style={styles.tray}>

        {/* Size picker + deselect */}
        <View style={styles.sizeRow}>
          <Text style={styles.sizeLabel}>Size</Text>
          {(['S', 'M', 'L'] as StickerSize[]).map((sz) => (
            <TouchableOpacity
              key={sz}
              style={[styles.sizeBtn, stickerSize === sz && styles.sizeBtnOn]}
              onPress={() => {
                setStickerSize(sz);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.sizeBtnText, stickerSize === sz && styles.sizeBtnTextOn]}>{sz}</Text>
            </TouchableOpacity>
          ))}
          {selectedStickerId && (
            <TouchableOpacity
              style={styles.deselectBtn}
              onPress={() => { setSelectedStickerId(null); setPreviewPos(null); }}
            >
              <Text style={styles.deselectText}>✕ Deselect</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.trayTitle}>
          {selectedStickerId
            ? `${stickerEmoji(selectedStickerId)} ${stickerName(selectedStickerId)} selected — drag onto page`
            : 'Your stickers — tap one to select it'}
        </Text>

        {trayEntries.length === 0 ? (
          <View style={styles.trayEmpty}>
            <Text style={styles.trayEmptyText}>
              No stickers yet!{'\n'}Ask your companions for puzzles 🧩
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trayScroll}
          >
            {trayEntries.map(([stickerId, count]) => {
              const sel = selectedStickerId === stickerId;
              return (
                <TouchableOpacity
                  key={stickerId}
                  style={[styles.trayItem, sel && styles.trayItemSel]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedStickerId(sel ? null : stickerId);
                    setPreviewPos(null);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.trayEmoji}>{stickerEmoji(stickerId)}</Text>
                  <Text style={[styles.trayName, { color: rarityColor(stickerId) }]}>
                    {stickerName(stickerId)}
                  </Text>
                  {count > 1 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>×{count}</Text>
                    </View>
                  )}
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  backBtn:       { paddingRight: 12, paddingVertical: 4 },
  backText:      { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  headerCenter:  { flex: 1, alignItems: 'center' },
  headerTitle:   { fontSize: 20, fontWeight: '900', color: '#FFF' },
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 1 },
  headerRight:   { width: 80, alignItems: 'flex-end' },
  readyBadge:    { fontSize: 11, fontWeight: '800', color: '#FCD34D' },

  // Page nav tabs
  pageNav:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6 },
  navArrow:    { padding: 8 },
  navArrowOff: { opacity: 0.2 },
  navArrowText: { fontSize: 18, color: '#FFF', fontWeight: '700' },
  tabRow:       { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  tabActive: {
    backgroundColor: 'rgba(252,211,77,0.18)',
    borderColor: '#FCD34D', borderWidth: 2,
  },
  tabEmoji:       { fontSize: 18 },
  tabLabelActive: { fontSize: 12, fontWeight: '700', color: '#FCD34D' },
  tabCount:       { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.55)' },

  // Page canvas
  pageCanvas: {
    width: width - 32, height: PAGE_H,
    marginHorizontal: 16, borderRadius: 20,
    overflow: 'hidden', position: 'relative',
    borderWidth: 3, borderColor: '#FCD34D',
  },
  groundStrip: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: PAGE_H * 0.2,
    borderTopWidth: 3, borderTopColor: 'rgba(0,0,0,0.15)',
  },
  decoLeft:  { position: 'absolute', bottom: PAGE_H * 0.2 - 2, left: 10,  fontSize: 30, opacity: 0.5 },
  decoRight: { position: 'absolute', bottom: PAGE_H * 0.2 - 2, right: 10, fontSize: 30, opacity: 0.5 },

  placedSticker: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  placedEmoji: { textAlign: 'center' },

  ghost: {
    position: 'absolute',
    opacity: 0.6,
    alignItems: 'center', justifyContent: 'center',
  },

  hint: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  hintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15, fontWeight: '700', textAlign: 'center', lineHeight: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
  },
  microHint: {
    position: 'absolute', bottom: PAGE_H * 0.2 + 6,
    left: 0, right: 0, alignItems: 'center',
  },
  microHintText: {
    fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },

  // Tray
  tray: { flex: 1, marginTop: 10, paddingHorizontal: 16 },

  sizeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sizeLabel:     { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
  sizeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
  },
  sizeBtnOn:      { backgroundColor: '#FCD34D', borderColor: '#F59E0B' },
  sizeBtnText:    { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
  sizeBtnTextOn:  { color: '#1A1A1A' },
  deselectBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(255,80,80,0.18)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,80,80,0.4)',
  },
  deselectText: { fontSize: 11, fontWeight: '700', color: '#FF6B6B' },

  trayTitle: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', marginBottom: 8,
  },
  trayEmpty:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  trayEmptyText: {
    fontSize: 14, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', fontStyle: 'italic', lineHeight: 22,
  },
  trayScroll: { flexDirection: 'row', gap: 10, paddingBottom: 8, paddingHorizontal: 4 },

  trayItem: {
    width: 78, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18, paddingVertical: 12, paddingHorizontal: 6,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  trayItemSel: {
    backgroundColor: 'rgba(252,211,77,0.22)',
    borderColor: '#FCD34D', borderWidth: 2.5,
    transform: [{ scale: 1.06 }],
  },
  trayEmoji: { fontSize: 36, marginBottom: 4 },
  trayName:  { fontSize: 9, fontWeight: '700', textAlign: 'center' },

  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#E91E63',
    borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
});
