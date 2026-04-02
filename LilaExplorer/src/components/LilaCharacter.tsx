/**
 * LilaCharacter — SVG-drawn customizable sprite (girl or boy).
 * All appearance driven by props (gender, hairstyle, hairColor, skinTone, outfitColor).
 * Optional accessory overlays (hat, held item).
 * outfitColor may be 'rainbow' for the Rainbow Rain Jacket.
 *
 * Hairstyles (1–3):
 *   Girl 1: Long Straight  Girl 2: Pigtails  Girl 3: Wavy Bob
 *   Boy  1: Short Tidy     Boy  2: Spiky      Boy  3: Wavy Sweep
 */
import React, { useRef } from 'react';
import Svg, {
  Circle,
  Ellipse,
  Rect,
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

interface LilaCharacterProps {
  gender?: 'girl' | 'boy';
  hairstyle?: number;  // 1, 2, or 3
  hairColor?: string;
  skinTone?: string;
  outfitColor?: string;
  equippedHat?: string | null;
  size?: number;
  facing?: 'left' | 'right';
}

export function LilaCharacter({
  gender = 'girl',
  hairstyle = 1,
  hairColor = '#F4D03F',
  skinTone = '#F1C27D',
  outfitColor = '#FF6B9D',
  equippedHat = null,
  size = 120,
  facing = 'right',
}: LilaCharacterProps) {
  // Unique gradient IDs per instance — prevents cross-SVG gradient collisions
  // when multiple LilaCharacter instances are mounted simultaneously.
  const uidRef = useRef(`lc${(Math.random() * 1e9 | 0).toString(36)}`);
  const uid = uidRef.current;

  const W = 100;
  const H = 180;
  const scale = size / H;
  const svgW = W * scale;
  const svgH = H * scale;
  const flip = facing === 'left' ? `scale(-1,1) translate(-${W},0)` : undefined;

  const isRainbow = outfitColor === 'rainbow';
  const shoeColor = isRainbow ? '#FF4444' : outfitColor;
  const pantColor = isRainbow ? '#7C3AED' : darken(outfitColor, 0.25);
  const skinDark = darken(skinTone, 0.15);
  const hairGrad = `url(#${uid}h)`;
  const skinGrad = `url(#${uid}s)`;
  const outfitGrad = `url(#${uid}o)`;

  const style = Math.max(1, Math.min(3, hairstyle));

  return (
    <Svg width={svgW} height={svgH} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={skinTone} />
          <Stop offset="1" stopColor={skinDark} />
        </LinearGradient>
        <LinearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lighten(hairColor, 0.15)} />
          <Stop offset="1" stopColor={hairColor} />
        </LinearGradient>
        {isRainbow ? (
          <LinearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor="#FF4444" />
            <Stop offset="0.2"  stopColor="#FF8C00" />
            <Stop offset="0.4"  stopColor="#FFD700" />
            <Stop offset="0.62" stopColor="#44BB44" />
            <Stop offset="0.82" stopColor="#4488EE" />
            <Stop offset="1"    stopColor="#9B59B6" />
          </LinearGradient>
        ) : (
          <LinearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lighten(outfitColor, 0.1)} />
            <Stop offset="1" stopColor={outfitColor} />
          </LinearGradient>
        )}
      </Defs>

      <G transform={flip}>
        {/* ── LEGS ────────────────────────────────────── */}
        <Rect x={30} y={122} width={16} height={42} rx={8} fill={pantColor} />
        <Rect x={54} y={122} width={16} height={42} rx={8} fill={pantColor} />

        {/* ── SHOES ─────────────────────────────────── */}
        <Ellipse cx={38} cy={164} rx={12} ry={8} fill={shoeColor} />
        <Ellipse cx={62} cy={164} rx={12} ry={8} fill={shoeColor} />
        <Ellipse cx={35} cy={161} rx={5} ry={2.5} fill="rgba(255,255,255,0.3)" />
        <Ellipse cx={59} cy={161} rx={5} ry={2.5} fill="rgba(255,255,255,0.3)" />

        {/* ── BODY ────────────────────────────────────── */}
        {gender === 'girl' && (
          <Path
            d="M 22,115 Q 30,138 50,138 Q 70,138 78,115 Z"
            fill={isRainbow ? '#9B59B6' : outfitColor}
          />
        )}
        <Rect x={28} y={74} width={44} height={48} rx={12} fill={outfitGrad} />
        <Path
          d="M 38,74 Q 50,84 62,74"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={2}
          fill="none"
        />

        {/* ── ARMS ────────────────────────────────────── */}
        <Rect x={72} y={76} width={14} height={34} rx={7} fill={outfitGrad} />
        <Circle cx={79} cy={111} r={9} fill={skinGrad} />
        <Rect x={14} y={76} width={14} height={34} rx={7} fill={outfitGrad} />
        <Circle cx={21} cy={111} r={9} fill={skinGrad} />

        {/* ── NECK ────────────────────────────────────── */}
        <Rect x={43} y={64} width={14} height={14} rx={5} fill={skinGrad} />

        {/* ── HEAD ────────────────────────────────────── */}
        <Circle cx={50} cy={42} r={28} fill={skinGrad} />

        {/* ── HAIR (back layer, behind ears) ──────────── */}
        {gender === 'girl'
          ? <GirlHairBack style={style} hairGrad={hairGrad} />
          : <BoyHairBack  style={style} hairGrad={hairGrad} />}

        {/* ── EARS ────────────────────────────────────── */}
        <Circle cx={22} cy={44} r={7} fill={skinGrad} />
        <Circle cx={78} cy={44} r={7} fill={skinGrad} />
        <Circle cx={22} cy={44} r={4} fill={darken(skinTone, 0.08)} />
        <Circle cx={78} cy={44} r={4} fill={darken(skinTone, 0.08)} />

        {/* ── HAIR (front, over ears) ─────────────────── */}
        {gender === 'girl'
          ? <GirlHairFront style={style} hairGrad={hairGrad} hairColor={hairColor} />
          : <BoyHairFront  style={style} hairGrad={hairGrad} hairColor={hairColor} />}

        {/* ── EYES ────────────────────────────────────── */}
        <Ellipse cx={40} cy={40} rx={7} ry={6} fill="white" />
        <Ellipse cx={60} cy={40} rx={7} ry={6} fill="white" />
        <Circle cx={41} cy={41} r={4.5} fill="#5C4033" />
        <Circle cx={61} cy={41} r={4.5} fill="#5C4033" />
        <Circle cx={42} cy={42} r={2.5} fill="#1A1A1A" />
        <Circle cx={62} cy={42} r={2.5} fill="#1A1A1A" />
        <Circle cx={43} cy={39} r={1.5} fill="white" />
        <Circle cx={63} cy={39} r={1.5} fill="white" />
        <Path d="M 33,36 Q 34,32 36,34" stroke="#2C1810" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d="M 53,36 Q 55,32 57,34" stroke="#2C1810" strokeWidth={1.5} fill="none" strokeLinecap="round" />

        {/* ── NOSE ────────────────────────────────────── */}
        <Circle cx={50} cy={47} r={2} fill={darken(skinTone, 0.12)} />

        {/* ── MOUTH / SMILE ───────────────────────────── */}
        <Path
          d="M 43,54 Q 50,60 57,54"
          stroke="#C06040"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx={34} cy={50} r={5} fill="rgba(255,150,120,0.25)" />
        <Circle cx={66} cy={50} r={5} fill="rgba(255,150,120,0.25)" />

        {/* ── HAT OVERLAY ─────────────────────────────── */}
        {equippedHat === 'hat-explorer' && <ExplorerHat />}
        {equippedHat === 'hat-flower' && <FlowerCrown />}
        {equippedHat === 'hat-rainbow-beret' && <RainbowBeret />}
        {equippedHat === 'hat-star' && <StarCap />}
        {equippedHat === 'hat-rainbow-tiara' && <NatureQueenTiara />}
      </G>
    </Svg>
  );
}

// ── Girl hairstyles ─────────────────────────────────────────────────

function GirlHairBack({ style, hairGrad }: { style: number; hairGrad: string }) {
  if (style === 1) {
    // Long straight — long tail behind on left side
    return (
      <Path
        d="M 24,32 Q 20,70 22,90 Q 28,95 30,88 Q 26,68 28,36 Z"
        fill={hairGrad}
      />
    );
  }
  if (style === 2) {
    // Pigtails — short nubs on each side leading to the puffs
    return (
      <G>
        <Path d="M 22,40 Q 20,50 22,58 Q 26,62 28,56 Q 26,50 24,44 Z" fill={hairGrad} />
        <Path d="M 78,40 Q 80,50 78,58 Q 74,62 72,56 Q 74,50 76,44 Z" fill={hairGrad} />
      </G>
    );
  }
  // style === 3: Wavy bob — shorter back layer
  return (
    <Path
      d="M 24,32 Q 20,55 22,68 Q 28,72 30,65 Q 26,52 28,36 Z"
      fill={hairGrad}
    />
  );
}

function GirlHairFront({ style, hairGrad, hairColor }: { style: number; hairGrad: string; hairColor: string }) {
  if (style === 1) {
    // Long straight — classic flowing hair
    return (
      <G>
        <Path d="M 22,36 Q 26,10 50,12 Q 74,10 78,36 Q 74,18 50,16 Q 26,18 22,36 Z" fill={hairGrad} />
        <Path d="M 22,36 Q 18,42 20,50 Q 24,46 26,40 Z" fill={hairGrad} />
        <Path d="M 74,30 Q 86,28 88,42 Q 86,54 78,52 Q 80,44 82,38 Q 80,30 74,30 Z" fill={hairGrad} />
        <Path d="M 36,14 Q 50,12 60,15" stroke={lighten(hairColor, 0.3)} strokeWidth={3} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  if (style === 2) {
    // Pigtails — top cap + two round puffs with bands
    return (
      <G>
        {/* Top cap */}
        <Path d="M 22,36 Q 26,10 50,12 Q 74,10 78,36 Q 74,18 50,16 Q 26,18 22,36 Z" fill={hairGrad} />
        {/* Left puff */}
        <Circle cx={16} cy={62} r={10} fill={hairGrad} />
        <Ellipse cx={13} cy={58} rx={4} ry={2.5} fill={lighten(hairColor, 0.3)} />
        {/* Hair band left */}
        <Rect x={19} y={56} width={9} height={5} rx={2.5} fill={darken(hairColor, 0.35)} />
        {/* Right puff */}
        <Circle cx={84} cy={62} r={10} fill={hairGrad} />
        <Ellipse cx={81} cy={58} rx={4} ry={2.5} fill={lighten(hairColor, 0.3)} />
        {/* Hair band right */}
        <Rect x={72} y={56} width={9} height={5} rx={2.5} fill={darken(hairColor, 0.35)} />
        <Path d="M 36,14 Q 50,12 60,15" stroke={lighten(hairColor, 0.3)} strokeWidth={3} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  // style === 3: Wavy bob — rounded to jaw with wavy hem
  return (
    <G>
      <Path d="M 22,36 Q 26,10 50,12 Q 74,10 78,36 Q 74,18 50,16 Q 26,18 22,36 Z" fill={hairGrad} />
      {/* Left wavy side */}
      <Path d="M 22,36 Q 17,44 18,54 Q 20,64 24,68 Q 28,64 26,56 Q 24,46 26,40 Z" fill={hairGrad} />
      {/* Right wavy side */}
      <Path d="M 76,32 Q 83,28 84,40 Q 84,52 80,60 Q 76,64 74,58 Q 78,50 78,42 Q 80,34 76,32 Z" fill={hairGrad} />
      {/* Wavy bottom fringe */}
      <Path
        d="M 24,66 Q 30,74 37,68 Q 44,76 50,70 Q 56,76 63,68 Q 70,74 76,66"
        stroke={hairGrad}
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M 36,14 Q 50,12 60,15" stroke={lighten(hairColor, 0.3)} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}

// ── Boy hairstyles ──────────────────────────────────────────────────

function BoyHairBack({ style, hairGrad }: { style: number; hairGrad: string }) {
  if (style === 3) {
    // Wavy sweep — slight back piece on left
    return (
      <Path
        d="M 24,34 Q 22,44 24,54 Q 28,58 30,52 Q 28,44 28,36 Z"
        fill={hairGrad}
      />
    );
  }
  return null; // Short & Tidy and Spiky have no back layer
}

function BoyHairFront({ style, hairGrad, hairColor }: { style: number; hairGrad: string; hairColor: string }) {
  if (style === 1) {
    // Short & Tidy — clean close-cut cap
    return (
      <G>
        <Path d="M 24,36 Q 26,12 50,14 Q 74,12 76,36 Q 70,24 50,22 Q 30,24 24,36 Z" fill={hairGrad} />
        <Path d="M 24,36 Q 22,40 22,44 Q 25,44 26,40 Z" fill={hairGrad} />
        {/* Side part highlight */}
        <Path d="M 38,15 Q 44,13 50,14" stroke={lighten(hairColor, 0.3)} strokeWidth={2} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  if (style === 2) {
    // Spiky — base cap + 4 pointy spikes
    return (
      <G>
        <Path d="M 24,36 Q 26,12 50,14 Q 74,12 76,36 Q 70,24 50,22 Q 30,24 24,36 Z" fill={hairGrad} />
        <Path d="M 24,36 Q 22,40 22,44 Q 25,44 26,40 Z" fill={hairGrad} />
        {/* Spikes */}
        <Path d="M 30,20 L 34,4 L 38,20 Z" fill={hairGrad} />
        <Path d="M 40,15 L 45,1 L 50,15 Z" fill={hairGrad} />
        <Path d="M 50,15 L 55,1 L 60,15 Z" fill={hairGrad} />
        <Path d="M 62,20 L 66,4 L 70,20 Z" fill={hairGrad} />
        {/* Base filler between spikes */}
        <Rect x={28} y={14} width={44} height={8} fill={hairGrad} />
      </G>
    );
  }
  // style === 3: Wavy sweep — side-parted waves
  return (
    <G>
      {/* Base cap */}
      <Path d="M 24,36 Q 28,12 50,14 Q 70,12 76,30 Q 72,20 56,18 Q 36,18 24,36 Z" fill={hairGrad} />
      <Path d="M 24,36 Q 22,40 22,44 Q 25,44 26,40 Z" fill={hairGrad} />
      {/* Right side wave curl */}
      <Path d="M 74,30 Q 82,26 84,38 Q 82,48 76,50 Q 78,42 80,36 Q 80,28 74,30 Z" fill={hairGrad} />
      {/* Sweep highlight */}
      <Path d="M 26,20 Q 40,12 58,14" stroke={lighten(hairColor, 0.3)} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </G>
  );
}

// ── Hat components ──────────────────────────────────────────────────

function ExplorerHat() {
  return (
    <G>
      <Rect x={18} y={20} width={64} height={6} rx={3} fill="#C8A96E" />
      <Path d="M 24,20 Q 26,2 50,4 Q 74,2 76,20 Z" fill="#D4B47A" />
      <Path d="M 26,8 Q 50,5 74,8" stroke="#B8956A" strokeWidth={1.5} fill="none" />
    </G>
  );
}

function FlowerCrown() {
  return (
    <G>
      <Path d="M 22,24 Q 50,16 78,24" stroke="#5CB85C" strokeWidth={3} fill="none" />
      {[28, 38, 50, 62, 72].map((x, i) => (
        <G key={i}>
          <Circle cx={x} cy={20} r={5} fill={['#FF69B4','#FF6B9D','#FFD700','#FF69B4','#DA70D6'][i]} />
          <Circle cx={x} cy={20} r={2} fill="#FFD700" />
        </G>
      ))}
    </G>
  );
}

function RainbowBeret() {
  return (
    <G>
      <Path d="M 22,28 Q 24,8 50,6 Q 76,8 78,28 Q 60,22 50,22 Q 40,22 22,28 Z" fill="#9B59B6" />
      <Path d="M 28,20 Q 50,14 72,20" stroke="#FF6B9D" strokeWidth={2} fill="none" />
      <Path d="M 30,16 Q 50,10 70,16" stroke="#F9CA24" strokeWidth={1.5} fill="none" />
      <Circle cx={72} cy={20} r={5} fill="#FF6B9D" />
    </G>
  );
}

function StarCap() {
  return (
    <G>
      <Path d="M 24,26 Q 26,4 50,4 Q 74,4 76,26 Q 56,20 50,20 Q 44,20 24,26 Z" fill="#1A237E" />
      <Path d="M 36,14 L 38,10 L 40,14 L 36,12 L 40,12 Z" fill="#F9CA24" />
      <Path d="M 48,10 L 50,6 L 52,10 L 48,8 L 52,8 Z" fill="#F9CA24" />
      <Path d="M 60,14 L 62,10 L 64,14 L 60,12 L 64,12 Z" fill="#F9CA24" />
    </G>
  );
}

function NatureQueenTiara() {
  return (
    <G>
      <Path
        d="M 24,24 L 28,14 L 34,20 L 40,8 L 46,18 L 50,10 L 54,18 L 60,8 L 66,20 L 72,14 L 76,24 Z"
        fill="#F9CA24"
        stroke="#C49A00"
        strokeWidth={1}
      />
      <Circle cx={50} cy={14} r={4} fill="#FF6B9D" />
      <Circle cx={34} cy={20} r={3} fill="#A29BFE" />
      <Circle cx={66} cy={20} r={3} fill="#00B894" />
    </G>
  );
}

// ── Color utilities ─────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [128, 128, 128];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}
