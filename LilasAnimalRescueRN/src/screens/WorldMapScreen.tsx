import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore } from '../store/gameStore';
import { allWorlds } from '../game/worlds';
import { WorldCard } from '../components/WorldCard';
import { C } from '../utils/colors';
import { Haptics } from '../utils/haptics';
import type { RootStackParamList } from '../../App';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'WorldMap'> };

export function WorldMapScreen({ navigation }: Props) {
  const store = useGameStore();
  const totalRescued = store.rescuedAnimalIds.length;
  const totalAnimals = allWorlds.flatMap(w => w.levels).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>World Map</Text>
          <Text style={styles.headerSubtitle}>Choose your adventure!</Text>
        </View>
        <TouchableOpacity
          style={styles.journalButton}
          onPress={() => {
            Haptics.tap();
            navigation.navigate('Journal');
          }}
        >
          <Text style={styles.journalIcon}>📖</Text>
          <Text style={styles.journalLabel}>Journal</Text>
        </TouchableOpacity>
      </View>

      {/* Rescue counter */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>🐾 {totalRescued}/{totalAnimals} animals rescued</Text>
      </View>

      {/* World cards */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {allWorlds.map((world, index) => {
          const isUnlocked = store.isWorldUnlocked(index);
          return (
            <WorldCard
              key={world.id}
              world={world}
              worldIndex={index}
              isUnlocked={isUnlocked}
              starsEarned={store.starsForWorld(world.id)}
              totalStars={world.levels.length * 3}
              completedLevels={store.completedLevelsInWorld(world.id)}
              previousWorldName={index > 0 ? allWorlds[index - 1].name : ''}
              onPress={() => {
                if (!isUnlocked) {
                  Haptics.error();
                  return;
                }
                Haptics.tap();
                store.selectWorld(index);
                navigation.navigate('LevelSelect', { worldIndex: index });
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  journalButton: {
    backgroundColor: C.WHITE,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: C.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  journalIcon: {
    fontSize: 20,
  },
  journalLabel: {
    fontSize: 9,
    color: C.GREEN_PRIMARY,
    fontWeight: '600',
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
  },
});
