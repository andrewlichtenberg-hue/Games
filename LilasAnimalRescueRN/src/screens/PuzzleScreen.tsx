import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { allWorlds } from '../game/worlds';
import { posEqual, posKey } from '../game/types';
import { GridCell } from '../components/GridCell';
import { LevelCompleteOverlay } from '../components/LevelCompleteOverlay';
import { C } from '../utils/colors';
import { Haptics } from '../utils/haptics';
import { audioManager } from '../audio/audioManager';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Puzzle'>;
  route: RouteProp<RootStackParamList, 'Puzzle'>;
};

export function PuzzleScreen({ navigation, route }: Props) {
  const { worldIndex, levelIndex } = route.params;
  const store = useGameStore();
  const { width: screenWidth } = useWindowDimensions();

  const world = allWorlds[worldIndex];
  const level = world.levels[levelIndex];
  const { path, collectedStars, isAnimatingPath, animationStep, showLevelComplete, lastResult } = store;

  const isPathComplete = store.isPathComplete();

  // Grid sizing
  const gridPadding = 8;
  const screenPadding = 16;
  const spacing = 3;
  const availableWidth = screenWidth - screenPadding * 2 - gridPadding * 2;
  const rawCellSize = (availableWidth - (level.gridSize - 1) * spacing) / level.gridSize;
  const cellSize = Math.min(rawCellSize, 80);

  // Start world-specific music
  React.useEffect(() => {
    const trackMap: Record<string, 'park' | 'forest' | 'beach' | 'mountain'> = {
      'city-park': 'park',
      'forest': 'forest',
      'beach': 'beach',
      'tropical': 'mountain',
    };
    audioManager.playMusic(trackMap[world.id] ?? 'park');
  }, [world.id]);

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
          <Text style={styles.levelTitle}>{level.title}</Text>
          <Text style={styles.levelSub}>Level {level.levelNumber} · {world.name}</Text>
        </View>

        <View style={styles.starBadge}>
          <Text style={styles.starBadgeText}>⭐ {collectedStars.length}/{level.starPositions.length}</Text>
        </View>
      </View>

      {/* Animal greeting */}
      <View style={styles.greetingBar}>
        <Text style={styles.greetingEmoji}>{level.animal.emoji}</Text>
        <Text style={styles.greetingText}>{level.animal.greeting}</Text>
      </View>

      {/* Grid */}
      <View style={[styles.gridContainer, { padding: gridPadding }]}>
        {Array.from({ length: level.gridSize }, (_, row) => (
          <View key={row} style={[styles.gridRow, { gap: spacing }]}>
            {Array.from({ length: level.gridSize }, (_, col) => {
              const pos = { row, col };
              const pathIndex = path.findIndex(p => posEqual(p, pos));
              const isOnPath = pathIndex >= 0;
              const isAnimated = isAnimatingPath && pathIndex >= 0 && pathIndex < animationStep;
              const isStart = posEqual(pos, level.startPosition);
              const isHabitat = posEqual(pos, level.habitatPosition);

              return (
                <GridCell
                  key={`${row}-${col}`}
                  position={pos}
                  cellType={level.grid[row][col]}
                  isOnPath={isOnPath}
                  isAnimated={isAnimated}
                  isCollectedStar={collectedStars.includes(posKey(pos))}
                  animalEmoji={level.animal.emoji}
                  isStart={isStart}
                  isHabitat={isHabitat}
                  cellSize={cellSize}
                  onPress={() => {
                    Haptics.tap();
                    audioManager.playSfx('tap');
                    store.tapCell(pos);
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            Haptics.tap();
            store.resetPuzzle();
          }}
          disabled={isAnimatingPath}
        >
          <Text style={styles.resetText}>↺ Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.goButton, {
            backgroundColor: isPathComplete ? '#4CAF50' : 'rgba(255,255,255,0.15)',
          }]}
          onPress={() => {
            Haptics.success();
            audioManager.playSfx('success');
            store.animatePath();
          }}
          disabled={!isPathComplete || isAnimatingPath}
        >
          <Text style={[styles.goText, {
            opacity: isPathComplete ? 1 : 0.5,
          }]}>🐾 Go!</Text>
        </TouchableOpacity>
      </View>

      {/* Level Complete Overlay */}
      {showLevelComplete && lastResult && (
        <LevelCompleteOverlay
          result={lastResult}
          animal={level.animal}
          onNextLevel={() => {
            audioManager.playSfx('levelup');
            const nextIndex = levelIndex + 1;
            if (nextIndex < world.levels.length) {
              store.selectLevel(nextIndex);
              navigation.replace('Puzzle', { worldIndex, levelIndex: nextIndex });
            } else {
              navigation.goBack();
            }
          }}
          onRetry={() => {
            Haptics.tap();
            store.resetPuzzle();
          }}
        />
      )}
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
    gap: 10,
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
  levelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  levelSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  starBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  starBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  greetingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    gap: 10,
  },
  greetingEmoji: {
    fontSize: 32,
  },
  greetingText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
  },
  gridContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    shadowColor: C.CARD_SHADOW,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
    marginHorizontal: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 24,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  goButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  goText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
