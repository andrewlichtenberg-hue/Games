import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { allWorlds } from '../game/worlds';
import { LevelCard } from '../components/LevelCard';
import { Haptics } from '../utils/haptics';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'LevelSelect'>;
  route: RouteProp<RootStackParamList, 'LevelSelect'>;
};

export function LevelSelectScreen({ navigation, route }: Props) {
  const { worldIndex } = route.params;
  const store = useGameStore();
  const world = allWorlds[worldIndex];

  const totalStars = store.starsForWorld(world.id);
  const maxStars = world.levels.length * 3;

  return (
    <LinearGradient colors={[world.gradientTop, world.gradientBottom]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.tap();
            navigation.goBack();
          }}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.worldName}>{world.name}</Text>
          <Text style={styles.worldSubtitle}>{world.subtitle}</Text>
        </View>

        <Text style={styles.worldEmoji}>{world.emoji}</Text>
      </View>

      {/* Star count */}
      <View style={styles.starBadge}>
        <Text style={styles.starText}>⭐ {totalStars}/{maxStars}</Text>
      </View>

      {/* Level cards */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {world.levels.map((level, index) => {
          const progress = store.levelProgress[level.id];
          const isCompleted = progress?.completed ?? false;
          const bestStars = progress?.bestStars ?? 0;
          const isLocked = !store.isLevelUnlocked(worldIndex, index);

          return (
            <LevelCard
              key={level.id}
              level={level}
              isCompleted={isCompleted}
              bestStars={bestStars}
              isLocked={isLocked}
              onPress={() => {
                if (isLocked) {
                  Haptics.error();
                  return;
                }
                Haptics.tap();
                store.selectLevel(index);
                navigation.navigate('Puzzle', { worldIndex, levelIndex: index });
              }}
            />
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#fff',
    marginTop: -2,
  },
  worldName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  worldSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  worldEmoji: {
    fontSize: 36,
  },
  starBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    marginVertical: 12,
  },
  starText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
});
