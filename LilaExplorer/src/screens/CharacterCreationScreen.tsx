import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// Use gesture-handler's ScrollView so it cooperates with GestureHandlerRootView
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { Haptics } from '../utils/haptics';
import { LilaCharacter } from '../components/LilaCharacter';
import { BigButton } from '../components/ui/BigButton';
import { C, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from '../utils/colors';
import { useGameStore } from '../store/gameStore';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');
const IS_SMALL_PHONE = height < 750; // iPhone SE / older models
const CHAR_SIZE = IS_SMALL_PHONE ? 120 : 160;

type Props = { navigation: StackNavigationProp<RootStackParamList, 'CharacterCreation'> };

function ColorDot({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.colorDot,
        { backgroundColor: color },
        selected && styles.colorDotSelected,
      ]}
      activeOpacity={0.8}
    >
      {selected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
}

export function CharacterCreationScreen({ navigation }: Props) {
  const createCharacter = useGameStore((s) => s.createCharacter);

  const [name, setName] = useState('Lila');
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [skinTone, setSkinTone] = useState(SKIN_TONES[1]);
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0]);

  const handleConfirm = () => {
    const finalName = name.trim() || 'Lila';
    createCharacter(finalName, hairColor, skinTone, outfitColor);
    Haptics.notification();
    navigation.replace('Home');
  };

  const pick = (setter: (v: string) => void, value: string) => {
    Haptics.impact();
    setter(value);
  };

  return (
    <LinearGradient colors={['#E1F5FE', '#F3E5F5']} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, IS_SMALL_PHONE && styles.scrollCompact]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Create Your Explorer!</Text>
          <Text style={styles.subtitle}>Make her look just like you 🌟</Text>

          {/* Live preview */}
          <View style={styles.previewBox}>
            <LinearGradient
              colors={['#B3E5FC', '#E1BEE7']}
              style={styles.previewGradient}
            >
              <LilaCharacter
                hairColor={hairColor}
                skinTone={skinTone}
                outfitColor={outfitColor}
                equippedHat="hat-explorer"
                size={CHAR_SIZE}
              />
              <Text style={styles.previewName}>{name.trim() || 'Lila'}</Text>
            </LinearGradient>
          </View>

          {/* Name input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Explorer Name</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name here…"
              placeholderTextColor={C.TEXT_LIGHT}
              maxLength={16}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>

          {/* Skin tone */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Skin Tone</Text>
            <View style={styles.dotRow}>
              {SKIN_TONES.map((c) => (
                <ColorDot
                  key={c}
                  color={c}
                  selected={skinTone === c}
                  onPress={() => pick(setSkinTone, c)}
                />
              ))}
            </View>
          </View>

          {/* Hair color */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Hair Color</Text>
            <View style={styles.dotRow}>
              {HAIR_COLORS.map((c) => (
                <ColorDot
                  key={c}
                  color={c}
                  selected={hairColor === c}
                  onPress={() => pick(setHairColor, c)}
                />
              ))}
            </View>
          </View>

          {/* Outfit color */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Outfit Color</Text>
            <View style={styles.dotRow}>
              {OUTFIT_COLORS.map((c) => (
                <ColorDot
                  key={c}
                  color={c}
                  selected={outfitColor === c}
                  onPress={() => pick(setOutfitColor, c)}
                />
              ))}
            </View>
          </View>

          <BigButton
            label={`Let's Explore, ${name.trim() || 'Lila'}!`}
            emoji="🚀"
            onPress={handleConfirm}
            color="pink"
            size="large"
            style={styles.confirmBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  scrollCompact: {
    paddingTop: 36,
    paddingBottom: 24,
  },
  header: {
    fontSize: 30,
    fontWeight: '900',
    color: C.UI_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: C.TEXT_MID,
    marginBottom: 24,
    fontWeight: '600',
  },
  previewBox: {
    width: width - 60,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  previewGradient: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  previewName: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '800',
    color: C.UI_DARK,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.TEXT_DARK,
    marginBottom: 10,
  },
  dotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  colorDotSelected: {
    borderColor: C.UI_DARK,
    transform: [{ scale: 1.18 }],
  },
  checkmark: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nameInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '700',
    color: C.TEXT_DARK,
    borderWidth: 2.5,
    borderColor: C.UI_PRIMARY,
    width: '100%',
  },
  confirmBtn: {
    marginTop: 8,
    width: '100%',
  },
});
