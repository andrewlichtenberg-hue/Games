import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../utils/colors';
import type { Puzzle } from '../game/puzzles';
import { audioManager } from '../audio/audioManager';

interface Props {
  visible: boolean;
  animalName: string;
  animalEmoji: string;
  puzzle: Puzzle;
  bonusXP: number;
  hasLanternHint?: boolean;    // one hint available this area visit
  hasGoldenJournal?: boolean;  // doubles puzzle XP + gold star shower
  hasCalculator?: boolean;     // one calculator use available this area visit
  hasLuckyClover?: boolean;    // grants one free extra retry per area visit
  onHintUsed?: () => void;     // tell parent hint is consumed
  onCalculatorUsed?: () => void;
  onCorrect: (xp: number) => void;
  onDismiss: () => void;
}

type UIState = 'question' | 'correct' | 'wrong' | 'clover';

// ── Mini Calculator ──────────────────────────────────────────────────────────

const CALC_BUTTONS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
  ['C', '', '', '⌫'],
];

function MiniCalculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [pending, setPending] = useState<{ value: number; op: string } | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handleButton = (btn: string) => {
    if (btn === '') return;

    if (btn === 'C') {
      setDisplay('0');
      setPending(null);
      setJustEvaluated(false);
      return;
    }

    if (btn === '⌫') {
      setDisplay((d) => (d.length <= 1 ? '0' : d.slice(0, -1)));
      return;
    }

    const isOp = ['÷', '×', '-', '+'].includes(btn);

    if (btn === '=') {
      if (!pending) return;
      const current = parseFloat(display);
      let result = 0;
      if (pending.op === '+') result = pending.value + current;
      else if (pending.op === '-') result = pending.value - current;
      else if (pending.op === '×') result = pending.value * current;
      else if (pending.op === '÷') result = current !== 0 ? pending.value / current : 0;
      const resultStr = Number.isInteger(result) ? String(result) : result.toFixed(4).replace(/\.?0+$/, '');
      setDisplay(resultStr);
      setPending(null);
      setJustEvaluated(true);
      return;
    }

    if (isOp) {
      setPending({ value: parseFloat(display), op: btn });
      setJustEvaluated(false);
      setDisplay('0');
      return;
    }

    // Digit or decimal
    if (justEvaluated) {
      setDisplay(btn === '.' ? '0.' : btn);
      setJustEvaluated(false);
      return;
    }
    if (btn === '.' && display.includes('.')) return;
    if (display === '0' && btn !== '.') {
      setDisplay(btn);
    } else {
      if (display.length >= 10) return;
      setDisplay((d) => d + btn);
    }
  };

  return (
    <View style={calcStyles.overlay}>
      <View style={calcStyles.container}>
        <View style={calcStyles.header}>
          <Text style={calcStyles.title}>🧮 Calculator</Text>
          <TouchableOpacity onPress={onClose} style={calcStyles.closeBtn}>
            <Text style={calcStyles.closeText}>Done ✓</Text>
          </TouchableOpacity>
        </View>

        <View style={calcStyles.display}>
          <Text style={calcStyles.displayText} numberOfLines={1} adjustsFontSizeToFit>
            {pending ? `${pending.value} ${pending.op}` : ''}
          </Text>
          <Text style={calcStyles.displayMain} numberOfLines={1} adjustsFontSizeToFit>
            {display}
          </Text>
        </View>

        {CALC_BUTTONS.map((row, ri) => (
          <View key={ri} style={calcStyles.row}>
            {row.map((btn, ci) => {
              const isOp = ['÷', '×', '-', '+', '='].includes(btn);
              const isClear = btn === 'C' || btn === '⌫';
              const isEmpty = btn === '';
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    calcStyles.btn,
                    isOp && calcStyles.btnOp,
                    isClear && calcStyles.btnClear,
                    isEmpty && calcStyles.btnEmpty,
                  ]}
                  onPress={() => handleButton(btn)}
                  activeOpacity={isEmpty ? 1 : 0.7}
                  disabled={isEmpty}
                >
                  <Text style={[calcStyles.btnText, isOp && calcStyles.btnOpText]}>
                    {btn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Falling star for Golden Journal celebration ───────────────────────────────

function FallingStar({ delay, x }: { delay: number; x: string }) {
  const fall = useRef(new Animated.Value(-40)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fall, { toValue: 300, duration: 1200, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(700),
          Animated.timing(fade, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        top: 0,
        left: x as any,
        fontSize: 20,
        opacity: fade,
        transform: [{ translateY: fall }],
        zIndex: 10,
      }}
    >
      ⭐
    </Animated.Text>
  );
}

export function PuzzleModal({
  visible,
  animalName,
  animalEmoji,
  puzzle,
  bonusXP,
  hasLanternHint = false,
  hasGoldenJournal = false,
  hasCalculator = false,
  hasLuckyClover = false,
  onHintUsed,
  onCalculatorUsed,
  onCorrect,
  onDismiss,
}: Props) {
  const [uiState, setUiState] = useState<UIState>('question');
  const [usedRetry, setUsedRetry] = useState(false);

  // Lantern: which choice index is crossed out
  const [eliminatedIndex, setEliminatedIndex] = useState<number | null>(null);
  const lanternPulse = useRef(new Animated.Value(1)).current;

  // Calculator overlay
  const [showCalculator, setShowCalculator] = useState(false);

  // Card entrance
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  // Golden Journal stars
  const [showStars, setShowStars] = useState(false);

  useEffect(() => {
    if (visible) {
      setUiState('question');
      setUsedRetry(false);
      setEliminatedIndex(null);
      setShowStars(false);
      setShowCalculator(false);
      scaleAnim.setValue(0.88);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 6,
      }).start();
    }
  }, [visible]);

  // Lantern pulse when hint is available
  useEffect(() => {
    if (!hasLanternHint || eliminatedIndex !== null) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lanternPulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(lanternPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hasLanternHint, eliminatedIndex]);

  // ── Hint: eliminate one random wrong answer ───────────────────────────────

  const handleHint = () => {
    if (!hasLanternHint || eliminatedIndex !== null) return;

    let wrongIndices: number[] = [];
    if (puzzle.type === 'choice' || puzzle.type === 'which') {
      wrongIndices = puzzle.choices
        .map((_, i) => i)
        .filter((i) => i !== puzzle.correct);
    }
    if (wrongIndices.length === 0) return;

    const pick = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
    setEliminatedIndex(pick);
    lanternPulse.setValue(1);
    audioManager.playSfx('whoosh');
    onHintUsed?.();
  };

  // ── Answer handler ────────────────────────────────────────────────────────

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      setUiState('correct');
      audioManager.playSfx('levelup');
      if (hasGoldenJournal) setShowStars(true);
      setTimeout(() => onCorrect(bonusXP), 2200);
    } else if (!usedRetry) {
      // Lucky Clover: first wrong answer is always a silent free retry (no "oops" shown)
      if (hasLuckyClover) {
        audioManager.playSfx('pop');
        setUiState('clover' as UIState);
        setUsedRetry(true);
        setTimeout(() => setUiState('question'), 1600);
      } else {
        setUiState('wrong');
        setUsedRetry(true);
        audioManager.playSfx('whoosh');
        setTimeout(() => setUiState('question'), 1400);
      }
    } else {
      setUiState('wrong');
      audioManager.playSfx('whoosh');
      setTimeout(() => onDismiss(), 1400);
    }
  };

  const handleOpenCalculator = () => {
    setShowCalculator(true);
    onCalculatorUsed?.();
    audioManager.playSfx('pop');
  };

  // ── Choice renderers ──────────────────────────────────────────────────────

  const renderChoices = () => {
    if (uiState !== 'question') return null;

    if (puzzle.type === 'choice') {
      return (
        <View style={styles.choicesCol}>
          {puzzle.choices.map((text, i) => {
            const isEliminated = eliminatedIndex === i;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.choiceTextBtn, isEliminated && styles.choiceEliminated]}
                onPress={() => !isEliminated && handleAnswer(i === puzzle.correct)}
                activeOpacity={isEliminated ? 1 : 0.75}
                disabled={isEliminated}
              >
                <Text style={[styles.choiceTextBtnText, isEliminated && styles.choiceEliminatedText]}>
                  {isEliminated ? '✗  ' : ''}{text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (puzzle.type === 'which') {
      return (
        <View style={styles.choicesRow}>
          {puzzle.choices.map((emoji, i) => {
            const isEliminated = eliminatedIndex === i;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.emojiBtn, isEliminated && styles.choiceEliminated]}
                onPress={() => !isEliminated && handleAnswer(i === puzzle.correct)}
                activeOpacity={isEliminated ? 1 : 0.75}
                disabled={isEliminated}
              >
                <Text style={[styles.emojiBtnText, isEliminated && { opacity: 0.25 }]}>{emoji}</Text>
                {isEliminated && <Text style={styles.xMark}>✗</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (puzzle.type === 'truefalse') {
      return (
        <View style={styles.tfRow}>
          <TouchableOpacity
            style={[styles.tfBtn, { backgroundColor: '#D4EDDA', borderColor: '#28A745' }]}
            onPress={() => handleAnswer(puzzle.isTrue === true)}
            activeOpacity={0.75}
          >
            <Text style={styles.tfEmoji}>✅</Text>
            <Text style={styles.tfText}>True!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tfBtn, { backgroundColor: '#F8D7DA', borderColor: '#DC3545' }]}
            onPress={() => handleAnswer(puzzle.isTrue === false)}
            activeOpacity={0.75}
          >
            <Text style={styles.tfEmoji}>❌</Text>
            <Text style={styles.tfText}>Not true!</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ── Question text ─────────────────────────────────────────────────────────

  const questionText =
    puzzle.type === 'choice'
      ? puzzle.question
      : puzzle.type === 'which'
      ? puzzle.question
      : puzzle.statement;

  const displayBonusXP = hasGoldenJournal ? bonusXP * 2 : bonusXP;

  const starPositions = ['8%', '22%', '38%', '55%', '70%', '85%'];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={hasGoldenJournal ? ['#FFFDE7', '#FFF9C4', '#FFF3E0'] : ['#FFF9C4', '#E8F5E9', '#FFF3E0']}
            style={styles.gradient}
          >
            {/* Golden star shower */}
            {showStars && starPositions.map((x, i) => (
              <FallingStar key={i} delay={i * 120} x={x} />
            ))}

            {uiState === 'question' && (
              <>
                <Text style={styles.animalEmoji}>{animalEmoji}</Text>
                <Text style={styles.challengeLabel}>
                  {animalName.split(' ')[0]} has a puzzle for you! 🌟
                </Text>
                {hasGoldenJournal && (
                  <View style={styles.goldenBadge}>
                    <Text style={styles.goldenBadgeText}>📒 2× XP bonus active!</Text>
                  </View>
                )}
                <View style={styles.divider} />

                <Text style={styles.questionText}>{questionText}</Text>

                {renderChoices()}

                {/* Lantern hint button */}
                {hasLanternHint && eliminatedIndex === null &&
                  (puzzle.type === 'choice' || puzzle.type === 'which') && (
                  <Animated.View style={{ transform: [{ scale: lanternPulse }], marginBottom: 8 }}>
                    <TouchableOpacity style={styles.hintBtn} onPress={handleHint} activeOpacity={0.8}>
                      <Text style={styles.hintBtnText}>🏮 Use lantern hint</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                {eliminatedIndex !== null && (
                  <Text style={styles.hintUsedText}>🏮 One wrong answer lit up!</Text>
                )}

                {/* Calculator button */}
                {hasCalculator && (
                  <TouchableOpacity style={styles.calcBtn} onPress={handleOpenCalculator} activeOpacity={0.8}>
                    <Text style={styles.calcBtnText}>🧮 Open calculator</Text>
                  </TouchableOpacity>
                )}
                {!hasCalculator && hasLuckyClover && (
                  <Text style={styles.cloverReady}>🍀 Lucky Clover ready — one free retry!</Text>
                )}

                <TouchableOpacity style={styles.skipBtn} onPress={onDismiss}>
                  <Text style={styles.skipText}>Maybe later 🌿</Text>
                </TouchableOpacity>
              </>
            )}

            {uiState === 'correct' && (
              <View style={styles.feedback}>
                <Text style={styles.feedbackEmoji}>🎉</Text>
                <Text style={styles.feedbackTitle}>Amazing!</Text>
                <Text style={styles.feedbackSub}>
                  +{displayBonusXP} bonus XP{hasGoldenJournal ? ' ⭐' : '!'}
                </Text>
                {hasGoldenJournal && (
                  <Text style={styles.goldenDoubleText}>Golden Journal 2× ✨</Text>
                )}
                <Text style={styles.feedbackExtra}>
                  {animalName.split(' ')[0]} thinks you're great! ❤️
                </Text>
              </View>
            )}

            {uiState === 'wrong' && (
              <View style={styles.feedback}>
                <Text style={styles.feedbackEmoji}>{usedRetry ? '🌿' : '💪'}</Text>
                <Text style={styles.feedbackTitle}>
                  {usedRetry ? 'Nice try!' : 'Oops!'}
                </Text>
                <Text style={styles.feedbackSub}>
                  {usedRetry ? 'Keep exploring!' : 'Try again!'}
                </Text>
              </View>
            )}

            {(uiState as string) === 'clover' && (
              <View style={styles.feedback}>
                <Text style={styles.feedbackEmoji}>🍀</Text>
                <Text style={styles.feedbackTitle}>Lucky save!</Text>
                <Text style={styles.feedbackSub}>The clover protected you! Try again! ✨</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Calculator overlay — rendered outside card so it floats above */}
      {showCalculator && (
        <MiniCalculator onClose={() => setShowCalculator(false)} />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  gradient: {
    padding: 28,
    alignItems: 'center',
  },
  animalEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  challengeLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: C.TEXT_DARK,
    textAlign: 'center',
    marginBottom: 6,
  },
  goldenBadge: {
    backgroundColor: '#FFD54F',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  goldenBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5D4037',
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignSelf: 'stretch',
    borderRadius: 1,
    marginBottom: 18,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: C.TEXT_DARK,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 25,
  },
  // Text choices
  choicesCol: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: 12,
  },
  choiceTextBtn: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  choiceEliminated: {
    backgroundColor: '#F5F5F5',
    borderColor: '#BDBDBD',
    opacity: 0.55,
  },
  choiceEliminatedText: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  choiceTextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.TEXT_DARK,
    textAlign: 'center',
    lineHeight: 21,
  },
  // Emoji choices
  choicesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  emojiBtn: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiBtnText: { fontSize: 38 },
  xMark: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: '900',
    color: '#E53935',
  },
  // True/False
  tfRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tfBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tfEmoji: { fontSize: 28, marginBottom: 4 },
  tfText: { fontSize: 15, fontWeight: '800', color: C.TEXT_DARK },
  // Calculator button
  calcBtn: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#1976D2',
    marginBottom: 8,
  },
  calcBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1565C0',
  },
  // Lucky clover indicator
  cloverReady: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  // Lantern hint
  hintBtn: {
    backgroundColor: '#FFF9C4',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#F9A825',
    shadowColor: '#F9A825',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  hintBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E65100',
  },
  hintUsedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  skipText: {
    fontSize: 14,
    color: C.TEXT_LIGHT,
    fontWeight: '600',
  },
  // Feedback states
  feedback: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  feedbackEmoji: { fontSize: 72, marginBottom: 8 },
  feedbackTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.TEXT_DARK,
    marginBottom: 6,
  },
  feedbackSub: {
    fontSize: 20,
    fontWeight: '800',
    color: C.XP_FILL,
    marginBottom: 4,
  },
  goldenDoubleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F57F17',
    marginBottom: 6,
  },
  feedbackExtra: {
    fontSize: 15,
    color: C.TEXT_MID,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// ── Calculator styles ─────────────────────────────────────────────────────────

const calcStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  container: {
    backgroundColor: '#263238',
    borderRadius: 24,
    padding: 16,
    width: 280,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  closeBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  closeText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  display: {
    backgroundColor: '#1C2529',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    minHeight: 64,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  displayText: { fontSize: 14, color: '#78909C', marginBottom: 2 },
  displayMain: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#37474F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOp: { backgroundColor: '#F9A825' },
  btnClear: { backgroundColor: '#D32F2F' },
  btnEmpty: { backgroundColor: 'transparent' },
  btnText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  btnOpText: { color: '#1C1C1C' },
});
