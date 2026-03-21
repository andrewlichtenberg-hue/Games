import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { C } from '../utils/colors';

interface StarRatingProps {
  stars: number;
  maxStars: number;
  size?: number;
  animated?: boolean;
}

export function StarRating({ stars, maxStars, size = 24, animated = false }: StarRatingProps) {
  const scales = useRef(
    Array.from({ length: maxStars }, () => new Animated.Value(animated ? 0 : 1)),
  ).current;

  useEffect(() => {
    if (animated) {
      scales.forEach((scale, i) => {
        if (i < stars) {
          Animated.spring(scale, {
            toValue: 1.2,
            useNativeDriver: true,
            speed: 8,
            bounciness: 12,
            delay: i * 300,
          }).start(() => {
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 12,
              bounciness: 8,
            }).start();
          });
        }
      });
    }
  }, [stars, animated]);

  return (
    <View style={[styles.row, { gap: size * 0.15 }]}>
      {Array.from({ length: maxStars }, (_, i) => (
        <Animated.Text
          key={i}
          style={{
            fontSize: size,
            transform: [{ scale: animated ? scales[i] : 1 }],
            color: i < stars ? C.STAR_GOLD : C.STAR_EMPTY,
          }}
        >
          {i < stars ? '⭐' : '☆'}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
