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
  onCorrect: (xp: number) => void;
  onDismiss: () => void;
}

type UIState = 'question' | 'correct' | 'wrong';

export function PuzzleModal({
  visible,
  animalName,
  animalEmoji,
  puzzle,
  bonusXP,
  onCorrect,
  onDismiss,
}: Props) {
  const [uiState, setUiState] = useState<UIState>('question');
  const [usedRetry, setUsedRetry] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (visible) {
      setUiState('question');
      setUsedRetry(false);
      scaleAnim.setValue(0.88);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 6,
      }).start();
    }
  }, [visible]);

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      setUiState('correct');
      audioManager.playSfx('levelup');
      setTimeout(() => onCorrect(bonusXP), 2000);
    } else if (!usedRetry) {
      // First wrong: allow one retry
      setUiState('wrong');
      setUsedRetry(true);
      audioManager.playSfx('whoosh');
      setTimeout(() => setUiState('question'), 1400);
    } else {
      // Second wrong: close gently
      setUiState('wrong');
      audioManager.playSfx('whoosh');
      setTimeout(() => onDismiss(), 1400);
    }
  };

  // ── Choice renderers ─────────────────────────────────────────────

  const renderChoices = () => {
    if (uiState !== 'question') return null;

    // Text choices — math word problems, reading comprehension, knowledge
    if (puzzle.type === 'choice') {
      return (
        <View style={styles.choicesCol}>
          {puzzle.choices.map((text, i) => (
            <TouchableOpacity
              key={i}
              style={styles.choiceTextBtn}
              onPress={() => handleAnswer(i === puzzle.correct)}
              activeOpacity={0.75}
            >
              <Text style={styles.choiceTextBtnText}>{text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (puzzle.type === 'which') {
      return (
        <View style={styles.choicesRow}>
          {puzzle.choices.map((emoji, i) => (
            <TouchableOpacity
              key={i}
              style={styles.emojiBtn}
              onPress={() => handleAnswer(i === puzzle.correct)}
              activeOpacity={0.75}
            >
              <Text style={styles.emojiBtnText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
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

  // ── Question text ────────────────────────────────────────────────

  const questionText =
    puzzle.type === 'count'
      ? `How many ${puzzle.emoji}?`
      : puzzle.type === 'which'
      ? puzzle.question
      : puzzle.statement;

  // No extra display element needed now — choice questions stand alone

  // ── Render ───────────────────────────────────────────────────────

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#FFF9C4', '#E8F5E9', '#FFF3E0']}
            style={styles.gradient}
          >
            {uiState === 'question' && (
              <>
                <Text style={styles.animalEmoji}>{animalEmoji}</Text>
                <Text style={styles.challengeLabel}>
                  {animalName.split(' ')[0]} has a puzzle for you! 🌟
                </Text>
                <View style={styles.divider} />

                <Text style={styles.questionText}>{questionText}</Text>

                {renderChoices()}

                <TouchableOpacity style={styles.skipBtn} onPress={onDismiss}>
                  <Text style={styles.skipText}>Maybe later 🌿</Text>
                </TouchableOpacity>
              </>
            )}

            {uiState === 'correct' && (
              <View style={styles.feedback}>
                <Text style={styles.feedbackEmoji}>🎉</Text>
                <Text style={styles.feedbackTitle}>Amazing!</Text>
                <Text style={styles.feedbackSub}>+{bonusXP} bonus XP!</Text>
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
          </LinearGradient>
        </Animated.View>
      </View>
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
    marginBottom: 14,
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
  // Text answer choices (choice type)
  choicesCol: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: 16,
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
  choiceTextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.TEXT_DARK,
    textAlign: 'center',
    lineHeight: 21,
  },
  // Emoji choices (which type)
  choicesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  // Which choices
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
  emojiBtnText: {
    fontSize: 38,
  },
  // True/False choices
  tfRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
  tfEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  tfText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.TEXT_DARK,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
  feedbackEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
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
    marginBottom: 6,
  },
  feedbackExtra: {
    fontSize: 15,
    color: C.TEXT_MID,
    fontWeight: '600',
    textAlign: 'center',
  },
});
