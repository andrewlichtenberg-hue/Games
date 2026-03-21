import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { GridPosition, CellType, OBSTACLE_EMOJI } from '../game/types';
import { C } from '../utils/colors';

interface GridCellProps {
  position: GridPosition;
  cellType: CellType;
  isOnPath: boolean;
  isAnimated: boolean;
  isCollectedStar: boolean;
  animalEmoji: string;
  isStart: boolean;
  isHabitat: boolean;
  cellSize: number;
  onPress: () => void;
}

export function GridCell({
  position,
  cellType,
  isOnPath,
  isAnimated,
  isCollectedStar,
  animalEmoji,
  isStart,
  isHabitat,
  cellSize,
  onPress,
}: GridCellProps) {
  const backgroundColor = isStart
    ? C.ANIMAL_HIGHLIGHT
    : isHabitat
    ? C.HABITAT_HIGHLIGHT
    : isOnPath
    ? 'rgba(255,183,77,0.6)'
    : 'rgba(255,255,255,0.9)';

  const borderColor = isOnPath ? C.PATH_STROKE : 'rgba(128,128,128,0.2)';
  const borderWidth = isOnPath ? 2 : 0.5;

  let content = '';
  if (cellType.kind === 'animalStart') {
    content = animalEmoji;
  } else if (cellType.kind === 'habitat') {
    content = '🏠';
  } else if (cellType.kind === 'obstacle') {
    content = OBSTACLE_EMOJI[cellType.obstacle];
  } else if (cellType.kind === 'star') {
    content = isCollectedStar ? '' : '⭐';
  }

  const fontSize = cellSize * 0.55;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor,
          borderColor,
          borderWidth,
          borderRadius: 6,
        },
        isOnPath && styles.pathShadow,
      ]}
    >
      {content !== '' && (
        <Text style={{ fontSize, textAlign: 'center' }}>{content}</Text>
      )}
      {isAnimated && !isHabitat && (
        <Text style={[styles.walkingAnimal, { fontSize: cellSize * 0.45 }]}>
          {animalEmoji}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathShadow: {
    shadowColor: C.PATH_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  walkingAnimal: {
    position: 'absolute',
  },
});
