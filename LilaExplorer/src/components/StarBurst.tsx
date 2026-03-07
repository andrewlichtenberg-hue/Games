import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  emoji: string;
}

const COLORS = ['#FF6B9D', '#A29BFE', '#F9CA24', '#6C5CE7', '#00B894', '#FD79A8'];
const EMOJIS = ['⭐', '✨', '🌟', '💫', '🎉', '🎊', '🌸', '🦋'];
const PARTICLE_COUNT = 20;

interface StarBurstProps {
  active: boolean;
  onComplete?: () => void;
}

export function StarBurst({ active, onComplete }: StarBurstProps) {
  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height / 2),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    const animations = particles.map((p) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 160;
      const targetX = width / 2 + Math.cos(angle) * distance;
      const targetY = height / 2 + Math.sin(angle) * distance - 60;
      const delay = Math.random() * 200;

      p.x.setValue(width / 2);
      p.y.setValue(height / 2);
      p.opacity.setValue(0);
      p.scale.setValue(0);

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.x, { toValue: targetX, duration: 700, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: targetY, duration: 700, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.spring(p.scale, { toValue: 1.2, useNativeDriver: true, speed: 20, bounciness: 10 }),
            Animated.timing(p.scale, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
              opacity: p.opacity,
            },
          ]}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    fontSize: 24,
    left: -12,
    top: -12,
  },
});
