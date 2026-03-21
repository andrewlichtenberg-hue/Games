import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore } from '../store/gameStore';
import { allWorlds } from '../game/worlds';
import { Animal } from '../game/types';
import { AnimalCard } from '../components/AnimalCard';
import { FunFactCard } from '../components/FunFactCard';
import { C } from '../utils/colors';
import { Haptics } from '../utils/haptics';
import type { RootStackParamList } from '../../App';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Journal'> };

export function JournalScreen({ navigation }: Props) {
  const store = useGameStore();
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  const allAnimals = allWorlds.flatMap(w => w.levels).map(l => l.animal);

  return (
    <View style={styles.container}>
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
          <Text style={styles.title}>Animal Journal</Text>
          <Text style={styles.subtitle}>
            {store.rescuedAnimalIds.length}/{allAnimals.length} rescued
          </Text>
        </View>

        <Text style={styles.headerEmoji}>📖</Text>
      </View>

      {/* Animal grid grouped by world */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {allWorlds.map(world => (
          <View key={world.id} style={styles.worldSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{world.emoji}</Text>
              <Text style={styles.sectionName}>{world.name}</Text>
            </View>

            <View style={styles.animalGrid}>
              {world.levels.map(level => {
                const isRescued = store.rescuedAnimalIds.includes(level.animal.id);
                return (
                  <AnimalCard
                    key={level.animal.id}
                    animal={level.animal}
                    isRescued={isRescued}
                    onPress={() => {
                      Haptics.tap();
                      setSelectedAnimal(level.animal);
                    }}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Detail overlay */}
      <Modal
        visible={selectedAnimal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAnimal(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.overlay}
          onPress={() => setSelectedAnimal(null)}
        >
          <View style={styles.overlayCard}>
            {selectedAnimal && <FunFactCard animal={selectedAnimal} />}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  backText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333',
    marginTop: -2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  headerEmoji: {
    fontSize: 32,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  worldSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 360,
  },
});
