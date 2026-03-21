import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { BigButton } from '../components/ui/BigButton';
import { Haptics } from '../utils/haptics';
import { audioManager } from '../audio/audioManager';
import type { RootStackParamList } from '../../App';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Splash'> };

const SPLASH_ANIMALS = ['🐿️', '🦊', '🐬', '🦜', '🐻', '🦉', '🐢', '🦩'];

export function SplashScreen({ navigation }: Props) {
  const titleScale = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const animalsOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title animation
    Animated.spring(titleScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 6,
      bounciness: 10,
    }).start();
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Animals fade in
    setTimeout(() => {
      Animated.timing(animalsOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 400);

    // Button fade in
    setTimeout(() => {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Floating animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    audioManager.playMusic('theme');
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <LinearGradient colors={['#4CAF50', '#81C784', '#A5D6A7']} style={styles.container}>
      <View style={styles.spacer} />

      <Animated.View style={[styles.titleBlock, {
        transform: [{ scale: titleScale }],
        opacity: titleOpacity,
      }]}>
        <Text style={styles.leaf}>🌿</Text>
        <Text style={styles.lilas}>Lila's</Text>
        <Text style={styles.title}>Animal Rescue</Text>
      </Animated.View>

      <Animated.View style={[styles.animalsRow, { opacity: animalsOpacity }]}>
        {SPLASH_ANIMALS.map((emoji, i) => (
          <Animated.Text
            key={i}
            style={[styles.splashAnimal, {
              transform: [{
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, i % 2 === 0 ? -8 : 8],
                }),
              }],
            }]}
          >
            {emoji}
          </Animated.Text>
        ))}
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View style={[styles.buttonWrap, { opacity: buttonOpacity }]}>
        <BigButton
          label="Start Rescuing!"
          emoji="🐾"
          color="green"
          size="large"
          onPress={() => {
            Haptics.success();
            navigation.replace('WorldMap');
          }}
        />
      </Animated.View>

      <View style={{ height: 40 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 8,
  },
  leaf: {
    fontSize: 48,
  },
  lilas: {
    fontSize: 28,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
  },
  animalsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  splashAnimal: {
    fontSize: 32,
  },
  buttonWrap: {
    marginBottom: 20,
  },
});
