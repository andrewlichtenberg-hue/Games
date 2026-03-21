import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LevelResult, Animal } from '../game/types';
import { StarRating } from './StarRating';
import { FunFactCard } from './FunFactCard';
import { C } from '../utils/colors';
import { Haptics } from '../utils/haptics';

interface LevelCompleteOverlayProps {
  result: LevelResult;
  animal: Animal;
  onNextLevel: () => void;
  onRetry: () => void;
}

export function LevelCompleteOverlay({
  result,
  animal,
  onNextLevel,
  onRetry,
}: LevelCompleteOverlayProps) {
  const [showStars, setShowStars] = useState(false);
  const [showFact, setShowFact] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    setTimeout(() => setShowStars(true), 200);
    setTimeout(() => setShowFact(true), 800);
    setTimeout(() => setShowButtons(true), 1300);
    Haptics.success();
  }, []);

  return (
    <View style={styles.backdrop}>
      <Animated.View style={[
        styles.card,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}>
        <Text style={styles.title}>Rescued!</Text>
        <Text style={styles.animalEmoji}>{animal.emoji}</Text>

        {showStars && (
          <StarRating stars={result.starsEarned} maxStars={3} size={36} animated />
        )}

        {showStars && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>👣</Text>
              <Text style={styles.statValue}>{result.pathLength}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{result.collectedStars}/{result.totalStars}</Text>
              <Text style={styles.statLabel}>Stars</Text>
            </View>
          </View>
        )}

        {showFact && (
          <FunFactCard animal={animal} compact />
        )}

        {showButtons && (
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.nextButton} onPress={onNextLevel}>
              <Text style={styles.nextButtonText}>Next Level</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: C.OVERLAY_BG,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: C.GREEN_PRIMARY,
  },
  animalEmoji: {
    fontSize: 80,
    marginVertical: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginVertical: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 22,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  buttons: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  nextButton: {
    backgroundColor: C.GREEN_PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  retryText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});
