import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { Haptics } from '../utils/haptics';
import { LilaCharacter } from '../components/LilaCharacter';
import { BigButton } from '../components/ui/BigButton';
import { C, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from '../utils/colors';
import { useGameStore } from '../store/gameStore';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');
const IS_IPAD = width >= 768;

// Steps: name → skin → hair → outfit → confirm
const TOTAL_STEPS = 4;

type Props = { navigation: StackNavigationProp<RootStackParamList, 'CharacterCreation'> };

// ── Large swatch button ───────────────────────────────────────────────────────

function Swatch({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(selected ? 1.14 : 1)).current;

  const handlePress = () => {
    Haptics.impact();
    Animated.spring(scaleAnim, {
      toValue: 1.14,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
    onPress();
  };

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.14 : 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [selected]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.swatch,
          { backgroundColor: color },
          selected && styles.swatchSelected,
        ]}
        activeOpacity={0.85}
      >
        {selected && <Text style={styles.swatchCheck}>✓</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Step progress dots ────────────────────────────────────────────────────────

function StepDots({ step }: { step: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < step && styles.dotDone,
            i === step && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function CharacterCreationScreen({ navigation }: Props) {
  const createCharacter = useGameStore((s) => s.createCharacter);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [skinTone, setSkinTone] = useState(SKIN_TONES[1]);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0]);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const advance = (forward = true) => {
    Haptics.impact();
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: forward ? -30 : 30, duration: 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    setStep((s) => s + (forward ? 1 : -1));
  };

  const handleConfirm = () => {
    const finalName = name.trim() || 'Lila';
    createCharacter(finalName, hairColor, skinTone, outfitColor);
    Haptics.notification();
    navigation.replace('Home');
  };

  // ── Step content ────────────────────────────────────────────────

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.stepContent}
          >
            <Text style={styles.stepQuestion}>What's your explorer name? 🌟</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Type your name…"
              placeholderTextColor={C.TEXT_LIGHT}
              maxLength={16}
              returnKeyType="done"
              autoCorrect={false}
              autoFocus={false}
              onSubmitEditing={() => advance(true)}
            />
          </KeyboardAvoidingView>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepQuestion}>Pick your skin tone 👋</Text>
            <View style={styles.swatchGrid}>
              {SKIN_TONES.map((c) => (
                <Swatch key={c} color={c} selected={skinTone === c} onPress={() => setSkinTone(c)} />
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepQuestion}>Pick your hair color ✨</Text>
            <View style={styles.swatchGrid}>
              {HAIR_COLORS.map((c) => (
                <Swatch key={c} color={c} selected={hairColor === c} onPress={() => setHairColor(c)} />
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepQuestion}>Pick your outfit color 👗</Text>
            <View style={styles.swatchGrid}>
              {OUTFIT_COLORS.map((c) => (
                <Swatch key={c} color={c} selected={outfitColor === c} onPress={() => setOutfitColor(c)} />
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const displayName = name.trim() || 'Explorer';
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <LinearGradient colors={['#E1F5FE', '#F3E5F5']} style={styles.container}>
      {/* Progress dots */}
      <View style={styles.topBar}>
        <StepDots step={step} />
      </View>

      {/* Character preview — live-updating */}
      <View style={styles.previewArea}>
        <LinearGradient colors={['#B3E5FC', '#E1BEE7']} style={styles.previewCard}>
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            <LilaCharacter
              hairColor={hairColor}
              skinTone={skinTone}
              outfitColor={outfitColor}
              equippedHat="hat-explorer"
              size={IS_IPAD ? 200 : 150}
            />
          </Animated.View>
          <Text style={styles.previewName}>{displayName}</Text>
        </LinearGradient>
      </View>

      {/* Step content area */}
      <Animated.View style={[styles.contentArea, { transform: [{ translateX: slideAnim }] }]}>
        {stepContent()}
      </Animated.View>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => advance(false)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        {isLastStep ? (
          <BigButton
            label={`Let's Go, ${displayName}! 🚀`}
            onPress={handleConfirm}
            color="pink"
            size="large"
            style={styles.nextBtn}
          />
        ) : (
          <BigButton
            label="Next →"
            onPress={() => advance(true)}
            color="purple"
            size="large"
            style={styles.nextBtn}
          />
        )}
      </View>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SWATCH_SIZE = IS_IPAD ? 72 : 58;

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    paddingTop: 54,
    paddingBottom: 8,
    alignItems: 'center',
  },

  // Step dots
  dots: { flexDirection: 'row', gap: 10 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DDD',
  },
  dotActive: {
    backgroundColor: C.UI_PRIMARY,
    width: 24,
    borderRadius: 5,
  },
  dotDone: {
    backgroundColor: C.UI_SECONDARY,
  },

  // Character preview
  previewArea: {
    flex: IS_IPAD ? 2.2 : 2,
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  previewCard: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  previewName: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: IS_IPAD ? 26 : 22,
    fontWeight: '900',
    color: C.UI_DARK,
  },

  // Step content
  contentArea: {
    flex: IS_IPAD ? 1.4 : 1.6,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepQuestion: {
    fontSize: IS_IPAD ? 22 : 19,
    fontWeight: '800',
    color: C.TEXT_DARK,
    marginBottom: IS_IPAD ? 20 : 16,
    textAlign: 'center',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IS_IPAD ? 16 : 12,
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  swatchSelected: {
    borderColor: C.UI_DARK,
  },
  swatchCheck: {
    color: 'white',
    fontSize: IS_IPAD ? 26 : 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  nameInput: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: IS_IPAD ? 18 : 16,
    fontSize: IS_IPAD ? 26 : 22,
    fontWeight: '700',
    color: C.TEXT_DARK,
    borderWidth: 3,
    borderColor: C.UI_PRIMARY,
    textAlign: 'center',
  },

  // Nav buttons
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 36,
    paddingTop: 8,
    gap: 12,
  },
  backBtn: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.TEXT_MID,
  },
  nextBtn: {
    flex: 1,
  },
});
