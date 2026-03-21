import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Animal } from '../game/types';
import { C } from '../utils/colors';

interface FunFactCardProps {
  animal: Animal;
  compact?: boolean;
}

export function FunFactCard({ animal, compact = false }: FunFactCardProps) {
  return (
    <View style={[styles.card, { padding: compact ? 12 : 20 }]}>
      <Text style={{ fontSize: compact ? 40 : 60, textAlign: 'center' }}>
        {animal.emoji}
      </Text>
      <Text style={[styles.name, { fontSize: compact ? 14 : 18 }]}>
        {animal.name}
      </Text>
      {!compact && (
        <Text style={styles.didYouKnow}>DID YOU KNOW?</Text>
      )}
      <Text
        style={[styles.fact, { fontSize: compact ? 12 : 15 }]}
        numberOfLines={compact ? 3 : undefined}
      >
        {animal.funFact}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.WHITE,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: C.CARD_SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  name: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  didYouKnow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  fact: {
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
