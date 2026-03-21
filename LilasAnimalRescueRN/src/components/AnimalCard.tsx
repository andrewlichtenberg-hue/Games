import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Animal } from '../game/types';
import { C } from '../utils/colors';

interface AnimalCardProps {
  animal: Animal;
  isRescued: boolean;
  onPress?: () => void;
}

export function AnimalCard({ animal, isRescued, onPress }: AnimalCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={isRescued ? 0.7 : 1}
      onPress={isRescued ? onPress : undefined}
      style={[styles.container, { opacity: isRescued ? 1 : 0.5 }]}
    >
      <View style={[styles.emojiCircle, {
        backgroundColor: isRescued ? C.WHITE : 'rgba(128,128,128,0.2)',
      }]}>
        <Text style={styles.emoji}>{isRescued ? animal.emoji : '❓'}</Text>
      </View>
      <Text style={[styles.name, { color: isRescued ? '#333' : '#999' }]} numberOfLines={1}>
        {isRescued ? animal.name.split(' ')[0] : '???'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 64,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  emoji: {
    fontSize: 36,
  },
  name: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
});
