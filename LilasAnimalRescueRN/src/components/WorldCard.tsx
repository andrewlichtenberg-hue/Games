import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { World } from '../game/types';
import { C } from '../utils/colors';

interface WorldCardProps {
  world: World;
  worldIndex: number;
  isUnlocked: boolean;
  starsEarned: number;
  totalStars: number;
  completedLevels: number;
  previousWorldName: string;
  onPress: () => void;
}

export function WorldCard({
  world,
  worldIndex,
  isUnlocked,
  starsEarned,
  totalStars,
  completedLevels,
  previousWorldName,
  onPress,
}: WorldCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={isUnlocked ? 0.7 : 1}
      onPress={onPress}
      style={[styles.card, { opacity: isUnlocked ? 1 : 0.7 }]}
    >
      <View style={[styles.emojiCircle, {
        backgroundColor: isUnlocked ? `${world.cardColor}33` : 'rgba(128,128,128,0.15)',
      }]}>
        <Text style={styles.emoji}>{world.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: isUnlocked ? '#333' : '#999' }]}>
          {world.name}
        </Text>
        <Text style={styles.subtitle}>{world.subtitle}</Text>

        {isUnlocked ? (
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>{starsEarned}/{totalStars} ⭐</Text>
            <Text style={styles.statsText}> · </Text>
            <Text style={styles.statsText}>{completedLevels}/{world.levels.length} levels</Text>
          </View>
        ) : (
          <View style={styles.lockRow}>
            <Text style={styles.lockText}>🔒 Complete 3 levels in {previousWorldName}</Text>
          </View>
        )}
      </View>

      {isUnlocked && (
        <Text style={[styles.chevron, { color: world.cardColor }]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: C.WHITE,
    borderRadius: 16,
    shadowColor: C.CARD_SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    gap: 16,
  },
  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 44,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statsText: {
    fontSize: 11,
    color: '#999',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lockText: {
    fontSize: 11,
    color: '#999',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '600',
  },
});
