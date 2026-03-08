/**
 * FurnitureSprite — SVG-drawn furniture items for Lila's room.
 * Each item is illustrated (not emoji-based) using react-native-svg.
 */
import React from 'react';
import Svg, { G, Rect, Circle, Ellipse, Path, Line, Polygon } from 'react-native-svg';

interface FurnitureSpriteProps {
  furnId: string;
  size?: number;
}

export function FurnitureSprite({ furnId, size = 80 }: FurnitureSpriteProps) {
  const renderer = FURN_RENDERERS[furnId] ?? renderFallback;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {renderer()}
    </Svg>
  );
}

type Renderer = () => React.ReactNode;

// ── furn-bed ──────────────────────────────────────────────────────────────────
function renderBed(): React.ReactNode {
  return (
    <G>
      {/* Bed frame sides */}
      <Rect x={8} y={42} width={84} height={46} rx={3} fill="#8B5E3C" />
      {/* Mattress */}
      <Rect x={12} y={44} width={76} height={38} rx={3} fill="#F5EFE6" />
      {/* Mattress border detail */}
      <Rect x={14} y={46} width={72} height={34} rx={2} fill="none" stroke="#DDD5C8" strokeWidth={1.5} />

      {/* Nature-print blanket (folded over top half) */}
      <Rect x={12} y={44} width={76} height={22} rx={3} fill="#5CB85C" />
      {/* Leaf shapes on blanket */}
      <Ellipse cx={28} cy={52} rx={5} ry={3} fill="#3D8B3D" transform="rotate(-30 28 52)" />
      <Ellipse cx={44} cy={48} rx={5} ry={3} fill="#3D8B3D" transform="rotate(20 44 48)" />
      <Ellipse cx={60} cy={54} rx={5} ry={3} fill="#3D8B3D" transform="rotate(-15 60 54)" />
      <Ellipse cx={76} cy={50} rx={5} ry={3} fill="#3D8B3D" transform="rotate(35 76 50)" />
      <Ellipse cx={36} cy={60} rx={4} ry={2.5} fill="#3D8B3D" transform="rotate(10 36 60)" />
      <Ellipse cx={52} cy={57} rx={4} ry={2.5} fill="#3D8B3D" transform="rotate(-25 52 57)" />
      <Ellipse cx={68} cy={61} rx={4} ry={2.5} fill="#3D8B3D" transform="rotate(15 68 61)" />
      {/* Leaf vein lines */}
      <Line x1={25} y1={52} x2={31} y2={52} stroke="#2E7D32" strokeWidth={0.8} />
      <Line x1={41} y1={48} x2={47} y2={48} stroke="#2E7D32" strokeWidth={0.8} />
      <Line x1={57} y1={54} x2={63} y2={54} stroke="#2E7D32" strokeWidth={0.8} />

      {/* Two pillows */}
      <Rect x={15} y={45} width={28} height={15} rx={5} fill="#FFF8E1" />
      <Rect x={48} y={45} width={28} height={15} rx={5} fill="#FFF8E1" />
      {/* Pillow crease lines */}
      <Line x1={18} y1={52} x2={40} y2={52} stroke="#E8DFC8" strokeWidth={1} />
      <Line x1={51} y1={52} x2={73} y2={52} stroke="#E8DFC8" strokeWidth={1} />

      {/* Headboard */}
      <Rect x={8} y={18} width={84} height={30} rx={5} fill="#7B4F2E" />
      {/* Headboard arch cutout shape (decorative top) */}
      <Path d="M 18,18 Q 50,6 82,18 Z" fill="#6A3F22" />
      {/* Wood grain lines on headboard */}
      <Line x1={22} y1={20} x2={20} y2={46} stroke="#6A3F22" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={35} y1={19} x2={33} y2={46} stroke="#6A3F22" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={50} y1={18} x2={50} y2={46} stroke="#6A3F22" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={65} y1={19} x2={67} y2={46} stroke="#6A3F22" strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={78} y1={20} x2={80} y2={46} stroke="#6A3F22" strokeWidth={1.2} strokeLinecap="round" />

      {/* Bed legs */}
      <Rect x={10} y={84} width={8} height={12} rx={2} fill="#7B4F2E" />
      <Rect x={82} y={84} width={8} height={12} rx={2} fill="#7B4F2E" />
    </G>
  );
}

// ── furn-lamp ─────────────────────────────────────────────────────────────────
function renderLamp(): React.ReactNode {
  return (
    <G>
      {/* Base (round ceramic) */}
      <Ellipse cx={50} cy={86} rx={20} ry={7} fill="#B0BEC5" />
      <Ellipse cx={50} cy={80} rx={14} ry={12} fill="#CFD8DC" />
      {/* Ceramic body gloss highlight */}
      <Ellipse cx={44} cy={75} rx={4} ry={6} fill="rgba(255,255,255,0.35)" />
      {/* Thin pole */}
      <Rect x={48} y={42} width={4} height={40} rx={2} fill="#90A4AE" />
      {/* Pole connector knob */}
      <Circle cx={50} cy={44} r={4} fill="#78909C" />

      {/* Lampshade (trapezoid) */}
      <Path d="M 22,44 L 78,44 L 68,14 L 32,14 Z" fill="#FFF9C4" />
      {/* Warm yellow inner glow surface */}
      <Path d="M 26,43 L 74,43 L 66,18 L 34,18 Z" fill="#FFF176" />
      {/* Shade top rim */}
      <Rect x={32} y={12} width={36} height={4} rx={2} fill="#F9A825" />
      {/* Shade bottom rim */}
      <Rect x={20} y={43} width={60} height={4} rx={2} fill="#F9A825" />
      {/* Shade stripe details */}
      <Line x1={40} y1={15} x2={36} y2={43} stroke="rgba(249,168,37,0.4)" strokeWidth={1.5} />
      <Line x1={50} y1={14} x2={50} y2={43} stroke="rgba(249,168,37,0.4)" strokeWidth={1.5} />
      <Line x1={60} y1={15} x2={64} y2={43} stroke="rgba(249,168,37,0.4)" strokeWidth={1.5} />

      {/* Warm glow cast downward (soft ellipse) */}
      <Ellipse cx={50} cy={47} rx={28} ry={6} fill="rgba(255,249,128,0.25)" />
    </G>
  );
}

// ── furn-poster ───────────────────────────────────────────────────────────────
function renderPoster(): React.ReactNode {
  return (
    <G>
      {/* Wooden frame outer */}
      <Rect x={8} y={8} width={84} height={84} rx={4} fill="#8B5E3C" />
      {/* Wooden frame inner bevel */}
      <Rect x={12} y={12} width={76} height={76} rx={2} fill="#7B4F2E" />
      {/* Paper background */}
      <Rect x={15} y={15} width={70} height={70} rx={1} fill="#F5F0E8" />

      {/* Nature map — sky area */}
      <Rect x={15} y={15} width={70} height={22} rx={1} fill="#B3E5FC" />

      {/* Green land areas */}
      <Ellipse cx={32} cy={55} rx={16} ry={20} fill="#66BB6A" />
      <Ellipse cx={62} cy={60} rx={14} ry={17} fill="#43A047" />
      <Rect x={38} y={48} width={20} height={22} rx={2} fill="#5CB85C" />

      {/* Blue water / lake */}
      <Ellipse cx={50} cy={72} rx={18} ry={8} fill="#4FC3F7" />
      <Ellipse cx={30} cy={68} rx={8} ry={5} fill="#29B6F6" />

      {/* Mountain triangles */}
      <Polygon points="60,36 72,20 84,36" fill="#9E9E9E" />
      <Polygon points="52,36 62,24 74,36" fill="#BDBDBD" />
      {/* Snow caps */}
      <Polygon points="60,36 66,27 72,36" fill="white" />
      <Polygon points="52,36 57,29 62,36" fill="white" />

      {/* Small tree dots */}
      <Circle cx={26} cy={50} r={3} fill="#2E7D32" />
      <Circle cx={34} cy={44} r={2.5} fill="#388E3C" />
      <Circle cx={42} cy={52} r={3} fill="#2E7D32" />
      <Circle cx={68} cy={48} r={3} fill="#2E7D32" />
      <Circle cx={76} cy={54} r={2.5} fill="#388E3C" />

      {/* Path/trail line */}
      <Path d="M 30,76 Q 50,68 68,76" stroke="#C8A96E" strokeWidth={2} fill="none" strokeDasharray="3,2" />

      {/* Frame corner detail */}
      <Rect x={8} y={8} width={10} height={10} rx={2} fill="#6A3F22" />
      <Rect x={82} y={8} width={10} height={10} rx={2} fill="#6A3F22" />
      <Rect x={8} y={82} width={10} height={10} rx={2} fill="#6A3F22" />
      <Rect x={82} y={82} width={10} height={10} rx={2} fill="#6A3F22" />
    </G>
  );
}

// ── furn-bookshelf ────────────────────────────────────────────────────────────
function renderBookshelf(): React.ReactNode {
  return (
    <G>
      {/* Outer shelf frame */}
      <Rect x={6} y={10} width={88} height={85} rx={3} fill="#8B5E3C" />
      {/* Back panel */}
      <Rect x={12} y={14} width={76} height={77} rx={1} fill="#C8A97A" />

      {/* Top shelf board */}
      <Rect x={10} y={14} width={80} height={6} rx={2} fill="#7B4F2E" />
      {/* Mid shelf board */}
      <Rect x={10} y={53} width={80} height={6} rx={2} fill="#7B4F2E" />
      {/* Bottom board */}
      <Rect x={10} y={85} width={80} height={6} rx={2} fill="#7B4F2E" />

      {/* ── Top shelf books ── */}
      {/* Book 1 — tall red */}
      <Rect x={15} y={22} width={9} height={29} rx={1} fill="#E53935" />
      <Rect x={15} y={22} width={9} height={3} rx={1} fill="#C62828" />
      {/* Book 2 — blue */}
      <Rect x={25} y={26} width={8} height={25} rx={1} fill="#1E88E5" />
      <Rect x={25} y={26} width={8} height={3} rx={1} fill="#1565C0" />
      {/* Book 3 — yellow */}
      <Rect x={34} y={24} width={10} height={27} rx={1} fill="#FDD835" />
      <Rect x={34} y={24} width={10} height={3} rx={1} fill="#F9A825" />
      {/* Book 4 — green */}
      <Rect x={45} y={22} width={8} height={29} rx={1} fill="#43A047" />
      <Rect x={45} y={22} width={8} height={3} rx={1} fill="#2E7D32" />
      {/* Book 5 — purple — laid flat on top of book 4 */}
      <Rect x={44} y={19} width={16} height={5} rx={1} fill="#7B1FA2" />
      {/* Book 6 — orange */}
      <Rect x={54} y={25} width={9} height={26} rx={1} fill="#FB8C00" />
      <Rect x={54} y={25} width={9} height={3} rx={1} fill="#E65100" />
      {/* Book 7 — teal small */}
      <Rect x={64} y={28} width={7} height={23} rx={1} fill="#00897B" />
      <Rect x={64} y={28} width={7} height={3} rx={1} fill="#00695C" />
      {/* Book 8 — pink tall */}
      <Rect x={72} y={21} width={9} height={30} rx={1} fill="#F06292" />
      <Rect x={72} y={21} width={9} height={3} rx={1} fill="#C2185B" />

      {/* ── Bottom shelf books ── */}
      {/* Book A — dark blue */}
      <Rect x={14} y={61} width={11} height={22} rx={1} fill="#283593" />
      <Rect x={14} y={61} width={11} height={3} rx={1} fill="#1A237E" />
      {/* Book B — lime */}
      <Rect x={26} y={64} width={8} height={19} rx={1} fill="#7CB342" />
      {/* Book C — brown */}
      <Rect x={35} y={62} width={9} height={21} rx={1} fill="#795548" />
      {/* Book D — coral, laid flat on top */}
      <Rect x={35} y={59} width={18} height={5} rx={1} fill="#FF7043" />
      {/* Book E — indigo */}
      <Rect x={45} y={63} width={8} height={20} rx={1} fill="#5C6BC0" />
      {/* Book F — yellow-green */}
      <Rect x={54} y={65} width={7} height={18} rx={1} fill="#CDDC39" />
      {/* Book G — red-brown */}
      <Rect x={62} y={61} width={10} height={22} rx={1} fill="#BF360C" />
      {/* Book H — slate */}
      <Rect x={73} y={63} width={9} height={20} rx={1} fill="#546E7A" />
    </G>
  );
}

// ── furn-cactus ───────────────────────────────────────────────────────────────
function renderCactus(): React.ReactNode {
  return (
    <G>
      {/* Terracotta pot */}
      <Path d="M 28,88 L 22,68 L 78,68 L 72,88 Z" fill="#D84315" />
      {/* Pot rim */}
      <Rect x={20} y={64} width={60} height={7} rx={3} fill="#BF360C" />
      {/* Pot soil */}
      <Ellipse cx={50} cy={67} rx={26} ry={5} fill="#5D4037" />
      {/* Pot shine */}
      <Path d="M 26,70 Q 30,62 34,70" stroke="rgba(255,255,255,0.3)" strokeWidth={2} fill="none" strokeLinecap="round" />

      {/* Main cactus body */}
      <Rect x={38} y={24} width={24} height={46} rx={12} fill="#388E3C" />
      {/* Body highlight */}
      <Rect x={41} y={28} width={8} height={38} rx={4} fill="rgba(255,255,255,0.15)" />

      {/* Left arm */}
      <Path d="M 38,46 Q 16,44 16,30 Q 16,24 22,24 Q 22,30 26,34 Q 30,40 38,42 Z" fill="#43A047" />
      {/* Left arm highlight */}
      <Path d="M 20,30 Q 20,26 22,25" stroke="rgba(255,255,255,0.2)" strokeWidth={2} fill="none" strokeLinecap="round" />

      {/* Right arm */}
      <Path d="M 62,40 Q 84,38 84,26 Q 84,20 78,20 Q 78,26 74,30 Q 70,36 62,38 Z" fill="#43A047" />

      {/* Spine lines on main body */}
      <Line x1={50} y1={28} x2={50} y2={66} stroke="#2E7D32" strokeWidth={1} />
      <Line x1={42} y1={30} x2={42} y2={64} stroke="#2E7D32" strokeWidth={0.8} />
      <Line x1={58} y1={30} x2={58} y2={64} stroke="#2E7D32" strokeWidth={0.8} />
      {/* Spine ticks — left side */}
      <Line x1={38} y1={36} x2={34} y2={34} stroke="#1B5E20" strokeWidth={1} />
      <Line x1={38} y1={44} x2={34} y2={42} stroke="#1B5E20" strokeWidth={1} />
      <Line x1={38} y1={52} x2={34} y2={50} stroke="#1B5E20" strokeWidth={1} />
      <Line x1={38} y1={60} x2={34} y2={58} stroke="#1B5E20" strokeWidth={1} />
      {/* Spine ticks — right side */}
      <Line x1={62} y1={36} x2={66} y2={34} stroke="#1B5E20" strokeWidth={1} />
      <Line x1={62} y1={44} x2={66} y2={42} stroke="#1B5E20" strokeWidth={1} />
      <Line x1={62} y1={52} x2={66} y2={50} stroke="#1B5E20" strokeWidth={1} />
      <Line x1={62} y1={60} x2={66} y2={58} stroke="#1B5E20" strokeWidth={1} />

      {/* Small flower on top */}
      <Circle cx={50} cy={21} r={7} fill="#FF80AB" />
      <Circle cx={50} cy={21} r={4} fill="#FF4081" />
      {/* Flower petals */}
      <Ellipse cx={50} cy={14} rx={3} ry={4} fill="#FF80AB" />
      <Ellipse cx={50} cy={28} rx={3} ry={4} fill="#FF80AB" />
      <Ellipse cx={43} cy={21} rx={4} ry={3} fill="#FF80AB" />
      <Ellipse cx={57} cy={21} rx={4} ry={3} fill="#FF80AB" />
      {/* Flower center detail */}
      <Circle cx={50} cy={21} r={2} fill="#FFF176" />
    </G>
  );
}

// ── furn-trophy ───────────────────────────────────────────────────────────────
function renderTrophy(): React.ReactNode {
  return (
    <G>
      {/* Wooden base/plinth */}
      <Rect x={24} y={82} width={52} height={12} rx={3} fill="#8B5E3C" />
      {/* Wood grain on base */}
      <Line x1={30} y1={84} x2={30} y2={92} stroke="#7B4F2E" strokeWidth={1} />
      <Line x1={42} y1={84} x2={42} y2={92} stroke="#7B4F2E" strokeWidth={1} />
      <Line x1={58} y1={84} x2={58} y2={92} stroke="#7B4F2E" strokeWidth={1} />
      <Line x1={70} y1={84} x2={70} y2={92} stroke="#7B4F2E" strokeWidth={1} />
      {/* Plinth top accent strip */}
      <Rect x={24} y={82} width={52} height={3} rx={2} fill="#C8A96E" />

      {/* Stem / connector */}
      <Rect x={42} y={68} width={16} height={16} rx={4} fill="#C8A96E" />
      {/* Stem narrowing */}
      <Rect x={45} y={60} width={10} height={12} rx={3} fill="#D4AC5A" />

      {/* Cup body */}
      <Path d="M 18,22 Q 14,50 28,60 Q 38,66 50,66 Q 62,66 72,60 Q 86,50 82,22 Z" fill="#F9CA24" />
      {/* Cup inner shadow */}
      <Path d="M 24,24 Q 20,50 32,58 Q 40,63 50,63 Q 60,63 68,58 Q 80,50 76,24 Z" fill="#F0B429" />
      {/* Cup shine highlight */}
      <Path d="M 26,26 Q 22,46 32,54" stroke="rgba(255,255,255,0.5)" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M 34,24 Q 30,44 36,52" stroke="rgba(255,255,255,0.3)" strokeWidth={2} fill="none" strokeLinecap="round" />

      {/* Cup rim */}
      <Rect x={16} y={18} width={68} height={8} rx={4} fill="#E8B820" />
      <Rect x={18} y={18} width={64} height={5} rx={3} fill="#FDD835" />

      {/* Left handle */}
      <Path d="M 20,28 Q 6,28 6,40 Q 6,52 20,52" stroke="#E8B820" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M 20,28 Q 9,28 9,40 Q 9,52 20,52" stroke="#FDD835" strokeWidth={4} fill="none" strokeLinecap="round" />

      {/* Right handle */}
      <Path d="M 80,28 Q 94,28 94,40 Q 94,52 80,52" stroke="#E8B820" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M 80,28 Q 91,28 91,40 Q 91,52 80,52" stroke="#FDD835" strokeWidth={4} fill="none" strokeLinecap="round" />

      {/* Star on front */}
      <Polygon
        points="50,32 53,40 62,40 55,45 57,54 50,49 43,54 45,45 38,40 47,40"
        fill="#FFFFFF"
        stroke="#E8B820"
        strokeWidth={1}
      />
    </G>
  );
}

// ── Fallback (unknown furnId) — sparkle star ──────────────────────────────────
function renderFallback(): React.ReactNode {
  return (
    <G>
      <Polygon
        points="50,15 56,36 78,36 61,49 67,70 50,57 33,70 39,49 22,36 44,36"
        fill="#F9CA24"
        stroke="#E8B820"
        strokeWidth={1.5}
      />
      <Circle cx={50} cy={45} r={8} fill="#FFF176" />
    </G>
  );
}

const FURN_RENDERERS: Record<string, Renderer> = {
  'furn-bed': renderBed,
  'furn-lamp': renderLamp,
  'furn-poster': renderPoster,
  'furn-bookshelf': renderBookshelf,
  'furn-cactus': renderCactus,
  'furn-trophy': renderTrophy,
};
