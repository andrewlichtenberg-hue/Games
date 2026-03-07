import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { C } from '../utils/colors';
import { BigButton } from './ui/BigButton';

interface SpeechBubbleProps {
  animalName: string;
  message: string;
  isNew: boolean;
  friendshipLevel: number;
  onSayHi: () => void;
  onClose: () => void;
  opacity?: Animated.Value;
}

export function SpeechBubble({
  animalName,
  message,
  isNew,
  friendshipLevel,
  onSayHi,
  onClose,
  opacity,
}: SpeechBubbleProps) {
  const hearts = Array.from({ length: 3 }, (_, i) => i < Math.min(friendshipLevel, 3) ? '❤️' : '🤍');

  const inner = (
    <View style={styles.bubble}>
      {/* Tail of bubble */}
      <View style={styles.tail} />
      <View style={styles.content}>
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>✨ New Friend!</Text>
          </View>
        )}
        <Text style={styles.name}>{animalName}</Text>
        <Text style={styles.message}>"{message}"</Text>
        <Text style={styles.hearts}>{hearts.join(' ')}</Text>
        <View style={styles.buttons}>
          <BigButton
            label="Say Hi! 👋"
            onPress={onSayHi}
            color="pink"
            size="small"
            style={{ flex: 1, marginRight: 8 }}
          />
          <BigButton
            label="Bye!"
            onPress={onClose}
            color="purple"
            size="small"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  );

  if (opacity) {
    return <Animated.View style={{ opacity }}>{inner}</Animated.View>;
  }
  return inner;
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: C.UI_PANEL,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: C.UI_PRIMARY,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginHorizontal: 16,
    position: 'relative',
  },
  tail: {
    position: 'absolute',
    bottom: -14,
    left: '50%',
    marginLeft: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.UI_PRIMARY,
  },
  content: {
    padding: 16,
  },
  newBadge: {
    backgroundColor: C.UI_GOLD,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3D2B00',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: C.TEXT_DARK,
    marginBottom: 4,
  },
  message: {
    fontSize: 15,
    color: C.TEXT_MID,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 22,
  },
  hearts: {
    fontSize: 16,
    marginBottom: 12,
    letterSpacing: 2,
  },
  buttons: {
    flexDirection: 'row',
  },
});
