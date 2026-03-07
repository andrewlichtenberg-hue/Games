import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { C } from '../../utils/colors';

type ColorScheme = 'pink' | 'purple' | 'green' | 'orange' | 'gold';

interface BigButtonProps {
  label: string;
  onPress: () => void;
  color?: ColorScheme;
  size?: 'small' | 'medium' | 'large';
  emoji?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

const SCHEMES: Record<ColorScheme, { bg: string; shadow: string; text: string }> = {
  pink:   { bg: C.BTN_PINK,   shadow: C.BTN_SHADOW_PINK,   text: '#fff' },
  purple: { bg: C.BTN_PURPLE, shadow: C.BTN_SHADOW_PURPLE, text: '#fff' },
  green:  { bg: C.BTN_GREEN,  shadow: C.BTN_SHADOW_GREEN,  text: '#fff' },
  orange: { bg: C.BTN_ORANGE, shadow: C.BTN_SHADOW_ORANGE, text: '#fff' },
  gold:   { bg: C.UI_GOLD,    shadow: '#C49A00',           text: '#3D2B00' },
};

const SIZE_STYLES: Record<
  'small' | 'medium' | 'large',
  { height: number; fontSize: number; paddingH: number; radius: number; shadowH: number }
> = {
  small:  { height: 44, fontSize: 16, paddingH: 18, radius: 22, shadowH: 3 },
  medium: { height: 58, fontSize: 20, paddingH: 28, radius: 29, shadowH: 4 },
  large:  { height: 70, fontSize: 24, paddingH: 36, radius: 35, shadowH: 5 },
};

export function BigButton({
  label,
  onPress,
  color = 'pink',
  size = 'medium',
  emoji,
  disabled = false,
  style,
}: BigButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const scheme = SCHEMES[color];
  const sz = SIZE_STYLES[size];

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {/* Shadow layer */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.base,
          {
            height: sz.height,
            paddingHorizontal: sz.paddingH,
            borderRadius: sz.radius,
            backgroundColor: disabled ? '#CCC' : scheme.bg,
            shadowColor: disabled ? '#999' : scheme.shadow,
            shadowOffset: { width: 0, height: sz.shadowH },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: sz.shadowH + 1,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            {
              fontSize: sz.fontSize,
              color: disabled ? '#888' : scheme.text,
            } as TextStyle,
          ]}
        >
          {emoji ? `${emoji}  ` : ''}{label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
