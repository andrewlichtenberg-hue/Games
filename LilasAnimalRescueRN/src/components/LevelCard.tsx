import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Level } from '../game/types';
import { StarRating } from './StarRating';
import { C } from '../utils/colors';

interface LevelCardProps {
  level: Level;
  isCompleted: boolean;
  bestStars: number;
  isLocked: boolean;
  onPress: () => void;
}

export function LevelCard({
  level,
  isCompleted,
  bestStars,
  isLocked,
  onPress,
}: LevelCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={isLocked ? 1 : 0.7}
      onPress={onPress}
      style={[styles.card, {
        opacity: isLocked ? 0.6 : 1,
        backgroundColor: isLocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.95)',
      }]}
    >
      <View style={[styles.emojiCircle, {
        backgroundColor: isLocked ? 'rgba(128,128,128,0.2)' : 'rgba(255,255,255,0.3)',
      }]}>
        <Text style={styles.emoji}>{isLocked ? '🔒' : level.animal.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, { color: isLocked ? '#999' : '#333' }]}>
          {level.title}
        </Text>
        <Text style={styles.subtitle}>
          {isLocked
            ? 'Complete previous level to unlock'
            : `Help ${level.animal.name.split(' ')[0]} get home!`}
        </Text>
      </View>

      {isCompleted ? (
        <StarRating stars={bestStars} maxStars={3} size={14} />
      ) : !isLocked ? (
        <Text style={styles.playText}>Play</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    shadowColor: C.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    gap: 14,
  },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    color: '#999',
  },
  playText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.GREEN_PRIMARY,
  },
});
