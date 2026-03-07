import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../utils/colors';
import { LEVEL_TITLES, getRewardForLevel } from '../game/progression';
import { BigButton } from './ui/BigButton';
import { StarBurst } from './StarBurst';

const { width } = Dimensions.get('window');

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ visible, level, onClose }: LevelUpModalProps) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.5);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 6,
          bounciness: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(spin, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [visible]);

  const reward = getRewardForLevel(level);
  const title = LEVEL_TITLES[level] ?? 'Explorer';

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <StarBurst active={visible} />
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale }], opacity },
          ]}
        >
          <LinearGradient
            colors={['#6C5CE7', '#A29BFE', '#FD79A8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Spinning star */}
            <Animated.Text
              style={[styles.bigStar, { transform: [{ rotate }] }]}
            >
              ⭐
            </Animated.Text>

            <Text style={styles.levelUpText}>LEVEL UP!</Text>
            <Text style={styles.levelNumber}>Level {level}</Text>
            <Text style={styles.titleText}>{title}</Text>

            <View style={styles.divider} />

            {reward && (
              <>
                <Text style={styles.unlockLabel}>🗺️ New Area Unlocked!</Text>
                <Text style={styles.unlockText}>{reward.unlockText}</Text>

                {reward.items.length > 0 && (
                  <>
                    <Text style={styles.itemsLabel}>✨ New Items!</Text>
                    <View style={styles.itemsRow}>
                      {reward.items.slice(0, 4).map((id) => (
                        <View key={id} style={styles.itemBubble}>
                          <Text style={styles.itemEmoji}>🎁</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            <BigButton
              label="Let's Go Explore!"
              onPress={onClose}
              color="gold"
              size="large"
              style={styles.button}
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width - 40,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  gradient: {
    padding: 28,
    alignItems: 'center',
  },
  bigStar: {
    fontSize: 64,
    marginBottom: 8,
  },
  levelUpText: {
    fontSize: 32,
    fontWeight: '900',
    color: C.UI_GOLD,
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginTop: 4,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    marginBottom: 16,
  },
  divider: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    marginBottom: 16,
  },
  unlockLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: C.UI_GOLD,
    marginBottom: 6,
  },
  unlockText: {
    fontSize: 15,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  itemsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  itemBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 24,
  },
  button: {
    marginTop: 8,
    alignSelf: 'stretch',
  },
});
