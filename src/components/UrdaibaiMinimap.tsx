import React from 'react';
import {
  ROAD_SEGMENTS,
  URDAIBAI_LANDMARKS,
  WORLD_HALF_SIZE,
  okaChannelCenterX,
} from '../world/urdaibaiMap';
import { EUSKOTREN_RAIL_POINTS } from '../world/osmUrdaibaiData';

interface UrdaibaiMinimapProps {
  playerX: number;
  playerZ: number;
  yawDeg: number;
  discoveredIds: string[];
  onOpenFullMap: () => void;
}

const SIZE = 156;
const HALF = SIZE / 2;
const VIEW_SPAN = 650; // meters visible across minimap width

function toMap(wx: number, wz: number, px: number, pz: number): [number, number] {
  const sx = HALF + ((wx - px) / VIEW_SPAN) * SIZE;
  const sy = HALF + ((wz - pz) / VIEW_SPAN) * SIZE;
  return [sx, sy];
}

export const UrdaibaiMinimap: React.FC<UrdaibaiMinimapProps> = ({
  playerX,
  playerZ,
  yawDeg,
  discoveredIds,
  onOpenFullMap,
}) => {
  const discoveredSet = new Set(discoveredIds);

  // Build simplified Oka estuary river ribbon path in local minimap space
  const riverPts: string[] = [];
  for (let z = -260; z <= 620; z += 40) {
    const [sx, sy] = toMap(okaChannelCenterX(z), z, playerX, playerZ);
    riverPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
  }

  const railPts = EUSKOTREN_RAIL_POINTS.map(([rx, rz]) => {
    const [sx, sy] = toMap(rx, rz, playerX, playerZ);
    return `${sx.toFixed(1)},${sy.toFixed(1)}`;
  }).join(' ');

  // Sea northern horizon line approx
  const [, seaLineY] = toMap(0, -245, playerX, playerZ);

  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={(e) => {
        e.currentTarget.blur();
        onOpenFullMap();
      }}
      aria-label="Ireki Urdaibaiko Mapa Osoa"
      className="relative w-[108px] h-[108px] sm:w-[156px] sm:h-[156px] rounded-lg overflow-hidden border-2 border-white/25 bg-[#1b4332] shadow-lg cursor-pointer group pointer-events-auto focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full block">
        {/* Cantabrian Sea north of coastline */}
        {seaLineY > 0 && (
          <rect x="0" y="0" width={SIZE} height={Math.min(SIZE, seaLineY)} fill="#0c4a6e" />
        )}

        {/* Oka Estuary channel */}
        <polyline
          points={riverPts.join(' ')}
          fill="none"
          stroke="#0e7490"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Euskotren rail line */}
        <polyline
          points={railPts}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.6"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Road network */}
        {ROAD_SEGMENTS.map((seg) => {
          const pts = seg.points
            .map(([rx, rz]) => {
              const [sx, sy] = toMap(rx, rz, playerX, playerZ);
              return `${sx.toFixed(1)},${sy.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polyline
              key={seg.id}
              points={pts}
              fill="none"
              stroke={seg.isBridge ? '#f59e0b' : '#cbd5e1'}
              strokeWidth={seg.isBridge ? 2.6 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Landmarks */}
        {URDAIBAI_LANDMARKS.map((lm) => {
          const [lx, ly] = toMap(lm.x, lm.z, playerX, playerZ);
          if (lx < -8 || lx > SIZE + 8 || ly < -8 || ly > SIZE + 8) return null;
          const found = discoveredSet.has(lm.id);
          return (
            <g key={lm.id}>
              <circle
                cx={lx}
                cy={ly}
                r="4"
                fill={found ? '#10b981' : '#f59e0b'}
                stroke="#09111a"
                strokeWidth="1.4"
              />
            </g>
          );
        })}

        {/* World boundary indicator */}
        {(() => {
          const [minX, minY] = toMap(-WORLD_HALF_SIZE, -WORLD_HALF_SIZE, playerX, playerZ);
          const span = ((WORLD_HALF_SIZE * 2) / VIEW_SPAN) * SIZE;
          return (
            <rect
              x={minX}
              y={minY}
              width={span}
              height={span}
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeDasharray="4 3"
              strokeWidth="1"
            />
          );
        })()}

        {/* Player heading arrow at center */}
        <g transform={`translate(${HALF}, ${HALF}) rotate(${180 - yawDeg})`}>
          <polygon points="0,-8 5.5,6 0,3 -5.5,6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        </g>
      </svg>

      <span className="absolute top-1.5 left-2 text-[10px] font-display font-bold tracking-wider text-white/90 bg-slate-950/75 px-1.5 py-0.5 rounded">
        GPS · TAB
      </span>
    </button>
  );
};
