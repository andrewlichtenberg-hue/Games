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

// ── Birds ────────────────────────────────────────────────────────────────────

Object.assign(ANIMAL_RENDERERS, {

  robin: ({ body, accent }: Colors) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={64} rx={20} ry={22} fill={body} />
      {/* Red-orange breast */}
      <Ellipse cx={50} cy={68} rx={16} ry={17} fill={accent} />
      {/* Head */}
      <Circle cx={50} cy={36} r={20} fill={body} />
      {/* Eye */}
      <Circle cx={58} cy={32} r={5} fill="white" /><Circle cx={59} cy={33} r={3.5} fill="#1A1A1A" /><Circle cx={59.5} cy={31.5} r={1.2} fill="white" />
      {/* Yellow beak */}
      <Path d="M 66,34 L 76,32 L 66,37 Z" fill="#E8B820" />
      {/* Stub tail */}
      <Path d="M 32,76 Q 22,80 20,72 Q 28,74 32,72 Z" fill={darken(body, 0.15)} />
      {/* Wing hint */}
      <Ellipse cx={40} cy={62} rx={10} ry={7} fill={darken(body, 0.1)} transform="rotate(-15 40 62)" />
    </G>
  ),

  sparrow: ({ body, accent }: Colors) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={64} rx={20} ry={22} fill={body} />
      {/* White belly */}
      <Ellipse cx={50} cy={70} rx={13} ry={15} fill={accent} />
      {/* Head */}
      <Circle cx={50} cy={36} r={18} fill={body} />
      {/* Eye */}
      <Circle cx={57} cy={32} r={4} fill="white" /><Circle cx={58} cy={33} r={2.5} fill="#1A1A1A" /><Circle cx={58.5} cy={32} r={1} fill="white" />
      {/* Short conical beak */}
      <Path d="M 64,34 L 74,32 L 64,37 Z" fill="#C8A030" />
      {/* Wing stripes */}
      <Path d="M 34,58 Q 50,54 60,58" stroke={darken(body, 0.2)} strokeWidth={2} fill="none" />
      <Path d="M 34,64 Q 50,60 60,64" stroke={darken(body, 0.2)} strokeWidth={2} fill="none" />
      {/* Tail */}
      <Path d="M 32,78 Q 20,82 18,74 Q 26,76 32,72 Z" fill={darken(body, 0.12)} />
    </G>
  ),

  hawk: ({ body, accent }: Colors) => (
    <G>
      {/* Spread wings */}
      <Path d="M 8,44 Q 20,30 36,48 Q 28,52 8,44 Z" fill={body} />
      <Path d="M 92,44 Q 80,30 64,48 Q 72,52 92,44 Z" fill={body} />
      {/* Body */}
      <Ellipse cx={50} cy={58} rx={18} ry={22} fill={body} />
      {/* Streaked belly */}
      <Ellipse cx={50} cy={64} rx={13} ry={15} fill={accent} />
      <Path d="M 44,56 L 44,76" stroke={darken(body, 0.2)} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M 50,54 L 50,78" stroke={darken(body, 0.2)} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M 56,56 L 56,76" stroke={darken(body, 0.2)} strokeWidth={1.5} strokeLinecap="round" />
      {/* Head */}
      <Circle cx={50} cy={34} r={18} fill={body} />
      {/* Yellow fierce eye */}
      <Circle cx={58} cy={30} r={6} fill="#F9CA24" /><Circle cx={59} cy={31} r={4} fill="#1A1A1A" /><Circle cx={59.5} cy={30} r={1.5} fill="white" />
      {/* Hooked beak */}
      <Path d="M 62,36 Q 72,34 70,42 Q 64,40 62,36 Z" fill="#C8A030" />
      {/* Talons */}
      <Path d="M 42,80 L 38,90 M 46,82 L 44,92 M 54,82 L 56,92 M 58,80 L 62,90" stroke="#C8A030" strokeWidth={2.5} strokeLinecap="round" />
    </G>
  ),

  seagull: ({ body, accent }: Colors) => (
    <G>
      {/* Wings */}
      <Path d="M 10,40 Q 30,28 46,42 Q 30,46 10,40 Z" fill={body} />
      <Path d="M 90,40 Q 70,28 54,42 Q 70,46 90,40 Z" fill={body} />
      {/* Wing tips dark */}
      <Path d="M 10,40 Q 18,30 24,38 Z" fill={darken(body, 0.25)} />
      <Path d="M 90,40 Q 82,30 76,38 Z" fill={darken(body, 0.25)} />
      {/* Body */}
      <Ellipse cx={50} cy={60} rx={18} ry={22} fill={accent} />
      {/* Head */}
      <Circle cx={50} cy={36} r={18} fill={accent} />
      {/* Eye */}
      <Circle cx={58} cy={32} r={4} fill="#1A1A1A" /><Circle cx={59} cy={31} r={1.2} fill="white" />
      {/* Orange beak with red spot */}
      <Path d="M 62,34 L 76,33 L 76,38 L 62,38 Z" fill="#E8780A" rx={2} />
      <Circle cx={72} cy={37} r={2} fill="#CC2200" />
      {/* Webbed feet */}
      <Path d="M 42,82 L 36,90 M 46,84 L 42,94 M 50,84 L 50,94 M 54,84 L 58,94 M 58,82 L 64,90" stroke="#E8780A" strokeWidth={2} strokeLinecap="round" />
    </G>
  ),

  sandpiper: ({ body, accent }: Colors) => (
    <G>
      {/* Body — small and round */}
      <Ellipse cx={50} cy={58} rx={18} ry={16} fill={body} />
      {/* White underside */}
      <Ellipse cx={50} cy={62} rx={13} ry={10} fill={accent} />
      {/* Head */}
      <Circle cx={62} cy={40} r={15} fill={body} />
      {/* Eye */}
      <Circle cx={68} cy={36} r={4} fill="white" /><Circle cx={69} cy={37} r={2.5} fill="#1A1A1A" /><Circle cx={69.5} cy={36} r={1} fill="white" />
      {/* Long thin beak */}
      <Path d="M 74,38 L 100,36 L 100,40 L 74,41 Z" fill={darken(body, 0.2)} />
      {/* Long thin legs */}
      <Path d="M 40,72 L 38,92" stroke={darken(body, 0.3)} strokeWidth={2} strokeLinecap="round" />
      <Path d="M 52,72 L 54,92" stroke={darken(body, 0.3)} strokeWidth={2} strokeLinecap="round" />
      {/* Feet */}
      <Path d="M 38,92 L 32,96 M 38,92 L 40,97 M 38,92 L 44,96" stroke={darken(body, 0.3)} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M 54,92 L 48,96 M 54,92 L 56,97 M 54,92 L 60,96" stroke={darken(body, 0.3)} strokeWidth={1.5} strokeLinecap="round" />
      {/* Tail */}
      <Path d="M 34,60 Q 22,58 20,52 Q 30,56 34,54 Z" fill={darken(body, 0.1)} />
    </G>
  ),

  falcon: ({ body, accent }: Colors) => (
    <G>
      {/* Pointed wings (folded) */}
      <Path d="M 18,52 Q 28,36 42,52 Z" fill={body} />
      <Path d="M 82,52 Q 72,36 58,52 Z" fill={body} />
      {/* Body */}
      <Ellipse cx={50} cy={60} rx={17} ry={22} fill={body} />
      {/* Pale belly with streaks */}
      <Ellipse cx={50} cy={66} rx={12} ry={15} fill={accent} />
      <Path d="M 45,58 L 45,78" stroke={darken(body, 0.25)} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M 50,56 L 50,80" stroke={darken(body, 0.25)} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M 55,58 L 55,78" stroke={darken(body, 0.25)} strokeWidth={1.5} strokeLinecap="round" />
      {/* Head */}
      <Circle cx={50} cy={34} r={18} fill={body} />
      {/* Mustache marking */}
      <Path d="M 58,38 Q 64,40 68,46 Q 60,44 58,38 Z" fill={darken(body, 0.35)} />
      {/* Eye */}
      <Circle cx={58} cy={30} r={6} fill="#F9CA24" /><Circle cx={59} cy={31} r={4} fill="#1A1A1A" /><Circle cx={59.5} cy={30} r={1.5} fill="white" />
      {/* Hooked beak */}
      <Path d="M 62,34 Q 72,32 70,40 Q 64,38 62,34 Z" fill="#C8A030" />
    </G>
  ),

  woodpecker: ({ body, accent }: Colors) => (
    <G>
      {/* Tree trunk behind bird */}
      <Rect x={58} y={20} width={20} height={80} rx={6} fill="#8B5E3C" />
      <Path d="M 62,20 L 62,100" stroke="#7B4F2E" strokeWidth={1.5} />
      <Path d="M 70,20 L 70,100" stroke="#7B4F2E" strokeWidth={1.5} />
      {/* Body clinging to trunk */}
      <Ellipse cx={46} cy={64} rx={18} ry={22} fill={body} />
      {/* White/accent belly */}
      <Ellipse cx={44} cy={68} rx={12} ry={16} fill={accent} />
      {/* Head */}
      <Circle cx={46} cy={36} r={18} fill={body} />
      {/* Red crown */}
      <Path d="M 36,22 Q 46,10 58,22 Q 52,20 46,20 Q 40,20 36,22 Z" fill="#CC0000" />
      {/* Eye */}
      <Circle cx={54} cy={32} r={5} fill="white" /><Circle cx={55} cy={33} r={3.5} fill="#1A1A1A" /><Circle cx={55.5} cy={32} r={1} fill="white" />
      {/* Strong chisel beak */}
      <Path d="M 60,34 L 82,30 L 82,38 L 60,38 Z" fill="#C8A030" />
      {/* Gripping feet */}
      <Path d="M 58,58 L 66,56 M 58,64 L 66,62 M 58,70 L 66,68" stroke={darken(body, 0.3)} strokeWidth={2.5} strokeLinecap="round" />
    </G>
  ),

  hummingbird: ({ body, accent }: Colors) => (
    <G>
      {/* Blurred hovering wings (suggestion) */}
      <Ellipse cx={36} cy={44} rx={22} ry={10} fill="rgba(200,230,255,0.45)" transform="rotate(-20 36 44)" />
      <Ellipse cx={64} cy={44} rx={22} ry={10} fill="rgba(200,230,255,0.45)" transform="rotate(20 64 44)" />
      {/* Tiny body */}
      <Ellipse cx={50} cy={60} rx={12} ry={18} fill={body} />
      {/* Iridescent throat patch */}
      <Ellipse cx={50} cy={56} rx={9} ry={10} fill={accent} />
      {/* Tiny round head */}
      <Circle cx={50} cy={38} r={13} fill={body} />
      {/* Eye */}
      <Circle cx={56} cy={34} r={3.5} fill="white" /><Circle cx={57} cy={35} r={2.2} fill="#1A1A1A" /><Circle cx={57.5} cy={34} r={0.8} fill="white" />
      {/* Very long thin beak */}
      <Path d="M 60,37 L 98,34 L 98,40 L 60,40 Z" fill={darken(body, 0.2)} />
      {/* Tiny tail */}
      <Path d="M 44,76 Q 38,84 34,80 Q 40,78 44,74 Z" fill={darken(body, 0.15)} />
    </G>
  ),

  bluebird: ({ body, accent }: Colors) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={64} rx={20} ry={22} fill={body} />
      {/* Orange-red breast */}
      <Ellipse cx={50} cy={68} rx={14} ry={15} fill={accent} />
      {/* Head */}
      <Circle cx={50} cy={36} r={19} fill={body} />
      {/* Eye */}
      <Circle cx={58} cy={32} r={5} fill="white" /><Circle cx={59} cy={33} r={3.5} fill="#1A1A1A" /><Circle cx={59.5} cy={32} r={1.2} fill="white" />
      {/* Sweet small beak */}
      <Path d="M 64,34 L 74,33 L 74,38 L 64,38 Z" fill="#C8A030" />
      {/* Wing fold */}
      <Path d="M 32,56 Q 50,50 62,56 Q 50,62 32,56 Z" fill={darken(body, 0.15)} />
      {/* Tail */}
      <Path d="M 32,76 Q 20,82 18,74 Q 28,76 32,72 Z" fill={darken(body, 0.1)} />
    </G>
  ),

  eagle: ({ body, accent }: Colors) => (
    <G>
      {/* Majestic spread wings */}
      <Path d="M 4,44 Q 22,24 40,46 Q 24,52 4,44 Z" fill={body} />
      <Path d="M 96,44 Q 78,24 60,46 Q 76,52 96,44 Z" fill={body} />
      {/* Body */}
      <Ellipse cx={50} cy={62} rx={18} ry={22} fill={body} />
      {/* White tail */}
      <Ellipse cx={50} cy={80} rx={12} ry={8} fill={accent} />
      {/* White head */}
      <Circle cx={50} cy={34} r={19} fill={accent} />
      {/* Fierce eye */}
      <Circle cx={58} cy={30} r={6} fill="#F9CA24" /><Circle cx={59} cy={31} r={4} fill="#1A1A1A" /><Circle cx={59.5} cy={30} r={1.5} fill="white" />
      {/* Large yellow hooked beak */}
      <Path d="M 62,34 Q 78,30 76,42 Q 66,40 62,34 Z" fill="#F9CA24" />
      {/* Yellow talons */}
      <Path d="M 40,84 L 34,94 M 46,86 L 44,96 M 54,86 L 56,96 M 60,84 L 66,94" stroke="#F9CA24" strokeWidth={3} strokeLinecap="round" />
    </G>
  ),

  loon: ({ body, accent }: Colors) => (
    <G>
      {/* Low-riding body on water */}
      <Ellipse cx={50} cy={66} rx={28} ry={18} fill={body} />
      {/* Checkered pattern */}
      {[32,40,48,56,64].map((x, i) => (
        <Rect key={i} x={x} y={54 + (i % 2) * 6} width={6} height={6} rx={1} fill={accent} />
      ))}
      {/* White belly */}
      <Ellipse cx={50} cy={72} rx={20} ry={10} fill={accent} />
      {/* Head */}
      <Circle cx={64} cy={42} r={18} fill={body} />
      {/* Red eye */}
      <Circle cx={70} cy={38} r={5} fill="#CC0000" /><Circle cx={71} cy={39} r={3} fill="#8B0000" /><Circle cx={71.5} cy={38} r={1} fill="white" />
      {/* Dagger beak */}
      <Path d="M 78,40 L 100,38 L 100,43 L 78,44 Z" fill={darken(body, 0.2)} />
      {/* White neck ring */}
      <Path d="M 52,52 Q 64,48 76,54" stroke={accent} strokeWidth={4} fill="none" strokeLinecap="round" />
    </G>
  ),

  pelican: ({ body, accent }: Colors) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={64} rx={24} ry={24} fill={accent} />
      {/* Wing */}
      <Ellipse cx={50} cy={60} rx={22} ry={12} fill={body} />
      {/* Head */}
      <Circle cx={56} cy={34} r={18} fill={accent} />
      {/* Eye */}
      <Circle cx={62} cy={30} r={4} fill="white" /><Circle cx={63} cy={31} r={2.5} fill="#1A1A1A" /><Circle cx={63.5} cy={30} r={1} fill="white" />
      {/* Enormous beak + pouch */}
      <Path d="M 70,32 L 100,28 L 100,42 L 70,44 Z" fill="#E8780A" />
      {/* Throat pouch */}
      <Path d="M 70,44 Q 90,50 92,44 L 100,42 L 100,46 Q 88,56 70,48 Z" fill="#C85800" />
      {/* Tiny tail */}
      <Path d="M 28,70 Q 16,72 14,64 Q 24,68 28,64 Z" fill={darken(body, 0.15)} />
    </G>
  ),

  turkey: ({ body, accent }: Colors) => (
    <G>
      {/* Fan of tail feathers */}
      {[-50,-30,-10,10,30,50].map((angle, i) => (
        <Ellipse key={i} cx={50} cy={52} rx={6} ry={26}
          fill={[accent, body, '#CC4400', accent, body, '#CC4400'][i]}
          transform={`rotate(${angle} 50 52)`} />
      ))}
      {/* Body */}
      <Ellipse cx={50} cy={66} rx={20} ry={20} fill={body} />
      {/* Iridescent sheen */}
      <Ellipse cx={46} cy={62} rx={10} ry={12} fill="rgba(100,60,150,0.2)" />
      {/* Head */}
      <Circle cx={50} cy={38} r={14} fill={body} />
      {/* Red wattle */}
      <Path d="M 56,42 Q 62,48 58,54 Q 54,50 56,44 Z" fill="#CC0000" />
      {/* Eye */}
      <Circle cx={56} cy={34} r={4} fill="white" /><Circle cx={57} cy={35} r={2.5} fill="#1A1A1A" />
      {/* Beak */}
      <Path d="M 60,36 L 70,34 L 70,40 L 60,40 Z" fill="#C8A030" />
      {/* Feet */}
      <Path d="M 40,86 L 36,96 M 44,88 L 42,98 M 56,88 L 58,98 M 60,86 L 64,96" stroke="#C8A030" strokeWidth={2.5} strokeLinecap="round" />
    </G>
  ),

  plover: ({ body, accent }: Colors) => (
    <G>
      {/* Compact round body */}
      <Ellipse cx={50} cy={62} rx={20} ry={18} fill={body} />
      {/* White belly */}
      <Ellipse cx={50} cy={66} rx={14} ry={12} fill={accent} />
      {/* Black chest band */}
      <Path d="M 32,58 Q 50,52 68,58 Q 68,64 50,64 Q 32,64 32,58 Z" fill="#1A1A1A" />
      {/* Head */}
      <Circle cx={60} cy={40} r={16} fill={body} />
      {/* White forehead */}
      <Path d="M 52,30 Q 60,26 70,30 Q 66,34 60,34 Q 54,34 52,30 Z" fill={accent} />
      {/* Eye */}
      <Circle cx={66} cy={36} r={4} fill="#F9CA24" /><Circle cx={67} cy={37} r={2.5} fill="#1A1A1A" /><Circle cx={67.5} cy={36} r={1} fill="white" />
      {/* Short beak */}
      <Path d="M 72,38 L 82,37 L 82,42 L 72,42 Z" fill="#1A1A1A" />
      {/* Legs */}
      <Path d="M 44,78 L 42,90 M 56,78 L 58,90" stroke="#C8A030" strokeWidth={2} strokeLinecap="round" />
    </G>
  ),

  heron: ({ body, accent }: Colors) => (
    <G>
      {/* Long legs */}
      <Path d="M 40,80 L 36,100" stroke={darken(body, 0.2)} strokeWidth={3} strokeLinecap="round" />
      <Path d="M 56,80 L 60,100" stroke={darken(body, 0.2)} strokeWidth={3} strokeLinecap="round" />
      {/* Feet */}
      <Path d="M 36,100 L 28,106 M 36,100 L 38,107 M 36,100 L 44,106" stroke={darken(body, 0.2)} strokeWidth={2} strokeLinecap="round" />
      {/* Body */}
      <Ellipse cx={50} cy={64} rx={18} ry={22} fill={body} />
      {/* White belly */}
      <Ellipse cx={50} cy={68} rx={11} ry={14} fill={accent} />
      {/* Wing */}
      <Path d="M 34,52 Q 50,44 64,52 Q 50,62 34,52 Z" fill={darken(body, 0.1)} />
      {/* S-curved neck */}
      <Path d="M 50,44 Q 60,38 56,26 Q 50,22 50,28 Q 52,34 48,40" stroke={body} strokeWidth={12} fill="none" strokeLinecap="round" />
      {/* Head */}
      <Circle cx={50} cy={22} r={14} fill={body} />
      {/* Black crest stripe */}
      <Path d="M 44,14 Q 50,8 56,14 Q 58,10 62,14 Q 56,18 50,18 Q 44,18 44,14 Z" fill="#1A1A1A" />
      {/* Eye */}
      <Circle cx={56} cy={20} r={4} fill="#F9CA24" /><Circle cx={57} cy={21} r={2.5} fill="#1A1A1A" />
      {/* Spear beak */}
      <Path d="M 58,22 L 88,18 L 88,24 L 58,26 Z" fill="#C8A030" />
    </G>
  ),

  // ── Small mammals ──────────────────────────────────────────────────────────

  chipmunk: ({ body, accent }: Colors) => (
    <G>
      {/* Bushy tail */}
      <Path d="M 62,55 Q 88,42 86,22 Q 80,14 72,20 Q 78,28 76,42 Q 70,52 62,55 Z" fill={body} />
      <Path d="M 64,53 Q 84,42 82,24 Q 78,30 74,40 Q 70,50 64,53 Z" fill={accent} />
      {/* Body */}
      <Ellipse cx={45} cy={66} rx={22} ry={20} fill={body} />
      {/* Back stripes */}
      <Path d="M 36,50 L 38,82" stroke={darken(body, 0.35)} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M 44,48 L 46,82" stroke={darken(body, 0.35)} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M 52,50 L 54,82" stroke={darken(body, 0.35)} strokeWidth={2.5} strokeLinecap="round" />
      {/* Head */}
      <Circle cx={44} cy={40} r={20} fill={body} />
      {/* Chubby cheek pouches */}
      <Ellipse cx={28} cy={48} rx={10} ry={8} fill={darken(body, 0.05)} />
      <Ellipse cx={60} cy={48} rx={10} ry={8} fill={darken(body, 0.05)} />
      {/* Ears */}
      <Path d="M 32,26 Q 28,14 36,16 Q 35,22 34,26 Z" fill={body} />
      <Path d="M 56,24 Q 60,12 66,14 Q 62,20 58,24 Z" fill={body} />
      {/* Eyes */}
      <Circle cx={38} cy={38} r={5} fill="white" /><Circle cx={39} cy={39} r={3} fill="#2C1810" /><Circle cx={39.5} cy={38} r={1.2} fill="white" />
      <Circle cx={52} cy={38} r={5} fill="white" /><Circle cx={53} cy={39} r={3} fill="#2C1810" /><Circle cx={53.5} cy={38} r={1.2} fill="white" />
      {/* Nose */}
      <Ellipse cx={45} cy={48} rx={3} ry={2} fill="#CC6677" />
    </G>
  ),

  beaver: ({ body, accent }: Colors) => (
    <G>
      {/* Distinctive flat paddle tail */}
      <Ellipse cx={72} cy={78} rx={22} ry={10} fill={darken(body, 0.2)} />
      {/* Tail texture lines */}
      <Path d="M 54,76 Q 72,74 90,78" stroke={darken(body, 0.35)} strokeWidth={1} fill="none" />
      <Path d="M 54,80 Q 72,78 90,82" stroke={darken(body, 0.35)} strokeWidth={1} fill="none" />
      {/* Body */}
      <Ellipse cx={46} cy={64} rx={26} ry={22} fill={body} />
      {/* Head */}
      <Circle cx={44} cy={38} r={22} fill={body} />
      {/* Small round ears */}
      <Circle cx={28} cy={22} r={9} fill={body} /><Circle cx={28} cy={22} r={5} fill="#CC9966" />
      <Circle cx={62} cy={20} r={9} fill={body} /><Circle cx={62} cy={20} r={5} fill="#CC9966" />
      {/* Eyes */}
      <Circle cx={36} cy={34} r={6} fill="white" /><Circle cx={37} cy={35} r={4} fill="#2C1810" /><Circle cx={38} cy={33} r={1.5} fill="white" />
      <Circle cx={54} cy={34} r={6} fill="white" /><Circle cx={55} cy={35} r={4} fill="#2C1810" /><Circle cx={56} cy={33} r={1.5} fill="white" />
      {/* Broad snout */}
      <Ellipse cx={44} cy={48} rx={14} ry={10} fill={accent} />
      {/* Large orange front teeth */}
      <Rect x={40} y={50} width={8} height={10} rx={2} fill="#E8780A" />
      <Path d="M 44,50 L 44,60" stroke={darken('#E8780A', 0.15)} strokeWidth={1} />
      {/* Paws */}
      <Ellipse cx={28} cy={76} rx={9} ry={6} fill={body} />
      <Ellipse cx={58} cy={80} rx={9} ry={6} fill={body} />
    </G>
  ),

  groundhog: ({ body, accent }: Colors) => (
    <G>
      {/* Chunky body */}
      <Ellipse cx={50} cy={68} rx={26} ry={22} fill={body} />
      {/* Head */}
      <Circle cx={50} cy={40} r={24} fill={body} />
      {/* Small round ears */}
      <Circle cx={32} cy={22} r={10} fill={body} /><Circle cx={32} cy={22} r={6} fill={darken(body, 0.1)} />
      <Circle cx={68} cy={22} r={10} fill={body} /><Circle cx={68} cy={22} r={6} fill={darken(body, 0.1)} />
      {/* Eyes */}
      <Circle cx={38} cy={36} r={6} fill="white" /><Circle cx={39} cy={37} r={4} fill="#2C1810" /><Circle cx={40} cy={35} r={1.5} fill="white" />
      <Circle cx={62} cy={36} r={6} fill="white" /><Circle cx={63} cy={37} r={4} fill="#2C1810" /><Circle cx={64} cy={35} r={1.5} fill="white" />
      {/* Snout */}
      <Ellipse cx={50} cy={50} rx={14} ry={10} fill={accent} />
      <Ellipse cx={50} cy={50} rx={5} ry={4} fill="#2C1810" />
      {/* Short stubby tail */}
      <Ellipse cx={72} cy={74} rx={8} ry={6} fill={darken(body, 0.1)} />
      {/* Paws */}
      <Circle cx={28} cy={80} r={9} fill={body} />
      <Circle cx={72} cy={82} r={9} fill={body} />
    </G>
  ),

  porcupine: ({ body, accent }: Colors) => (
    <G>
      {/* Quills radiating from back */}
      {[-60,-45,-30,-15,0,15,30,45,60].map((a, i) => (
        <Path key={i} d={`M 50,50 L ${50 + Math.cos((a - 90) * Math.PI / 180) * 36} ${50 + Math.sin((a - 90) * Math.PI / 180) * 36}`}
          stroke={darken(body, 0.3)} strokeWidth={2} strokeLinecap="round" />
      ))}
      {/* Body */}
      <Ellipse cx={50} cy={66} rx={22} ry={20} fill={body} />
      {/* Belly lighter */}
      <Ellipse cx={50} cy={70} rx={14} ry={13} fill={accent} />
      {/* Head (smaller, forward-facing) */}
      <Circle cx={34} cy={44} r={18} fill={body} />
      {/* Snout */}
      <Ellipse cx={24} cy={50} rx={10} ry={8} fill={accent} />
      {/* Nose */}
      <Ellipse cx={20} cy={50} rx={4} ry={3} fill="#2C1810" />
      {/* Eye */}
      <Circle cx={30} cy={40} r={5} fill="white" /><Circle cx={31} cy={41} r={3.5} fill="#2C1810" /><Circle cx={31.5} cy={40} r={1} fill="white" />
      {/* Small ear */}
      <Circle cx={42} cy={28} r={8} fill={body} /><Circle cx={42} cy={28} r={4} fill="#FFB6C1" />
      {/* Paws */}
      <Circle cx={32} cy={78} r={7} fill={body} />
      <Circle cx={62} cy={80} r={7} fill={body} />
    </G>
  ),

  skunk: ({ body, accent }: Colors) => (
    <G>
      {/* Fluffy raised tail with white stripe */}
      <Path d="M 64,52 Q 88,36 86,14 Q 80,8 74,14 Q 78,26 76,42 Q 72,50 64,52 Z" fill={body} />
      <Path d="M 68,50 Q 86,36 82,16 Q 78,22 76,36 Q 72,46 68,50 Z" fill={accent} />
      {/* Body */}
      <Ellipse cx={46} cy={66} rx={22} ry={20} fill={body} />
      {/* White stripe down back */}
      <Path d="M 48,48 Q 50,44 52,46 L 54,82 Q 50,84 46,82 Z" fill={accent} />
      {/* Head */}
      <Circle cx={42} cy={40} r={20} fill={body} />
      {/* White forehead stripe */}
      <Path d="M 38,22 Q 42,16 46,22 Q 44,28 42,30 Q 40,28 38,22 Z" fill={accent} />
      {/* Eyes */}
      <Circle cx={34} cy={36} r={5} fill="white" /><Circle cx={35} cy={37} r={3.5} fill="#1A1A1A" /><Circle cx={35.5} cy={36} r={1.2} fill="white" />
      <Circle cx={52} cy={36} r={5} fill="white" /><Circle cx={53} cy={37} r={3.5} fill="#1A1A1A" /><Circle cx={53.5} cy={36} r={1.2} fill="white" />
      {/* Snout */}
      <Ellipse cx={42} cy={48} rx={10} ry={8} fill={accent} />
      <Ellipse cx={42} cy={48} rx={4} ry={3} fill="#2C1810" />
      {/* Paws */}
      <Circle cx={28} cy={78} r={7} fill={body} /><Circle cx={60} cy={80} r={7} fill={body} />
    </G>
  ),

  bobcat: ({ body, accent }: Colors) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={66} rx={24} ry={22} fill={body} />
      {/* Spots */}
      {[{cx:38,cy:58},{cx:52,cy:54},{cx:64,cy:60},{cx:42,cy:70},{cx:58,cy:72}].map((p,i) => (
        <Ellipse key={i} cx={p.cx} cy={p.cy} rx={4} ry={3} fill={darken(body, 0.3)} />
      ))}
      {/* Short bobtail */}
      <Ellipse cx={72} cy={62} rx={10} ry={7} fill={body} />
      <Path d="M 72,56 Q 76,58 78,62 Q 74,60 72,62 Z" fill={darken(body, 0.3)} />
      {/* Head */}
      <Circle cx={44} cy={38} r={22} fill={body} />
      {/* Tufted ears */}
      <Path d="M 28,22 L 24,4 L 38,16 Z" fill={body} />
      <Path d="M 60,20 L 64,4 L 54,16 Z" fill={body} />
      <Path d="M 30,20 L 28,8 L 38,16 Z" fill="#FFB6C1" />
      <Path d="M 58,20 L 62,8 L 54,16 Z" fill="#FFB6C1" />
      {/* Eye */}
      <Ellipse cx={36} cy={34} rx={7} ry={6} fill="#F9CA24" /><Ellipse cx={36} cy={34} rx={2.5} ry={5} fill="#1A1A1A" /><Circle cx={35} cy={32} r={1.5} fill="white" />
      <Ellipse cx={54} cy={34} rx={7} ry={6} fill="#F9CA24" /><Ellipse cx={54} cy={34} rx={2.5} ry={5} fill="#1A1A1A" /><Circle cx={53} cy={32} r={1.5} fill="white" />
      {/* Nose */}
      <Path d="M 40,46 L 44,44 L 48,46 Q 44,48 40,46 Z" fill="#CC6677" />
      {/* Whiskers */}
      <Path d="M 22,46 L 36,48" stroke="#888" strokeWidth={1} /><Path d="M 52,48 L 66,46" stroke="#888" strokeWidth={1} />
      {/* Belly */}
      <Ellipse cx={50} cy={70} rx={14} ry={11} fill={accent} />
      {/* Paws */}
      <Ellipse cx={32} cy={80} rx={9} ry={7} fill={body} /><Ellipse cx={64} cy={82} rx={9} ry={7} fill={body} />
    </G>
  ),

  lynx: ({ body, accent }: Colors) => (
    <G>
      {/* Body — thick fur */}
      <Ellipse cx={50} cy={66} rx={26} ry={24} fill={body} />
      {/* Spots */}
      {[{cx:36,cy:60},{cx:52,cy:56},{cx:66,cy:62},{cx:40,cy:74},{cx:60,cy:76}].map((p,i) => (
        <Ellipse key={i} cx={p.cx} cy={p.cy} rx={5} ry={4} fill={darken(body, 0.25)} />
      ))}
      {/* Big paws */}
      <Ellipse cx={28} cy={82} rx={12} ry={8} fill={body} />
      <Ellipse cx={66} cy={84} rx={12} ry={8} fill={body} />
      {/* Short tail */}
      <Ellipse cx={74} cy={66} rx={9} ry={6} fill={body} />
      {/* Head */}
      <Circle cx={46} cy={36} r={24} fill={body} />
      {/* Fluffy ruff cheeks */}
      <Ellipse cx={26} cy={48} rx={12} ry={10} fill={body} />
      <Ellipse cx={66} cy={48} rx={12} ry={10} fill={body} />
      {/* Long ear tufts */}
      <Path d="M 28,16 L 22,0 L 38,12 Z" fill={body} />
      <Path d="M 64,16 L 68,0 L 56,12 Z" fill={body} />
      <Path d="M 30,14 L 26,4 L 36,12 Z" fill={darken(body, 0.3)} />
      <Path d="M 62,14 L 66,4 L 58,12 Z" fill={darken(body, 0.3)} />
      {/* Eyes */}
      <Ellipse cx={36} cy={32} rx={7} ry={6} fill="#F9CA24" /><Ellipse cx={36} cy={32} rx={2.5} ry={5} fill="#1A1A1A" /><Circle cx={35} cy={30} r={1.5} fill="white" />
      <Ellipse cx={56} cy={32} rx={7} ry={6} fill="#F9CA24" /><Ellipse cx={56} cy={32} rx={2.5} ry={5} fill="#1A1A1A" /><Circle cx={55} cy={30} r={1.5} fill="white" />
      {/* Nose */}
      <Path d="M 42,44 L 46,42 L 50,44 Q 46,46 42,44 Z" fill="#CC6677" />
      {/* Belly */}
      <Ellipse cx={50} cy={70} rx={16} ry={13} fill={accent} />
    </G>
  ),

  // ── Large mammals ───────────────────────────────────────────────────────────

  coyote: ({ body, accent }: Colors) => (
    <G>
      {/* Body — lean */}
      <Ellipse cx={50} cy={66} rx={22} ry={20} fill={body} />
      {/* Bushy tail with black tip */}
      <Path d="M 70,64 Q 92,50 90,30 Q 86,22 80,28 Q 82,38 80,54 Q 76,62 70,64 Z" fill={body} />
      <Circle cx={84} cy={28} r={6} fill={darken(body, 0.4)} />
      {/* Head — angular */}
      <Ellipse cx={42} cy={38} rx={22} ry={20} fill={body} />
      {/* Large pointed ears */}
      <Path d="M 26,24 L 18,4 L 38,16 Z" fill={body} />
      <Path d="M 58,22 L 62,4 L 50,16 Z" fill={body} />
      <Path d="M 28,22 L 22,8 L 36,16 Z" fill={darken(body, 0.15)} />
      <Path d="M 56,22 L 60,8 L 52,16 Z" fill={darken(body, 0.15)} />
      {/* Pointed muzzle */}
      <Ellipse cx={30} cy={46} rx={16} ry={12} fill={accent} />
      <Ellipse cx={24} cy={46} rx={6} ry={8} fill={accent} />
      {/* Eyes */}
      <Circle cx={36} cy={32} r={6} fill="#F9CA24" /><Circle cx={37} cy={33} r={4} fill="#2C1810" /><Circle cx={38} cy={31} r={1.5} fill="white" />
      <Circle cx={54} cy={32} r={6} fill="#F9CA24" /><Circle cx={55} cy={33} r={4} fill="#2C1810" /><Circle cx={56} cy={31} r={1.5} fill="white" />
      {/* Nose */}
      <Ellipse cx={24} cy={44} rx={4} ry={3} fill="#2C1810" />
      {/* Belly */}
      <Ellipse cx={46} cy={68} rx={14} ry={12} fill={accent} />
      {/* Paws */}
      <Circle cx={32} cy={80} r={8} fill={body} /><Circle cx={62} cy={82} r={8} fill={body} />
    </G>
  ),

  wolf: ({ body, accent }: Colors) => (
    <G>
      {/* Body */}
      <Ellipse cx={50} cy={66} rx={26} ry={24} fill={body} />
      {/* Thick neck fur ruff */}
      <Ellipse cx={46} cy={52} rx={20} ry={14} fill={darken(body, 0.08)} />
      {/* Bushy tail */}
      <Path d="M 72,66 Q 96,52 94,30 Q 90,20 82,28 Q 84,40 82,56 Q 78,64 72,66 Z" fill={body} />
      {/* Head — larger, powerful */}
      <Circle cx={44} cy={36} r={26} fill={body} />
      {/* Pointed ears */}
      <Path d="M 24,20 L 16,2 L 38,14 Z" fill={body} />
      <Path d="M 62,18 L 68,2 L 54,14 Z" fill={body} />
      <Path d="M 26,18 L 20,6 L 36,14 Z" fill={darken(body, 0.2)} />
      <Path d="M 60,18 L 66,6 L 56,14 Z" fill={darken(body, 0.2)} />
      {/* Muzzle */}
      <Ellipse cx={36} cy={48} rx={18} ry={12} fill={accent} />
      {/* Eyes */}
      <Circle cx={34} cy={30} r={7} fill="#F9CA24" /><Circle cx={35} cy={31} r={5} fill="#2C1810" /><Circle cx={36} cy={29} r={2} fill="white" />
      <Circle cx={56} cy={30} r={7} fill="#F9CA24" /><Circle cx={57} cy={31} r={5} fill="#2C1810" /><Circle cx={58} cy={29} r={2} fill="white" />
      {/* Nose */}
      <Ellipse cx={34} cy={46} rx={6} ry={4} fill="#1A1A1A" />
      {/* Belly */}
      <Ellipse cx={50} cy={70} rx={17} ry={14} fill={accent} />
      {/* Paws */}
      <Ellipse cx={28} cy={82} rx={11} ry={8} fill={body} /><Ellipse cx={68} cy={84} rx={11} ry={8} fill={body} />
    </G>
  ),

  beachcat: ({ body, accent }: Colors) => (
    <G>
      {/* Same as cat but with sandy/beach feel */}
      <Ellipse cx={50} cy={68} rx={22} ry={20} fill={body} />
      <Path d="M 70,72 Q 90,60 88,44 Q 86,36 80,40 Q 82,50 80,62 Q 76,68 70,72 Z" fill={body} />
      <Circle cx={48} cy={38} r={24} fill={body} />
      <Path d="M 30,22 L 26,6 L 42,16 Z" fill={body} />
      <Path d="M 66,22 L 70,6 L 56,16 Z" fill={body} />
      <Path d="M 31,20 L 28,10 L 40,17 Z" fill="#FFB6C1" />
      <Path d="M 65,20 L 68,10 L 58,17 Z" fill="#FFB6C1" />
      <Ellipse cx={39} cy={36} rx={8} ry={6} fill="#7CFC00" /><Ellipse cx={39} cy={36} rx={3} ry={5} fill="#1A1A1A" /><Circle cx={38} cy={33} r={1.5} fill="white" />
      <Ellipse cx={57} cy={36} rx={8} ry={6} fill="#7CFC00" /><Ellipse cx={57} cy={36} rx={3} ry={5} fill="#1A1A1A" /><Circle cx={56} cy={33} r={1.5} fill="white" />
      <Path d="M 45,46 L 48,44 L 51,46 Q 48,48 45,46 Z" fill="#CC6677" />
      <Path d="M 24,46 L 40,48" stroke="#888" strokeWidth={1} /><Path d="M 24,50 L 40,50" stroke="#888" strokeWidth={1} />
      <Path d="M 56,48 L 72,46" stroke="#888" strokeWidth={1} /><Path d="M 56,50 L 72,50" stroke="#888" strokeWidth={1} />
      <Ellipse cx={50} cy={70} rx={12} ry={10} fill={accent} />
      {/* Shell accessory */}
      <Ellipse cx={62} cy={54} rx={5} ry={4} fill="#E8D5A0" />
      <Path d="M 60,54 L 64,54" stroke="#C8A96E" strokeWidth={1} />
      <Circle cx={34} cy={80} r={7} fill={body} /><Circle cx={62} cy={82} r={7} fill={body} />
    </G>
  ),

  // ── Marine / aquatic ────────────────────────────────────────────────────────

  seal: ({ body, accent }: Colors) => (
    <G>
      {/* Plump torpedo body lying down */}
      <Ellipse cx={50} cy={62} rx={30} ry={22} fill={body} />
      {/* Lighter belly */}
      <Ellipse cx={50} cy={66} rx={20} ry={14} fill={accent} />
      {/* Front flippers */}
      <Ellipse cx={22} cy={66} rx={12} ry={6} fill={darken(body, 0.1)} transform="rotate(20 22 66)" />
      <Ellipse cx={78} cy={66} rx={12} ry={6} fill={darken(body, 0.1)} transform="rotate(-20 78 66)" />
      {/* Tail flippers */}
      <Path d="M 34,80 Q 28,92 20,88 Q 26,84 30,80 Z" fill={darken(body, 0.15)} />
      <Path d="M 66,80 Q 72,92 80,88 Q 74,84 70,80 Z" fill={darken(body, 0.15)} />
      {/* Head */}
      <Circle cx={50} cy={36} r={22} fill={body} />
      {/* Big round eyes */}
      <Circle cx={40} cy={30} r={8} fill="white" /><Circle cx={41} cy={31} r={6} fill="#1A1A1A" /><Circle cx={40} cy={29} r={2.5} fill="white" />
      <Circle cx={60} cy={30} r={8} fill="white" /><Circle cx={61} cy={31} r={6} fill="#1A1A1A" /><Circle cx={60} cy={29} r={2.5} fill="white" />
      {/* Snout */}
      <Ellipse cx={50} cy={44} rx={10} ry={7} fill={accent} />
      <Ellipse cx={50} cy={44} rx={5} ry={3} fill="#2C1810" />
      {/* Whiskers */}
      <Path d="M 28,44 L 42,46" stroke="#888" strokeWidth={1.5} /><Path d="M 58,46 L 72,44" stroke="#888" strokeWidth={1.5} />
      <Path d="M 28,48 L 42,48" stroke="#888" strokeWidth={1.5} /><Path d="M 58,48 L 72,48" stroke="#888" strokeWidth={1.5} />
    </G>
  ),

  dolphin: ({ body, accent }: Colors) => (
    <G>
      {/* Curved crescent body */}
      <Path d="M 14,70 Q 20,30 50,24 Q 80,18 90,50 Q 86,70 70,78 Q 50,84 30,76 Q 18,72 14,70 Z" fill={body} />
      {/* White belly stripe */}
      <Path d="M 24,68 Q 30,44 50,38 Q 70,32 82,52 Q 70,70 50,74 Q 32,76 24,68 Z" fill={accent} />
      {/* Dorsal fin */}
      <Path d="M 52,24 Q 62,6 68,20 Q 60,22 52,24 Z" fill={darken(body, 0.1)} />
      {/* Tail flukes */}
      <Path d="M 14,70 Q 4,60 6,50 Q 12,60 14,66 Z" fill={body} />
      <Path d="M 14,70 Q 4,80 8,88 Q 12,78 14,74 Z" fill={body} />
      {/* Rostrum / snout */}
      <Path d="M 88,46 L 102,44 L 102,54 L 88,54 Z" fill={body} rx={3} />
      {/* Eye */}
      <Circle cx={80} cy={40} r={5} fill="white" /><Circle cx={81} cy={41} r={3.5} fill="#1A1A1A" /><Circle cx={81.5} cy={40} r={1.2} fill="white" />
      {/* Smiling mouth curve */}
      <Path d="M 88,52 Q 96,56 102,52" stroke={darken(body, 0.15)} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Pectoral fin */}
      <Path d="M 44,66 Q 36,78 28,74 Q 34,66 42,62 Z" fill={darken(body, 0.1)} />
    </G>
  ),

  whale: ({ body, accent }: Colors) => (
    <G>
      {/* Enormous body */}
      <Ellipse cx={46} cy={58} rx={40} ry={30} fill={body} />
      {/* White belly */}
      <Ellipse cx={46} cy={66} rx={28} ry={18} fill={accent} />
      {/* Tail flukes */}
      <Path d="M 8,50 Q 0,36 6,28 Q 14,40 14,48 Z" fill={body} />
      <Path d="M 8,50 Q 0,64 6,72 Q 14,60 14,52 Z" fill={body} />
      {/* Blowhole water spout */}
      <Path d="M 82,28 Q 84,14 86,8 Q 88,14 90,28" stroke="#87CEEB" strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ellipse cx={86} cy={28} rx={6} ry={3} fill="#87CEEB" />
      {/* Pectoral fin */}
      <Path d="M 34,74 Q 24,90 18,84 Q 26,74 32,68 Z" fill={darken(body, 0.12)} />
      {/* Head */}
      <Ellipse cx={82} cy={52} rx={20} ry={18} fill={body} />
      {/* Mouth curve */}
      <Path d="M 78,62 Q 88,68 100,62" stroke={darken(body, 0.2)} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {/* Small eye */}
      <Circle cx={90} cy={48} r={5} fill="white" /><Circle cx={91} cy={49} r={3.5} fill="#1A1A1A" /><Circle cx={91.5} cy={48} r={1.2} fill="white" />
    </G>
  ),

  // ── Other ───────────────────────────────────────────────────────────────────

  firefly: ({ body, accent }: Colors) => (
    <G>
      {/* Glowing aura */}
      <Circle cx={50} cy={72} r={24} fill="rgba(255,240,80,0.25)" />
      <Circle cx={50} cy={72} r={16} fill="rgba(255,240,80,0.25)" />
      {/* Wings */}
      <Ellipse cx={34} cy={50} rx={16} ry={10} fill="rgba(180,220,255,0.5)" transform="rotate(-20 34 50)" />
      <Ellipse cx={66} cy={50} rx={16} ry={10} fill="rgba(180,220,255,0.5)" transform="rotate(20 66 50)" />
      <Ellipse cx={30} cy={62} rx={12} ry={8} fill="rgba(180,220,255,0.4)" transform="rotate(-30 30 62)" />
      <Ellipse cx={70} cy={62} rx={12} ry={8} fill="rgba(180,220,255,0.4)" transform="rotate(30 70 62)" />
      {/* Abdomen with glow */}
      <Ellipse cx={50} cy={72} rx={10} ry={14} fill={body} />
      <Ellipse cx={50} cy={78} rx={8} ry={8} fill={accent} />
      <Ellipse cx={50} cy={78} rx={6} ry={6} fill="#FFFF00" />
      {/* Thorax */}
      <Ellipse cx={50} cy={54} rx={10} ry={10} fill={body} />
      {/* Head */}
      <Circle cx={50} cy={40} r={10} fill={body} />
      {/* Eyes */}
      <Circle cx={44} cy={38} r={4} fill="#44CC00" /><Circle cx={45} cy={39} r={2.5} fill="#1A1A1A" />
      <Circle cx={56} cy={38} r={4} fill="#44CC00" /><Circle cx={57} cy={39} r={2.5} fill="#1A1A1A" />
      {/* Antennae */}
      <Path d="M 46,32 Q 40,20 36,14" stroke={body} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Circle cx={36} cy={14} r={3} fill={darken(body, 0.2)} />
      <Path d="M 54,32 Q 60,20 64,14" stroke={body} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Circle cx={64} cy={14} r={3} fill={darken(body, 0.2)} />
    </G>
  ),

  turtle: ({ body, accent }: Colors) => (
    <G>
      {/* Shell dome */}
      <Ellipse cx={50} cy={58} rx={32} ry={28} fill={body} />
      {/* Shell hexagonal pattern */}
      <Path d="M 50,36 L 58,44 L 58,56 L 50,62 L 42,56 L 42,44 Z" fill={darken(body, 0.2)} stroke={darken(body, 0.3)} strokeWidth={1.5} />
      <Path d="M 34,44 L 42,44 L 42,56 L 34,56 Z" fill={darken(body, 0.15)} stroke={darken(body, 0.25)} strokeWidth={1} />
      <Path d="M 58,44 L 66,44 L 66,56 L 58,56 Z" fill={darken(body, 0.15)} stroke={darken(body, 0.25)} strokeWidth={1} />
      <Path d="M 42,62 L 50,62 L 58,62 L 58,70 L 42,70 Z" fill={darken(body, 0.15)} stroke={darken(body, 0.25)} strokeWidth={1} />
      <Path d="M 42,36 L 50,36 L 58,36 L 58,44 L 42,44 Z" fill={darken(body, 0.15)} stroke={darken(body, 0.25)} strokeWidth={1} />
      {/* Shell rim */}
      <Ellipse cx={50} cy={58} rx={32} ry={28} fill="none" stroke={darken(body, 0.3)} strokeWidth={2} />
      {/* Head poking out */}
      <Circle cx={50} cy={28} r={14} fill={accent} />
      {/* Eyes */}
      <Circle cx={44} cy={24} r={4} fill="white" /><Circle cx={45} cy={25} r={2.5} fill="#1A1A1A" /><Circle cx={45.5} cy={24} r={1} fill="white" />
      <Circle cx={56} cy={24} r={4} fill="white" /><Circle cx={57} cy={25} r={2.5} fill="#1A1A1A" /><Circle cx={57.5} cy={24} r={1} fill="white" />
      {/* Beak-like mouth */}
      <Path d="M 44,34 L 50,36 L 56,34" stroke={darken(accent, 0.2)} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Four stubby legs */}
      <Ellipse cx={22} cy={52} rx={10} ry={7} fill={accent} transform="rotate(-20 22 52)" />
      <Ellipse cx={78} cy={52} rx={10} ry={7} fill={accent} transform="rotate(20 78 52)" />
      <Ellipse cx={26} cy={72} rx={10} ry={7} fill={accent} transform="rotate(20 26 72)" />
      <Ellipse cx={74} cy={72} rx={10} ry={7} fill={accent} transform="rotate(-20 74 72)" />
      {/* Tail */}
      <Ellipse cx={50} cy={84} rx={6} ry={5} fill={accent} />
    </G>
  ),

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
