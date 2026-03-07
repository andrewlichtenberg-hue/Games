import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Ellipse, Path, Rect, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { C } from '../utils/colors';
import { LOCATIONS, Location } from '../game/locations';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../audio/audioManager';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');
const MAP_W = width;
const MAP_H = height * 0.55;

type Props = { navigation: StackNavigationProp<RootStackParamList, 'WorldMap'> };

function MapPin({
  location,
  unlocked,
  visited,
  onPress,
}: {
  location: Location;
  unlocked: boolean;
  visited: boolean;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (unlocked && !visited) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [unlocked, visited]);

  const x = location.mapX * MAP_W;
  const y = location.mapY * MAP_H;
  const pinColor = unlocked ? location.accentColor : '#BDBDBD';

  return (
    <Animated.View
      style={[
        styles.pin,
        {
          left: x - 22,
          top: y - 44,
          transform: [{ scale: pulse }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          if (!unlocked) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.pinBubble, { backgroundColor: unlocked ? 'white' : '#EEE' }]}>
          {unlocked ? (
            <Text style={styles.pinEmoji}>
              {location.sceneType === 'park' ? '🌳' :
               location.sceneType === 'beach' ? '🏖️' :
               location.sceneType === 'forest' ? '🌲' :
               location.sceneType === 'mountain' ? '⛰️' : '🏙️'}
            </Text>
          ) : (
            <Text style={styles.pinEmoji}>🔒</Text>
          )}
        </View>
        <View style={[styles.pinStem, { backgroundColor: pinColor }]} />
        <Text
          style={[
            styles.pinLabel,
            { color: unlocked ? C.TEXT_DARK : C.TEXT_LIGHT },
          ]}
          numberOfLines={1}
        >
          {unlocked ? location.name : `Lv ${location.unlockLevel}`}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MapIllustration() {
  return (
    <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
      <Defs>
        <SvgGradient id="ocean" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1565C0" />
          <Stop offset="1" stopColor="#42A5F5" />
        </SvgGradient>
        <SvgGradient id="land" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#66BB6A" />
          <Stop offset="1" stopColor="#AED581" />
        </SvgGradient>
      </Defs>

      {/* Ocean background */}
      <Rect x={0} y={0} width={MAP_W} height={MAP_H} fill="url(#ocean)" />

      {/* Northeast US landmass (simplified) */}
      <Path
        d={`
          M ${MAP_W*0.3},0
          L ${MAP_W*0.9},0
          L ${MAP_W*0.9},${MAP_H*0.7}
          Q ${MAP_W*0.78},${MAP_H*0.85} ${MAP_W*0.65},${MAP_H*0.9}
          Q ${MAP_W*0.55},${MAP_H*0.95} ${MAP_W*0.45},${MAP_H*0.85}
          Q ${MAP_W*0.35},${MAP_H*0.75} ${MAP_W*0.3},${MAP_H*0.6}
          Z
        `}
        fill="url(#land)"
      />

      {/* Mountain ridges */}
      <Path
        d={`M ${MAP_W*0.4},${MAP_H*0.2} Q ${MAP_W*0.52},${MAP_H*0.1} ${MAP_W*0.64},${MAP_H*0.25}`}
        stroke="#8D6E63"
        strokeWidth={3}
        fill="none"
        opacity={0.4}
      />

      {/* Hudson River */}
      <Path
        d={`M ${MAP_W*0.59},0 Q ${MAP_W*0.6},${MAP_H*0.3} ${MAP_W*0.62},${MAP_H*0.55}`}
        stroke="#42A5F5"
        strokeWidth={5}
        fill="none"
        opacity={0.6}
      />

      {/* Atlantic coast detail */}
      <Path
        d={`M ${MAP_W*0.62},${MAP_H*0.45} Q ${MAP_W*0.68},${MAP_H*0.38} ${MAP_W*0.72},${MAP_H*0.3} Q ${MAP_W*0.74},${MAP_H*0.2} ${MAP_W*0.7},${MAP_H*0.1}`}
        stroke="#90CAF9"
        strokeWidth={3}
        fill="none"
        opacity={0.5}
      />

      {/* Tiny wave marks */}
      {[0.1, 0.2, 0.25].map((y, i) => (
        <Path
          key={i}
          d={`M ${MAP_W*0.05},${MAP_H*y} Q ${MAP_W*0.12},${MAP_H*(y-0.02)} ${MAP_W*0.18},${MAP_H*y}`}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={2}
          fill="none"
        />
      ))}

      {/* NYC star */}
      <Circle cx={MAP_W*0.62} cy={MAP_H*0.51} r={6} fill="#FF6B9D" />
      <Circle cx={MAP_W*0.62} cy={MAP_H*0.51} r={3} fill="white" />
    </Svg>
  );
}

export function WorldMapScreen({ navigation }: Props) {
  const { unlockedLocations, visitedLocations, level } = useGameStore();

  useFocusEffect(
    React.useCallback(() => {
      audioManager.playMusic('theme');
    }, [])
  );

  const handleLocationPress = (location: Location) => {
    navigation.navigate('Exploration', { locationId: location.id });
  };

  return (
    <View style={styles.container}>
      {/* Map header */}
      <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗺️ Explorer Map</Text>
        <Text style={styles.subtitle}>Tap a location to explore!</Text>
      </LinearGradient>

      {/* Interactive map */}
      <View style={styles.mapContainer}>
        <MapIllustration />
        {LOCATIONS.map((loc) => {
          const unlocked = unlockedLocations.includes(loc.id);
          const visited = visitedLocations.includes(loc.id);
          return (
            <MapPin
              key={loc.id}
              location={loc}
              unlocked={unlocked}
              visited={visited}
              onPress={() => handleLocationPress(loc)}
            />
          );
        })}
      </View>

      {/* Location list below map */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.listHeader}>All Locations</Text>
        {LOCATIONS.map((loc) => {
          const unlocked = unlockedLocations.includes(loc.id);
          const visited = visitedLocations.includes(loc.id);
          return (
            <TouchableOpacity
              key={loc.id}
              style={[styles.listItem, !unlocked && styles.listItemLocked]}
              onPress={() => {
                if (unlocked) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleLocationPress(loc);
                }
              }}
              activeOpacity={unlocked ? 0.75 : 1}
            >
              <Text style={styles.listEmoji}>
                {!unlocked ? '🔒' :
                  loc.sceneType === 'park' ? '🌳' :
                  loc.sceneType === 'beach' ? '🏖️' :
                  loc.sceneType === 'forest' ? '🌲' :
                  loc.sceneType === 'mountain' ? '⛰️' : '🏙️'}
              </Text>
              <View style={styles.listText}>
                <Text style={[styles.listName, !unlocked && { color: C.TEXT_LIGHT }]}>
                  {loc.name}
                </Text>
                <Text style={styles.listSub}>
                  {unlocked
                    ? `${loc.animalIds.length} animals • ${visited ? '✓ Visited' : 'Not yet visited'}`
                    : `Unlocks at Level ${loc.unlockLevel}`}
                </Text>
              </View>
              {unlocked && (
                <Text style={[styles.listArrow, { color: loc.accentColor }]}>›</Text>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD' },
  header: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  backBtn: { marginBottom: 6 },
  backText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: 'white',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 2,
  },
  mapContainer: {
    height: MAP_H,
    width: MAP_W,
    position: 'relative',
    overflow: 'hidden',
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    width: 44,
  },
  pinBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinEmoji: { fontSize: 20 },
  pinStem: {
    width: 3,
    height: 8,
    alignSelf: 'center',
    borderRadius: 2,
  },
  pinLabel: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    width: 60,
    marginLeft: -8,
  },
  list: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: C.TEXT_DARK,
    paddingTop: 14,
    paddingBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listItemLocked: {
    opacity: 0.5,
  },
  listEmoji: { fontSize: 24, marginRight: 12 },
  listText: { flex: 1 },
  listName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.TEXT_DARK,
  },
  listSub: {
    fontSize: 12,
    color: C.TEXT_MID,
    marginTop: 2,
    fontWeight: '600',
  },
  listArrow: {
    fontSize: 24,
    fontWeight: '700',
  },
});
