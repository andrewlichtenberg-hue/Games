/**
 * SceneBackground — draws a layered nature scene using SVG.
 * Adapts based on sceneType (park, beach, forest, mountain, city).
 */
import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Path, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SceneType } from '../game/locations';

const { width } = Dimensions.get('window');
const SCENE_H = 280;

interface SceneBackgroundProps {
  sceneType: SceneType;
  skyTop: string;
  skyBottom: string;
  groundColor: string;
  accentColor: string;
  timeOfDay?: 'day' | 'dusk' | 'night';
}

export function SceneBackground({
  sceneType,
  skyTop,
  skyBottom,
  groundColor,
  accentColor,
  timeOfDay = 'day',
}: SceneBackgroundProps) {
  const W = width;
  const H = SCENE_H;
  const groundY = H * 0.62;

  return (
    <View style={[styles.container, { height: H }]}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={skyTop} />
            <Stop offset="1" stopColor={skyBottom} />
          </LinearGradient>
          <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={groundColor} />
            <Stop offset="1" stopColor={darken(groundColor, 0.2)} />
          </LinearGradient>
        </Defs>

        {/* Sky */}
        <Rect x={0} y={0} width={W} height={H} fill="url(#sky)" />

        {/* Clouds (day only) */}
        {timeOfDay === 'day' && <Clouds W={W} />}

        {/* Sun or moon */}
        {timeOfDay === 'day' && <Circle cx={W * 0.82} cy={50} r={30} fill="#FFF9C4" opacity={0.9} />}
        {timeOfDay === 'dusk' && <Circle cx={W * 0.15} cy={70} r={36} fill="#FF8C00" opacity={0.85} />}
        {timeOfDay === 'night' && (
          <G>
            <Circle cx={W * 0.8} cy={50} r={25} fill="#FFFDE7" />
            {[{x:50,y:30},{x:120,y:60},{x:200,y:20},{x:300,y:45},{x:W-60,y:35}].map((s,i) => (
              <Circle key={i} cx={s.x} cy={s.y} r={2} fill="white" opacity={0.8} />
            ))}
          </G>
        )}

        {/* Scene-specific middle layer */}
        {sceneType === 'park' && <ParkScene W={W} groundY={groundY} accent={accentColor} />}
        {sceneType === 'beach' && <BeachScene W={W} groundY={groundY} accent={accentColor} />}
        {(sceneType === 'forest' || sceneType === 'jungle') && <ForestScene W={W} groundY={groundY} accent={accentColor} />}
        {sceneType === 'mountain' && <MountainScene W={W} groundY={groundY} accent={accentColor} />}
        {sceneType === 'city' && <CityScene W={W} groundY={groundY} accent={accentColor} />}

        {/* Ground */}
        <Rect x={0} y={groundY} width={W} height={H - groundY} fill="url(#ground)" />

        {/* Ground highlight */}
        <Rect x={0} y={groundY} width={W} height={4} fill={`rgba(255,255,255,0.18)`} />

        {/* Foreground grass tufts (park/forest) */}
        {(sceneType === 'park' || sceneType === 'forest' || sceneType === 'jungle') && (
          <GrassTufts W={W} groundY={groundY} color={accentColor} />
        )}
        {/* Foreground sand ripples (beach) */}
        {sceneType === 'beach' && <SandRipples W={W} groundY={groundY} />}
      </Svg>
    </View>
  );
}

// ── Sub-scenes ──────────────────────────────────────────────────────

function Clouds({ W }: { W: number }) {
  const clouds = [
    { x: 40, y: 40, s: 1 },
    { x: W * 0.45, y: 28, s: 1.3 },
    { x: W * 0.65, y: 55, s: 0.8 },
  ];
  return (
    <G>
      {clouds.map((c, i) => (
        <G key={i} transform={`translate(${c.x},${c.y}) scale(${c.s})`}>
          <Ellipse cx={0} cy={0} rx={36} ry={18} fill="white" opacity={0.85} />
          <Ellipse cx={-22} cy={4} rx={22} ry={14} fill="white" opacity={0.85} />
          <Ellipse cx={24} cy={4} rx={24} ry={14} fill="white" opacity={0.85} />
        </G>
      ))}
    </G>
  );
}

function ParkScene({ W, groundY, accent }: { W: number; groundY: number; accent: string }) {
  const trees = [
    { x: W * 0.08, h: 110 },
    { x: W * 0.22, h: 90 },
    { x: W * 0.72, h: 100 },
    { x: W * 0.88, h: 120 },
  ];
  return (
    <G>
      {trees.map((t, i) => (
        <G key={i}>
          {/* Trunk */}
          <Rect x={t.x - 8} y={groundY - t.h * 0.4} width={16} height={t.h * 0.42} rx={4} fill="#795548" />
          {/* Canopy layers */}
          <Ellipse cx={t.x} cy={groundY - t.h * 0.72} rx={38} ry={32} fill={accent} />
          <Ellipse cx={t.x - 12} cy={groundY - t.h * 0.82} rx={30} ry={26} fill={lighten(accent, 0.1)} />
          <Ellipse cx={t.x + 10} cy={groundY - t.h * 0.78} rx={28} ry={24} fill={accent} />
        </G>
      ))}
      {/* Pond */}
      <Ellipse cx={W * 0.5} cy={groundY - 20} rx={55} ry={18} fill="#64B5F6" opacity={0.7} />
      <Ellipse cx={W * 0.5} cy={groundY - 20} rx={50} ry={14} fill="#90CAF9" opacity={0.5} />
      {/* Bench */}
      <Rect x={W * 0.36} y={groundY - 28} width={40} height={6} rx={3} fill="#A1887F" />
      <Rect x={W * 0.38} y={groundY - 22} width={6} height={22} rx={3} fill="#8D6E63" />
      <Rect x={W * 0.56} y={groundY - 22} width={6} height={22} rx={3} fill="#8D6E63" />
    </G>
  );
}

function BeachScene({ W, groundY, accent }: { W: number; groundY: number; accent: string }) {
  return (
    <G>
      {/* Ocean */}
      <Rect x={0} y={groundY - 60} width={W} height={64} fill="#0288D1" opacity={0.75} />
      {/* Wave */}
      <Path
        d={`M 0,${groundY-30} Q ${W*0.15},${groundY-50} ${W*0.3},${groundY-30} Q ${W*0.45},${groundY-10} ${W*0.6},${groundY-30} Q ${W*0.75},${groundY-50} ${W*0.9},${groundY-30} L ${W},${groundY-30} L ${W},${groundY} L 0,${groundY} Z`}
        fill="#4FC3F7"
        opacity={0.6}
      />
      {/* Wave foam */}
      <Path
        d={`M 0,${groundY-30} Q ${W*0.15},${groundY-48} ${W*0.3},${groundY-30} Q ${W*0.45},${groundY-12} ${W*0.6},${groundY-30} Q ${W*0.75},${groundY-48} ${W*0.9},${groundY-30}`}
        stroke="white"
        strokeWidth={4}
        fill="none"
        opacity={0.6}
      />
      {/* Seashells */}
      {[W*0.2, W*0.5, W*0.75].map((x, i) => (
        <Ellipse key={i} cx={x} cy={groundY + 10} rx={8} ry={5} fill={['#FFB6C1','#FFE0B2','#E1BEE7'][i]} />
      ))}
      {/* Boardwalk planks */}
      {Array.from({length: 6}, (_, i) => (
        <Rect key={i} x={W*0.6 + i*18} y={groundY - 5} width={14} height={40} fill="#8D6E63" opacity={0.7} />
      ))}
    </G>
  );
}

function ForestScene({ W, groundY, accent }: { W: number; groundY: number; accent: string }) {
  const trees = [
    { x: W * 0.05, h: 140 },
    { x: W * 0.18, h: 160 },
    { x: W * 0.35, h: 130 },
    { x: W * 0.62, h: 150 },
    { x: W * 0.78, h: 145 },
    { x: W * 0.92, h: 135 },
  ];
  return (
    <G>
      {/* Back trees (darker) */}
      {trees.map((t, i) => (
        <G key={i}>
          <Rect x={t.x - 6} y={groundY - t.h * 0.45} width={12} height={t.h * 0.47} rx={3} fill="#5D4037" />
          <Path
            d={`M ${t.x},${groundY - t.h} L ${t.x - 35},${groundY - t.h * 0.5} L ${t.x + 35},${groundY - t.h * 0.5} Z`}
            fill={darken(accent, 0.1)}
          />
          <Path
            d={`M ${t.x},${groundY - t.h * 0.82} L ${t.x - 28},${groundY - t.h * 0.45} L ${t.x + 28},${groundY - t.h * 0.45} Z`}
            fill={accent}
          />
          <Path
            d={`M ${t.x},${groundY - t.h * 0.65} L ${t.x - 22},${groundY - t.h * 0.35} L ${t.x + 22},${groundY - t.h * 0.35} Z`}
            fill={lighten(accent, 0.08)}
          />
        </G>
      ))}
      {/* Mushrooms */}
      {[W*0.44, W*0.54].map((x, i) => (
        <G key={i}>
          <Rect x={x-3} y={groundY-16} width={6} height={18} rx={2} fill="#E8D5B7" />
          <Ellipse cx={x} cy={groundY-18} rx={12} ry={8} fill={i===0?'#E53935':'#FF8F00'} />
          {[x-5,x,x+5].map((dx,j) => <Circle key={j} cx={dx} cy={groundY-20} r={2} fill="white" />)}
        </G>
      ))}
    </G>
  );
}

function MountainScene({ W, groundY, accent }: { W: number; groundY: number; accent: string }) {
  return (
    <G>
      {/* Far mountains */}
      <Path
        d={`M 0,${groundY} L ${W*0.2},${groundY*0.3} L ${W*0.4},${groundY} Z`}
        fill="#B0BEC5"
      />
      <Path
        d={`M ${W*0.25},${groundY} L ${W*0.5},${groundY*0.22} L ${W*0.75},${groundY} Z`}
        fill="#90A4AE"
      />
      <Path
        d={`M ${W*0.55},${groundY} L ${W*0.82},${groundY*0.28} L ${W},${groundY} Z`}
        fill="#B0BEC5"
      />
      {/* Snow caps */}
      <Path
        d={`M ${W*0.2},${groundY*0.3} L ${W*0.14},${groundY*0.42} L ${W*0.27},${groundY*0.42} Z`}
        fill="white"
        opacity={0.9}
      />
      <Path
        d={`M ${W*0.5},${groundY*0.22} L ${W*0.42},${groundY*0.36} L ${W*0.58},${groundY*0.36} Z`}
        fill="white"
        opacity={0.9}
      />
      {/* Pine trees on slope */}
      {[W*0.12, W*0.32, W*0.58, W*0.76].map((x, i) => (
        <G key={i}>
          <Path
            d={`M ${x},${groundY-80} L ${x-20},${groundY-40} L ${x+20},${groundY-40} Z`}
            fill={accent}
          />
          <Path
            d={`M ${x},${groundY-60} L ${x-16},${groundY-28} L ${x+16},${groundY-28} Z`}
            fill={lighten(accent, 0.05)}
          />
          <Rect x={x-4} y={groundY-28} width={8} height={28} rx={2} fill="#5D4037" />
        </G>
      ))}
    </G>
  );
}

function CityScene({ W, groundY, accent }: { W: number; groundY: number; accent: string }) {
  const buildings = [
    { x: W*0.04, w: 52, h: 130, color: '#B0BEC5' },
    { x: W*0.18, w: 40, h: 100, color: '#90A4AE' },
    { x: W*0.32, w: 60, h: 150, color: '#CFD8DC' },
    { x: W*0.55, w: 45, h: 110, color: '#ECEFF1' },
    { x: W*0.70, w: 55, h: 130, color: '#B0BEC5' },
    { x: W*0.85, w: 50, h: 120, color: '#90A4AE' },
  ];
  return (
    <G>
      {buildings.map((b, i) => (
        <G key={i}>
          <Rect x={b.x} y={groundY - b.h} width={b.w} height={b.h} rx={2} fill={b.color} />
          {/* Windows */}
          {Array.from({length: Math.floor(b.h/22)}, (_, row) =>
            Array.from({length: Math.floor(b.w/16)}, (_, col) => (
              <Rect
                key={`${row}-${col}`}
                x={b.x + 6 + col * 16}
                y={groundY - b.h + 10 + row * 22}
                width={8}
                height={12}
                rx={1}
                fill={(row + col + i) % 3 !== 0 ? '#FFF9C4' : '#546E7A'}
                opacity={0.85}
              />
            ))
          )}
        </G>
      ))}
      {/* Brooklyn bridge cables suggestion */}
      <Path
        d={`M ${W*0.35},${groundY-50} Q ${W*0.5},${groundY-160} ${W*0.65},${groundY-50}`}
        stroke="#9E9E9E"
        strokeWidth={2}
        fill="none"
        opacity={0.5}
      />
      {/* Street */}
      <Rect x={0} y={groundY} width={W} height={20} fill="#607D8B" />
      {/* Sidewalk crack lines */}
      {Array.from({length:8},(_,i) => (
        <Rect key={i} x={i*(W/8)} y={groundY} width={2} height={20} fill="#546E7A" />
      ))}
    </G>
  );
}

function GrassTufts({ W, groundY, color }: { W: number; groundY: number; color: string }) {
  const tufts = Array.from({ length: 12 }, (_, i) => W * (i + 0.5) / 12);
  return (
    <G>
      {tufts.map((x, i) => (
        <G key={i}>
          <Path d={`M ${x-6},${groundY} Q ${x-3},${groundY-14} ${x},${groundY-8}`} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Path d={`M ${x},${groundY-2} Q ${x+2},${groundY-16} ${x+5},${groundY-8}`} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>
      ))}
    </G>
  );
}

function SandRipples({ W, groundY }: { W: number; groundY: number }) {
  return (
    <G>
      {[8, 18, 28].map((offset, i) => (
        <Path
          key={i}
          d={`M 20,${groundY + offset} Q ${W*0.3},${groundY + offset - 4} ${W*0.6},${groundY + offset + 2} Q ${W*0.8},${groundY + offset + 4} ${W-20},${groundY + offset}`}
          stroke="rgba(200,160,100,0.3)"
          strokeWidth={1.5}
          fill="none"
        />
      ))}
    </G>
  );
}

// ── Color utils ─────────────────────────────────────────────────────

function darken(hex: string, amount: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(parseInt(result[1],16)*(1-amount)).toString(16).padStart(2,'0')}${clamp(parseInt(result[2],16)*(1-amount)).toString(16).padStart(2,'0')}${clamp(parseInt(result[3],16)*(1-amount)).toString(16).padStart(2,'0')}`;
}

function lighten(hex: string, amount: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = parseInt(result[1],16), g = parseInt(result[2],16), b = parseInt(result[3],16);
  return `#${clamp(r+(255-r)*amount).toString(16).padStart(2,'0')}${clamp(g+(255-g)*amount).toString(16).padStart(2,'0')}${clamp(b+(255-b)*amount).toString(16).padStart(2,'0')}`;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
});
