/**
 * AnimalSprite — SVG-drawn animal characters.
 * Each animal type has its own cute illustration.
 */
import React from 'react';
import Svg, { Circle, Ellipse, Path, G, Rect } from 'react-native-svg';
import { AnimalType } from '../game/animals';

interface AnimalSpriteProps {
  type: AnimalType;
  size?: number;
  bodyColor?: string;
  accentColor?: string;
  bouncing?: boolean;
}

export function AnimalSprite({ type, size = 80, bodyColor, accentColor }: AnimalSpriteProps) {
  const scale = size / 100;
  const renderer = ANIMAL_RENDERERS[type] ?? ANIMAL_RENDERERS['squirrel']!;
  const colors = { body: bodyColor ?? '#888', accent: accentColor ?? '#EEE' };

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {renderer(colors)}
    </Svg>
  );
}

type Colors = { body: string; accent: string };
type Renderer = (colors: Colors) => React.ReactNode;

const ANIMAL_RENDERERS: Partial<Record<AnimalType, Renderer>> = {
  squirrel: ({ body, accent }) => (
    <G>
      {/* Big fluffy tail */}
      <Path d="M 60,55 Q 90,40 88,20 Q 82,10 72,18 Q 80,25 78,40 Q 72,52 60,55 Z" fill={body} />
      <Path d="M 62,53 Q 86,40 84,22 Q 80,28 76,38 Q 70,50 62,53 Z" fill={accent} />
      {/* Body */}
      <Ellipse cx={45} cy={65} rx={22} ry={20} fill={body} />
      {/* Head */}
      <Circle cx={45} cy={42} r={20} fill={body} />
      {/* Ears */}
      <Path d="M 33,28 Q 30,15 38,18 Q 36,24 35,28 Z" fill={body} />
      <Path d="M 55,26 Q 58,13 64,16 Q 60,22 57,26 Z" fill={body} />
      <Path d="M 35,26 Q 33,18 38,19 Q 37,22 36,26 Z" fill="#FFB6C1" />
      {/* Eyes */}
      <Circle cx={40} cy={40} r={5} fill="white" />
      <Circle cx={52} cy={40} r={5} fill="white" />
      <Circle cx={41} cy={41} r={3} fill="#2C1810" />
      <Circle cx={53} cy={41} r={3} fill="#2C1810" />
      <Circle cx={42} cy={39} r={1.5} fill="white" />
      <Circle cx={54} cy={39} r={1.5} fill="white" />
      {/* Nose */}
      <Ellipse cx={46} cy={48} rx={3} ry={2} fill="#CC6677" />
      {/* Cheeks */}
      <Circle cx={35} cy={48} r={5} fill="rgba(255,150,150,0.3)" />
      <Circle cx={56} cy={48} r={5} fill="rgba(255,150,150,0.3)" />
      {/* Paws */}
      <Circle cx={30} cy={75} r={7} fill={body} />
      <Circle cx={60} cy={78} r={7} fill={body} />
    </G>
  ),

  dog: ({ body, accent }) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={68} rx={24} ry={20} fill={body} />
      {/* Wagging tail */}
      <Path d="M 72,62 Q 88,50 90,38 Q 88,34 84,38 Q 82,48 70,58 Z" fill={body} />
      {/* Head */}
      <Circle cx={45} cy={40} r={24} fill={body} />
      {/* Floppy ears */}
      <Ellipse cx={24} cy={44} rx={9} ry={16} fill={darken(body, 0.12)} />
      <Ellipse cx={66} cy={44} rx={9} ry={16} fill={darken(body, 0.12)} />
      {/* Snout */}
      <Ellipse cx={45} cy={52} rx={12} ry={9} fill={accent} />
      {/* Eyes */}
      <Circle cx={37} cy={37} r={6} fill="white" />
      <Circle cx={54} cy={37} r={6} fill="white" />
      <Circle cx={38} cy={38} r={4} fill="#3D2B00" />
      <Circle cx={55} cy={38} r={4} fill="#3D2B00" />
      <Circle cx={39} cy={36} r={2} fill="white" />
      <Circle cx={56} cy={36} r={2} fill="white" />
      {/* Nose */}
      <Ellipse cx={45} cy={50} rx={5} ry={4} fill="#2C1810" />
      {/* Nostril details */}
      <Circle cx={43} cy={51} r={1.5} fill="#1A1A1A" />
      <Circle cx={47} cy={51} r={1.5} fill="#1A1A1A" />
      {/* Tongue */}
      <Ellipse cx={45} cy={57} rx={5} ry={4} fill="#FF6B9D" />
      {/* Paws */}
      <Circle cx={32} cy={80} r={8} fill={body} />
      <Circle cx={60} cy={82} r={8} fill={body} />
    </G>
  ),

  cat: ({ body, accent }) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={68} rx={22} ry={20} fill={body} />
      {/* Elegant tail */}
      <Path d="M 70,72 Q 90,60 88,44 Q 86,36 80,40 Q 82,50 80,62 Q 76,68 70,72 Z" fill={body} />
      {/* Head */}
      <Circle cx={48} cy={38} r={24} fill={body} />
      {/* Pointy ears */}
      <Path d="M 30,22 L 26,6 L 42,16 Z" fill={body} />
      <Path d="M 66,22 L 70,6 L 56,16 Z" fill={body} />
      <Path d="M 31,20 L 28,10 L 40,17 Z" fill="#FFB6C1" />
      <Path d="M 65,20 L 68,10 L 58,17 Z" fill="#FFB6C1" />
      {/* Almond eyes */}
      <Ellipse cx={39} cy={36} rx={8} ry={6} fill="#7CFC00" />
      <Ellipse cx={57} cy={36} rx={8} ry={6} fill="#7CFC00" />
      <Ellipse cx={39} cy={36} rx={3} ry={5} fill="#1A1A1A" />
      <Ellipse cx={57} cy={36} rx={3} ry={5} fill="#1A1A1A" />
      <Circle cx={38} cy={33} r={1.5} fill="white" />
      <Circle cx={56} cy={33} r={1.5} fill="white" />
      {/* Tiny nose */}
      <Path d="M 45,46 L 48,44 L 51,46 Q 48,48 45,46 Z" fill="#CC6677" />
      {/* Whiskers */}
      <Path d="M 24,46 L 40,48" stroke="#888" strokeWidth={1} />
      <Path d="M 24,50 L 40,50" stroke="#888" strokeWidth={1} />
      <Path d="M 56,48 L 72,46" stroke="#888" strokeWidth={1} />
      <Path d="M 56,50 L 72,50" stroke="#888" strokeWidth={1} />
      {/* Belly patch */}
      <Ellipse cx={50} cy={70} rx={12} ry={10} fill={accent} />
      {/* Paws */}
      <Circle cx={34} cy={80} r={7} fill={body} />
      <Circle cx={62} cy={82} r={7} fill={body} />
    </G>
  ),

  raccoon: ({ body, accent }) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={68} rx={23} ry={20} fill={body} />
      {/* Striped tail */}
      <Path d="M 71,65 Q 88,52 86,36 Q 84,28 78,32 Q 80,42 78,56 Q 74,62 71,65 Z" fill={body} />
      <Path d="M 72,63 Q 86,52 84,38 Q 82,44 80,54 Q 76,60 72,63 Z" fill={accent} />
      {/* Head */}
      <Circle cx={46} cy={38} r={24} fill={body} />
      {/* Mask */}
      <Ellipse cx={38} cy={37} rx={10} ry={7} fill="#1A1A1A" />
      <Ellipse cx={55} cy={37} rx={10} ry={7} fill="#1A1A1A" />
      {/* Eyes through mask */}
      <Circle cx={38} cy={37} r={6} fill="white" />
      <Circle cx={55} cy={37} r={6} fill="white" />
      <Circle cx={39} cy={38} r={4} fill="#3D2B00" />
      <Circle cx={56} cy={38} r={4} fill="#3D2B00" />
      <Circle cx={40} cy={36} r={2} fill="white" />
      <Circle cx={57} cy={36} r={2} fill="white" />
      {/* Nose */}
      <Ellipse cx={46} cy={48} rx={5} ry={4} fill="#2C2C2C" />
      {/* Ears */}
      <Circle cx={28} cy={22} r={10} fill={body} />
      <Circle cx={64} cy={22} r={10} fill={body} />
      <Circle cx={28} cy={22} r={6} fill="#FFB6C1" />
      <Circle cx={64} cy={22} r={6} fill="#FFB6C1" />
      {/* Paws */}
      <Circle cx={32} cy={80} r={7} fill={body} />
      <Circle cx={62} cy={82} r={7} fill={body} />
    </G>
  ),

  rabbit: ({ body, accent }) => (
    <G>
      {/* Tall ears */}
      <Ellipse cx={36} cy={18} rx={8} ry={22} fill={body} />
      <Ellipse cx={60} cy={16} rx={8} ry={22} fill={body} />
      <Ellipse cx={36} cy={18} rx={5} ry={18} fill="#FFB6C1" />
      <Ellipse cx={60} cy={16} rx={5} ry={18} fill="#FFB6C1" />
      {/* Body */}
      <Ellipse cx={50} cy={68} rx={24} ry={22} fill={body} />
      {/* Fluffy tail */}
      <Circle cx={72} cy={72} r={10} fill="white" />
      {/* Head */}
      <Circle cx={48} cy={44} r={22} fill={body} />
      {/* Eyes */}
      <Circle cx={40} cy={40} r={6} fill="#CC3366" />
      <Circle cx={56} cy={40} r={6} fill="#CC3366" />
      <Circle cx={40} cy={40} r={3} fill="#2C1810" />
      <Circle cx={56} cy={40} r={3} fill="#2C1810" />
      <Circle cx={41} cy={38} r={1.5} fill="white" />
      <Circle cx={57} cy={38} r={1.5} fill="white" />
      {/* Nose */}
      <Path d="M 44,50 L 48,48 L 52,50 Q 48,53 44,50 Z" fill="#CC3366" />
      {/* Twitchy whiskers */}
      <Path d="M 24,50 L 40,52" stroke="#888" strokeWidth={1} />
      <Path d="M 26,54 L 40,54" stroke="#888" strokeWidth={1} />
      <Path d="M 56,52 L 72,50" stroke="#888" strokeWidth={1} />
      <Path d="M 56,54 L 72,54" stroke="#888" strokeWidth={1} />
      {/* Paws */}
      <Circle cx={32} cy={82} r={8} fill={body} />
      <Circle cx={62} cy={84} r={8} fill={body} />
    </G>
  ),

  fox: ({ body, accent }) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={68} rx={22} ry={20} fill={body} />
      {/* Bushy tail */}
      <Path d="M 70,65 Q 92,48 90,28 Q 86,18 78,24 Q 82,34 80,52 Q 76,62 70,65 Z" fill={body} />
      <Path d="M 72,63 Q 88,50 86,32 Q 84,38 82,50 Q 78,60 72,63 Z" fill="white" />
      <Circle cx={82} cy={26} r={6} fill="white" />
      {/* Head */}
      <Circle cx={46} cy={38} r={23} fill={body} />
      {/* Pointed ears */}
      <Path d="M 28,22 L 22,4 L 40,16 Z" fill={body} />
      <Path d="M 64,22 L 68,4 L 56,16 Z" fill={body} />
      <Path d="M 30,21 L 26,8 L 38,17 Z" fill="#2C2C2C" />
      <Path d="M 63,21 L 67,8 L 58,17 Z" fill="#2C2C2C" />
      {/* White face marking */}
      <Ellipse cx={46} cy={48} rx={16} ry={12} fill="white" />
      {/* Eyes */}
      <Circle cx={37} cy={36} r={6} fill="#F9CA24" />
      <Circle cx={55} cy={36} r={6} fill="#F9CA24" />
      <Ellipse cx={37} cy={36} rx={2.5} ry={5} fill="#2C1810" />
      <Ellipse cx={55} cy={36} rx={2.5} ry={5} fill="#2C1810" />
      <Circle cx={37} cy={33} r={1.5} fill="white" />
      <Circle cx={55} cy={33} r={1.5} fill="white" />
      {/* Nose */}
      <Ellipse cx={46} cy={50} rx={4} ry={3} fill="#2C1810" />
      {/* Paws */}
      <Circle cx={34} cy={80} r={7} fill={body} />
      <Circle cx={62} cy={82} r={7} fill={body} />
    </G>
  ),

  owl: ({ body, accent }) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={65} rx={26} ry={28} fill={body} />
      {/* Wing details */}
      <Path d="M 24,60 Q 18,50 24,40 Q 30,50 32,60 Z" fill={darken(body, 0.1)} />
      <Path d="M 76,60 Q 82,50 76,40 Q 70,50 68,60 Z" fill={darken(body, 0.1)} />
      {/* Head */}
      <Circle cx={50} cy={34} r={26} fill={body} />
      {/* Ear tufts */}
      <Path d="M 34,14 L 30,2 L 42,12 Z" fill={body} />
      <Path d="M 66,14 L 70,2 L 58,12 Z" fill={body} />
      {/* Facial disc */}
      <Ellipse cx={50} cy={36} rx={20} ry={18} fill={accent} />
      {/* Big eyes */}
      <Circle cx={40} cy={32} r={10} fill="#F9CA24" />
      <Circle cx={60} cy={32} r={10} fill="#F9CA24" />
      <Circle cx={40} cy={32} r={7} fill="#1A1A1A" />
      <Circle cx={60} cy={32} r={7} fill="#1A1A1A" />
      <Circle cx={38} cy={29} r={2.5} fill="white" />
      <Circle cx={58} cy={29} r={2.5} fill="white" />
      {/* Beak */}
      <Path d="M 46,40 L 50,46 L 54,40 Z" fill="#C8A96E" />
      {/* Belly stripes */}
      <Path d="M 36,58 Q 50,54 64,58" stroke={darken(body, 0.15)} strokeWidth={2} fill="none" />
      <Path d="M 34,66 Q 50,62 66,66" stroke={darken(body, 0.15)} strokeWidth={2} fill="none" />
      <Path d="M 36,74 Q 50,70 64,74" stroke={darken(body, 0.15)} strokeWidth={2} fill="none" />
      {/* Feet */}
      <Path d="M 38,88 L 34,96 M 40,88 L 40,96 M 42,88 L 46,96" stroke="#C8A96E" strokeWidth={3} strokeLinecap="round" />
      <Path d="M 58,88 L 54,96 M 60,88 L 60,96 M 62,88 L 66,96" stroke="#C8A96E" strokeWidth={3} strokeLinecap="round" />
    </G>
  ),

  bear: ({ body, accent }) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={65} rx={28} ry={26} fill={body} />
      {/* Head */}
      <Circle cx={50} cy={36} r={28} fill={body} />
      {/* Round ears */}
      <Circle cx={26} cy={16} r={12} fill={body} />
      <Circle cx={74} cy={16} r={12} fill={body} />
      <Circle cx={26} cy={16} r={7} fill={darken(body, 0.15)} />
      <Circle cx={74} cy={16} r={7} fill={darken(body, 0.15)} />
      {/* Snout */}
      <Ellipse cx={50} cy={50} rx={16} ry={12} fill={accent} />
      {/* Eyes */}
      <Circle cx={38} cy={32} r={7} fill="white" />
      <Circle cx={62} cy={32} r={7} fill="white" />
      <Circle cx={39} cy={33} r={5} fill="#2C1810" />
      <Circle cx={63} cy={33} r={5} fill="#2C1810" />
      <Circle cx={40} cy={31} r={2} fill="white" />
      <Circle cx={64} cy={31} r={2} fill="white" />
      {/* Nose */}
      <Ellipse cx={50} cy={48} rx={6} ry={4} fill="#1A1A1A" />
      {/* Smile */}
      <Path d="M 44,56 Q 50,60 56,56" stroke="#3D2B00" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Paws */}
      <Circle cx={26} cy={80} r={10} fill={body} />
      <Circle cx={74} cy={82} r={10} fill={body} />
    </G>
  ),

  otter: ({ body, accent }) => (
    <G>
      {/* Streamlined body */}
      <Ellipse cx={50} cy={66} rx={22} ry={24} fill={body} />
      {/* Flat tail */}
      <Ellipse cx={72} cy={78} rx={16} ry={7} fill={darken(body, 0.1)} />
      {/* Head */}
      <Circle cx={46} cy={38} r={24} fill={body} />
      {/* Round ears */}
      <Circle cx={30} cy={22} r={10} fill={body} />
      <Circle cx={62} cy={20} r={10} fill={body} />
      <Circle cx={30} cy={22} r={5} fill="#CC9966" />
      <Circle cx={62} cy={20} r={5} fill="#CC9966" />
      {/* White face patch */}
      <Ellipse cx={46} cy={46} rx={18} ry={14} fill={accent} />
      {/* Eyes */}
      <Circle cx={37} cy={36} r={6} fill="white" />
      <Circle cx={56} cy={36} r={6} fill="white" />
      <Circle cx={38} cy={37} r={4} fill="#2C1810" />
      <Circle cx={57} cy={37} r={4} fill="#2C1810" />
      <Circle cx={39} cy={35} r={2} fill="white" />
      <Circle cx={58} cy={35} r={2} fill="white" />
      {/* Nose */}
      <Ellipse cx={46} cy={48} rx={5} ry={4} fill="#2C1810" />
      {/* Whiskers */}
      <Path d="M 24,48 L 38,50" stroke="#888" strokeWidth={1} />
      <Path d="M 54,50 L 68,48" stroke="#888" strokeWidth={1} />
      {/* Belly patch */}
      <Ellipse cx={50} cy={68} rx={12} ry={14} fill={accent} />
      {/* Paws */}
      <Ellipse cx={30} cy={80} rx={9} ry={6} fill={body} />
      <Ellipse cx={62} cy={82} rx={9} ry={6} fill={body} />
    </G>
  ),

  moose: ({ body, accent }) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={68} rx={28} ry={22} fill={body} />
      {/* Neck */}
      <Rect x={38} y={38} width={24} height={30} rx={8} fill={body} />
      {/* Antlers */}
      <Path d="M 24,18 L 20,4 M 20,4 L 14,10 M 20,4 L 26,8" stroke={body} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d="M 76,18 L 80,4 M 80,4 L 86,10 M 80,4 L 74,8" stroke={body} strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* Head */}
      <Ellipse cx={50} cy={32} rx={24} ry={20} fill={body} />
      {/* Long drooping snout */}
      <Ellipse cx={50} cy={46} rx={14} ry={10} fill={darken(body, 0.1)} />
      <Ellipse cx={50} cy={52} rx={10} ry={8} fill={darken(body, 0.15)} />
      {/* Eyes */}
      <Circle cx={36} cy={28} r={6} fill="white" />
      <Circle cx={62} cy={28} r={6} fill="white" />
      <Circle cx={37} cy={29} r={4} fill="#2C1810" />
      <Circle cx={63} cy={29} r={4} fill="#2C1810" />
      <Circle cx={38} cy={27} r={1.5} fill="white" />
      <Circle cx={64} cy={27} r={1.5} fill="white" />
      {/* Nostrils */}
      <Circle cx={46} cy={54} r={3} fill="#1A1A1A" />
      <Circle cx={54} cy={54} r={3} fill="#1A1A1A" />
      {/* Legs */}
      <Rect x={28} y={84} width={10} height={14} rx={5} fill={body} />
      <Rect x={44} y={86} width={10} height={12} rx={5} fill={body} />
      <Rect x={58} y={86} width={10} height={12} rx={5} fill={body} />
      <Rect x={72} y={84} width={10} height={14} rx={5} fill={body} />
    </G>
  ),

  // Fallback for other animal types — simple round critter
  pigeon: ({ body, accent }) => (
    <G>
      <Ellipse cx={50} cy={62} rx={20} ry={22} fill={body} />
      <Circle cx={50} cy={38} r={20} fill={body} />
      <Ellipse cx={50} cy={38} rx={16} ry={12} fill={accent} />
      <Circle cx={42} cy={32} r={5} fill="white" /><Circle cx={43} cy={33} r={3} fill="#CC3333" /><Circle cx={43.5} cy={31.5} r={1} fill="white" />
      <Circle cx={56} cy={32} r={5} fill="white" /><Circle cx={57} cy={33} r={3} fill="#CC3333" /><Circle cx={57.5} cy={31.5} r={1} fill="white" />
      <Path d="M 46,44 L 50,48 L 54,44 Z" fill="#C8A96E" />
      <Ellipse cx={50} cy={76} rx={14} ry={8} fill={darken(body, 0.15)} />
      <Path d="M 36,80 L 30,88 M 40,82 L 36,90 M 50,84 L 50,92 M 60,82 L 64,90 M 64,80 L 70,88" stroke="#CC9966" strokeWidth={2} strokeLinecap="round" />
    </G>
  ),

  deer: ({ body, accent }) => (
    <G>
      <Ellipse cx={50} cy={66} rx={24} ry={22} fill={body} />
      <Rect x={40} y={44} width={20} height={28} rx={8} fill={body} />
      <Circle cx={50} cy={34} r={22} fill={body} />
      <Path d="M 30,20 L 26,6 M 26,6 L 20,12" stroke={darken(body, 0.15)} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M 70,20 L 74,6 M 74,6 L 80,12" stroke={darken(body, 0.15)} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={40} cy={30} r={5} fill="white" /><Circle cx={41} cy={31} r={3} fill="#3D2B00" /><Circle cx={41.5} cy={29.5} r={1.5} fill="white" />
      <Circle cx={58} cy={30} r={5} fill="white" /><Circle cx={59} cy={31} r={3} fill="#3D2B00" /><Circle cx={59.5} cy={29.5} r={1.5} fill="white" />
      <Ellipse cx={50} cy={44} rx={10} ry={7} fill={accent} />
      <Ellipse cx={50} cy={46} rx={5} ry={3} fill="#2C1810" />
      {[28,40,56,68].map((x,i) => <Rect key={i} x={x} y={84} width={8} height={14} rx={4} fill={darken(body,0.1)} />)}
    </G>
  ),
};

// Stub renderers for remaining types (friendly blobs with face)
const STUB_TYPES: AnimalType[] = ['robin','sparrow','hawk','seagull','sandpiper','beachcat','chipmunk','beaver','heron','groundhog','firefly','seal','plover','coyote','porcupine','falcon','lynx','turtle','pelican','dolphin','woodpecker','turkey','hummingbird','bluebird','skunk','bobcat','loon','wolf','whale','eagle'];
STUB_TYPES.forEach((t) => {
  if (!ANIMAL_RENDERERS[t]) {
    ANIMAL_RENDERERS[t] = ({ body, accent }) => (
      <G>
        <Ellipse cx={50} cy={65} rx={25} ry={22} fill={body} />
        <Circle cx={50} cy={38} r={24} fill={body} />
        <Circle cx={40} cy={33} r={6} fill="white" /><Circle cx={41} cy={34} r={4} fill="#2C1810" /><Circle cx={41.5} cy={32.5} r={1.5} fill="white" />
        <Circle cx={60} cy={33} r={6} fill="white" /><Circle cx={61} cy={34} r={4} fill="#2C1810" /><Circle cx={61.5} cy={32.5} r={1.5} fill="white" />
        <Ellipse cx={50} cy={46} rx={8} ry={6} fill={accent} />
        <Ellipse cx={50} cy={48} rx={4} ry={3} fill="#2C1810" />
        <Path d="M 43,54 Q 50,60 57,54" stroke="#C06040" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Circle cx={33} cy={78} r={9} fill={body} />
        <Circle cx={67} cy={80} r={9} fill={body} />
      </G>
    );
  }
});

function darken(hex: string, amount: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `#${clamp(r*(1-amount)).toString(16).padStart(2,'0')}${clamp(g*(1-amount)).toString(16).padStart(2,'0')}${clamp(b*(1-amount)).toString(16).padStart(2,'0')}`;
}
