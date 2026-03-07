import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { C } from '../utils/colors';
import { getXpProgressInLevel, LEVEL_TITLES } from '../game/progression';

interface XPBarProps {
  xp: number;
  level: number;
  showTitle?: boolean;
}

export function XPBar({ xp, level, showTitle = true }: XPBarProps) {
  const { fraction } = getXpProgressInLevel(xp, level);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: fraction,
      useNativeDriver: false,
      speed: 6,
      bounciness: 3,
    }).start();
  }, [fraction, widthAnim]);

  const title = LEVEL_TITLES[level] ?? 'Explorer';

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <Text style={styles.levelText}>Lv {level}</Text>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      )}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <View style={styles.shine} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.UI_PRIMARY,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.TEXT_MID,
  },
  track: {
    height: 14,
    backgroundColor: C.XP_BG,
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: C.XP_FILL,
    borderRadius: 7,
  },
  shine: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
  },
});
