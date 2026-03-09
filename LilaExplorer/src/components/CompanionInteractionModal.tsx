import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimalSprite } from './AnimalSprite';
import { PuzzleModal } from './PuzzleModal';
import { C } from '../utils/colors';
import { Animal } from '../game/animals';
import { getRandomPuzzle } from '../game/puzzles';
import { rollRewardSticker, getStickerById, isCompanionSticker, animalIdFromSticker } from '../game/stickers';
import { getAnimalById } from '../game/animals';
import { audioManager } from '../audio/audioManager';
import type { Puzzle } from '../game/puzzles';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  animal: Animal;
  onEarnSticker: (stickerId: string) => void;
  onGainXP: (amount: number) => void;
  onClose: () => void;
}

type InteractionPhase =
  | 'menu'        // choose action
  | 'petting'     // pet animation
  | 'treating'    // treat animation
  | 'puzzle'      // puzzle modal open
  | 'sticker-reward';  // show earned sticker

const TREAT_LINES = [
  'Mmm, yummy! Thank you!',
  'Oh wow, my favourite! 😋',
  'You\'re the best explorer!',
  'Delicious! I\'ll remember this!',
];

const PET_LINES = [
  'Ooh, that feels SO good! 🥰',
  'Purr… I mean, I love this!',
  'You have the best scratching hands!',
  'More! More! Please!',
];

export function CompanionInteractionModal({
  visible, animal, onEarnSticker, onGainXP, onClose,
}: Props) {
  const [phase, setPhase] = useState<InteractionPhase>('menu');
  const [reactionLine, setReactionLine] = useState('');
  const [activePuzzle, setActivePuzzle] = useState<{ puzzle: Puzzle; bonusXP: number } | null>(null);
  const [earnedStickerId, setEarnedStickerId] = useState<string | null>(null);

  const bounceAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const heartAnim   = useRef(new Animated.Value(0)).current;
  const stickerScale = useRef(new Animated.Value(0)).current;

  // Reset on open
  useEffect(() => {
    if (visible) {
      setPhase('menu');
      setActivePuzzle(null);
      setEarnedStickerId(null);
      bounceAnim.setValue(0);
      scaleAnim.setValue(1);
      heartAnim.setValue(0);
    }
  }, [visible]);

  const doBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -20, duration: 130, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 16 }),
    ]).start();
  };

  const doHeartBurst = () => {
    heartAnim.setValue(0);
    Animated.timing(heartAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  };

  const handlePet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    audioManager.playSfx('friendship');
    setReactionLine(PET_LINES[Math.floor(Math.random() * PET_LINES.length)]);
    setPhase('petting');
    doBounce();
    doHeartBurst();
    onGainXP(5);
  };

  const handleTreat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    audioManager.playSfx('success');
    setReactionLine(TREAT_LINES[Math.floor(Math.random() * TREAT_LINES.length)]);
    setPhase('treating');
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 10 }),
    ]).start();
    onGainXP(8);
  };

  const handlePuzzle = () => {
    const data = getRandomPuzzle(animal.id);
    if (!data) {
      // No puzzle for this animal — still give a sticker as consolation
      handleNoPuzzle();
      return;
    }
    setActivePuzzle(data);
    setPhase('puzzle');
  };

  const handleNoPuzzle = () => {
    const stickerId = rollRewardSticker(animal.id);
    setEarnedStickerId(stickerId);
    setPhase('sticker-reward');
    onEarnSticker(stickerId);
    stickerScale.setValue(0);
    Animated.spring(stickerScale, { toValue: 1, useNativeDriver: true, speed: 5, bounciness: 18 }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    audioManager.playSfx('discover');
  };

  const handlePuzzleCorrect = () => {
    setActivePuzzle(null);
    const stickerId = rollRewardSticker(animal.id);
    setEarnedStickerId(stickerId);
    setPhase('sticker-reward');
    onEarnSticker(stickerId);
    stickerScale.setValue(0);
    Animated.spring(stickerScale, { toValue: 1, useNativeDriver: true, speed: 5, bounciness: 18 }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    audioManager.playSfx('discover');
  };

  const handlePuzzleDismiss = () => {
    setActivePuzzle(null);
    setPhase('menu');
  };

  const stickerInfo = earnedStickerId
    ? (isCompanionSticker(earnedStickerId)
        ? (() => {
            const a = getAnimalById(animalIdFromSticker(earnedStickerId));
            return a ? { name: a.name + ' Sticker', emoji: a.emoji, description: `A special sticker of your friend ${a.name.split(' ')[0]}!`, rarity: 'rare' } : null;
          })()
        : getStickerById(earnedStickerId)
      )
    : null;

  const rarityColor: Record<string, string> = {
    common: '#78909C',
    rare: '#7B1FA2',
    legendary: '#E65100',
  };

  const renderHearts = () => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heartsBurst,
        {
          opacity: heartAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
          transform: [{ translateY: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }],
        },
      ]}
    >
      <Text style={styles.hearts}>❤️ 💕 ❤️</Text>
    </Animated.View>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <LinearGradient colors={['#4527A0', '#7B1FA2', '#E91E63']} style={styles.card}>

            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* Animal */}
            <Animated.View style={[styles.animalBox, { transform: [{ translateY: bounceAnim }, { scale: scaleAnim }] }]}>
              {renderHearts()}
              <AnimalSprite type={animal.type} size={110} bodyColor={animal.bodyColor} accentColor={animal.accentColor} />
            </Animated.View>
            <Text style={styles.animalName}>{animal.name}</Text>

            {/* ── MENU ── */}
            {phase === 'menu' && (
              <>
                <Text style={styles.menuPrompt}>What would you like to do?</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E91E63' }]} onPress={handlePet} activeOpacity={0.85}>
                    <Text style={styles.actionEmoji}>🤗</Text>
                    <Text style={styles.actionLabel}>Pet</Text>
                    <Text style={styles.actionSub}>+5 XP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E65100' }]} onPress={handleTreat} activeOpacity={0.85}>
                    <Text style={styles.actionEmoji}>🍎</Text>
                    <Text style={styles.actionLabel}>Treat</Text>
                    <Text style={styles.actionSub}>+8 XP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1565C0' }]} onPress={handlePuzzle} activeOpacity={0.85}>
                    <Text style={styles.actionEmoji}>🧩</Text>
                    <Text style={styles.actionLabel}>Puzzle</Text>
                    <Text style={styles.actionSub}>🎁 Sticker!</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── PETTING ── */}
            {phase === 'petting' && (
              <View style={styles.reactionBox}>
                <Text style={styles.reactionEmoji}>💕</Text>
                <Text style={styles.reactionText}>"{reactionLine}"</Text>
                <Text style={styles.xpEarned}>+5 XP earned!</Text>
                <TouchableOpacity style={styles.continueBtn} onPress={() => setPhase('menu')} activeOpacity={0.85}>
                  <Text style={styles.continueBtnText}>Keep Playing ▸</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── TREATING ── */}
            {phase === 'treating' && (
              <View style={styles.reactionBox}>
                <Text style={styles.reactionEmoji}>😋</Text>
                <Text style={styles.reactionText}>"{reactionLine}"</Text>
                <Text style={styles.xpEarned}>+8 XP earned!</Text>
                <TouchableOpacity style={styles.continueBtn} onPress={() => setPhase('menu')} activeOpacity={0.85}>
                  <Text style={styles.continueBtnText}>Keep Playing ▸</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STICKER REWARD ── */}
            {phase === 'sticker-reward' && stickerInfo && (
              <View style={styles.reactionBox}>
                <Text style={styles.rewardTitle}>🎉 New Sticker!</Text>
                <Animated.View style={[styles.stickerCard, { transform: [{ scale: stickerScale }] }]}>
                  <Text style={styles.stickerEmoji}>{stickerInfo.emoji}</Text>
                  <Text style={[styles.stickerRarity, { color: rarityColor[stickerInfo.rarity ?? 'common'] ?? '#78909C' }]}>
                    {(stickerInfo.rarity ?? 'common').toUpperCase()}
                  </Text>
                  <Text style={styles.stickerName}>{stickerInfo.name}</Text>
                  <Text style={styles.stickerDesc}>{stickerInfo.description}</Text>
                </Animated.View>
                <Text style={styles.stickerHint}>Go to your Sticker Book to place it! 📖</Text>
                <TouchableOpacity style={styles.continueBtn} onPress={() => setPhase('menu')} activeOpacity={0.85}>
                  <Text style={styles.continueBtnText}>Awesome! ⭐</Text>
                </TouchableOpacity>
              </View>
            )}

          </LinearGradient>
        </View>
      </Modal>

      {/* Puzzle modal — rendered outside the main modal so it stacks correctly */}
      {activePuzzle && (
        <PuzzleModal
          visible
          animalName={animal.name}
          animalEmoji={animal.emoji}
          puzzle={activePuzzle.puzzle}
          bonusXP={activePuzzle.bonusXP}
          onCorrect={(xp) => { onGainXP(xp); handlePuzzleCorrect(); }}
          onDismiss={handlePuzzleDismiss}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 420,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  closeBtnText: { fontSize: 16, color: 'white', fontWeight: '800' },
  animalBox: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  heartsBurst: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hearts: { fontSize: 28 },
  animalName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  menuPrompt: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionEmoji: { fontSize: 30, marginBottom: 4 },
  actionLabel: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  actionSub: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  reactionBox: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
  },
  reactionEmoji: { fontSize: 50, marginBottom: 8 },
  reactionText: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  xpEarned: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FCD34D',
    marginBottom: 16,
  },
  continueBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  continueBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  // Sticker reward
  rewardTitle: { fontSize: 26, fontWeight: '900', color: '#FCD34D', marginBottom: 12 },
  stickerCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: width - 80,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  stickerEmoji: { fontSize: 52, marginBottom: 4 },
  stickerRarity: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  stickerName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  stickerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },
  stickerHint: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14, fontWeight: '600', textAlign: 'center' },
});
