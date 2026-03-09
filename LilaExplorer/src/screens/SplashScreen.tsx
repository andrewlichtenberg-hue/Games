import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { BigButton } from '../components/ui/BigButton';
import { C } from '../utils/colors';
import { useGameStore } from '../store/gameStore';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Splash'> };

export function SplashScreen({ navigation }: Props) {
  const isCharacterCreated = useGameStore((s) => s.isCharacterCreated);
  const playerName = useGameStore((s) => s.playerName);
  const resetGame = useGameStore((s) => s.resetGame);

  const titleScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, useNativeDriver: true, speed: 3, bounciness: 14 }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Floating animation on the decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  const handlePlay = () => {
    if (isCharacterCreated) {
      navigation.replace('Home');
    } else {
      navigation.replace('CharacterCreation');
    }
  };

  const handleNewGame = () => {
    Alert.alert(
      'Start New Game?',
      `This will erase ${playerName}'s progress — all companions, stickers, levels, and items will be lost forever.\n\nAre you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start Over',
          style: 'destructive',
          onPress: () => {
            resetGame();
            navigation.replace('CharacterCreation');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#6C5CE7', '#A29BFE', '#FD79A8', '#FFEAA7']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Floating decorative emojis */}
      <Animated.Text style={[styles.floatEmoji, styles.e1, { transform: [{ translateY: floatY }] }]}>
        🌿
      </Animated.Text>
      <Animated.Text style={[styles.floatEmoji, styles.e2, { transform: [{ translateY: Animated.multiply(floatY, -0.8) }] }]}>
        🐿️
      </Animated.Text>
      <Animated.Text style={[styles.floatEmoji, styles.e3, { transform: [{ translateY: floatY }] }]}>
        🌸
      </Animated.Text>
      <Animated.Text style={[styles.floatEmoji, styles.e4, { transform: [{ translateY: Animated.multiply(floatY, -1.1) }] }]}>
        🦊
      </Animated.Text>
      <Animated.Text style={[styles.floatEmoji, styles.e5, { transform: [{ translateY: floatY }] }]}>
        🐻
      </Animated.Text>
      <Animated.Text style={[styles.floatEmoji, styles.e6, { transform: [{ translateY: Animated.multiply(floatY, -0.7) }] }]}>
        🦋
      </Animated.Text>

      {/* Title */}
      <Animated.View
        style={[
          styles.titleContainer,
          { transform: [{ scale: titleScale }], opacity: titleOpacity },
        ]}
      >
        <Text style={styles.titleLine1}>Lila's</Text>
        <Text style={styles.titleLine2}>Nature Explorer</Text>
        <Text style={styles.titleEmoji}>🌎✨</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        {isCharacterCreated
          ? `Welcome back, ${playerName}! 🌟`
          : 'Your adventure begins in Brooklyn…'}
      </Animated.Text>

      {/* Play button */}
      <Animated.View style={[styles.btnWrapper, { opacity: btnOpacity }]}>
        <BigButton
          label={isCharacterCreated ? "Keep Exploring!" : "Start Adventure!"}
          emoji="🚀"
          onPress={handlePlay}
          color="gold"
          size="large"
        />
      </Animated.View>
      {isCharacterCreated && (
        <View style={styles.newGameBtn}>
          <BigButton
            label="Start New Game"
            emoji="🔄"
            onPress={handleNewGame}
            color="pink"
            size="small"
          />
        </View>
      )}

      <Text style={styles.footer}>Brooklyn → World 🗺️</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  floatEmoji: {
    position: 'absolute',
    fontSize: 40,
  },
  e1: { top: height * 0.1, left: width * 0.06 },
  e2: { top: height * 0.14, right: width * 0.08 },
  e3: { top: height * 0.28, left: width * 0.04 },
  e4: { top: height * 0.34, right: width * 0.06 },
  e5: { bottom: height * 0.28, left: width * 0.08 },
  e6: { bottom: height * 0.22, right: width * 0.06 },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  titleLine1: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
  },
  titleLine2: {
    fontSize: 34,
    fontWeight: '800',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  titleEmoji: {
    fontSize: 44,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  btnWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  newGameBtn: {
    marginTop: 16,
    width: '70%',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
