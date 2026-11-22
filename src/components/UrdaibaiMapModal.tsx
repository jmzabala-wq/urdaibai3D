import React from 'react';
import {
  ROAD_SEGMENTS,
  URDAIBAI_LANDMARKS,
  WORLD_HALF_SIZE,
  okaChannelCenterX,
  type Landmark,
  type VehicleId,
} from '../world/urdaibaiMap';
import { EUSKOTREN_RAIL_POINTS, EUSKOTREN_STATIONS } from '../world/osmUrdaibaiData';
import { VEHICLE_SPECS } from '../physics/vehiclePhysics';

interface UrdaibaiMapModalProps {
  playerX: number;
  playerZ: number;
  discoveredIds: string[];
  onClose: () => void;
  onTeleport: (landmarkId: string, vehicle?: VehicleId) => void;
}

const SVG_SIZE = 540;
function toSvg(x: number, z: number): [number, number] {
  const sx = ((x + WORLD_HALF_SIZE) / (WORLD_HALF_SIZE * 2)) * SVG_SIZE;
  const sy = ((z + WORLD_HALF_SIZE) / (WORLD_HALF_SIZE * 2)) * SVG_SIZE;
  return [sx, sy];
}

export const UrdaibaiMapModal: React.FC<UrdaibaiMapModalProps> = ({
  playerX,
  playerZ,
  discoveredIds,
  onClose,
  onTeleport,
}) => {
  const discoveredSet = new Set(discoveredIds);

  const riverPts: string[] = [];
  for (let z = -260; z <= 680; z += 30) {
    const [sx, sy] = toSvg(okaChannelCenterX(z), z);
    riverPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
  }

  const [px, py] = toSvg(playerX, playerZ);

  const handleSelect = (lm: Landmark, withVehicle: boolean) => {
    onTeleport(lm.id, withVehicle ? lm.suggestedVehicle : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 bg-[rgba(5,10,18,0.88)] flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-950 border border-white/20 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-50">
              Urdaibai Biosfera Erreserba — Mapa Topografikoa
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sakatu edozein leku bertara bidaiatzeko · {discoveredIds.length}/{URDAIBAI_LANDMARKS.length} aurkituta · OpenStreetMap + Euskotren
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
          >
            Itxi [Tab / Esc]
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Interactive Simplified Urdaibai Map */}
          <div className="lg:col-span-7 p-5 bg-[#0a1929] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10">
            <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full max-w-[500px] aspect-square rounded-lg border border-white/15 bg-[#2d5a3c]">
              {/* Cantabrian Sea North */}
              <path
                d={`M 0 0 L ${SVG_SIZE} 0 L ${SVG_SIZE} 195 Q 400 205 270 198 Q 130 190 0 145 Z`}
                fill="#0b4f6c"
              />

              {/* Laida & Laga Sandbanks */}
              <ellipse cx={toSvg(55, -175)[0]} cy={toSvg(55, -175)[1]} rx="28" ry="16" fill="#e5c88c" />
              <ellipse cx={toSvg(345, -215)[0]} cy={toSvg(345, -215)[1]} rx="20" ry="12" fill="#e5c88c" />

              {/* Topographic contour rings for Ogoño, Atxarre, Gaztelugatxe, Izaro */}
              {[
                { x: 485, z: -315, r: 34, label: 'Ogoño 138m' },
                { x: 205, z: 35, r: 36, label: 'Atxarre 122m' },
                { x: -575, z: -475, r: 18, label: 'Gaztelugatxe' },
                { x: -15, z: -465, r: 16, label: 'Izaro' },
              ].map((peak) => {
                const [cx, cy] = toSvg(peak.x, peak.z);
                return (
                  <g key={peak.label}>
                    <circle cx={cx} cy={cy} r={peak.r} fill="#3f6e49" stroke="#689f74" strokeWidth="1" />
                    <circle cx={cx} cy={cy} r={peak.r * 0.55} fill="#5c8a66" stroke="#a3c4a8" strokeWidth="1" />
                  </g>
                );
              })}

              {/* Oka Estuary */}
              <polyline
                points={riverPts.join(' ')}
                fill="none"
                stroke="#0e7490"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Euskotren E4 Railway & Stations */}
              <polyline
                points={EUSKOTREN_RAIL_POINTS.map(([rx, rz]) => toSvg(rx, rz).join(',')).join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {EUSKOTREN_STATIONS.map((st) => {
                const [sx, sy] = toSvg(st.x, st.z);
                return <rect key={st.id} x={sx - 2.5} y={sy - 2.5} width="5" height="5" rx="1" fill="#38bdf8" stroke="#09111a" strokeWidth="1" />;
              })}

              {/* Roads */}
              {ROAD_SEGMENTS.map((seg) => (
                <polyline
                  key={seg.id}
                  points={seg.points.map(([rx, rz]) => toSvg(rx, rz).join(',')).join(' ')}
                  fill="none"
                  stroke={seg.isBridge ? '#f59e0b' : '#e2e8f0'}
                  strokeWidth={seg.isBridge ? 3.5 : 2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Landmarks clickable */}
              {URDAIBAI_LANDMARKS.map((lm) => {
                const [lx, ly] = toSvg(lm.x, lm.z);
                const found = discoveredSet.has(lm.id);
                const isLeft =
                  lm.id === 'mundaka' ||
                  lm.id === 'sukarrieta' ||
                  lm.id === 'bermeo' ||
                  lm.id === 'busturia' ||
                  lm.id === 'laga';
                const dx = isLeft ? -10 : lm.id === 'laida' ? 0 : 10;
                const dy =
                  lm.id === 'bermeo'
                    ? -6
                    : lm.id === 'laida'
                      ? -12
                      : lm.id === 'laga'
                        ? 14
                        : lm.id === 'elantxobe'
                          ? 12
                          : lm.id === 'ogono'
                            ? -10
                            : lm.id === 'busturia'
                              ? 6
                              : 4;
                const anchor = isLeft ? 'end' : lm.id === 'laida' ? 'middle' : 'start';
                return (
                  <g
                    key={lm.id}
                    onClick={() => handleSelect(lm, false)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={lx}
                      cy={ly}
                      r="6.5"
                      fill={found ? '#10b981' : '#f59e0b'}
                      stroke="#09111a"
                      strokeWidth="2"
                    />
                    <text
                      x={lx + dx}
                      y={ly + dy}
                      textAnchor={anchor}
                      fontSize="10"
                      fontWeight="700"
                      fill="#f8fafc"
                      style={{ textShadow: '0 1px 3px #000' }}
                    >
                      {lm.name}
                    </text>
                  </g>
                );
              })}

              {/* Player Marker */}
              <g transform={`translate(${px}, ${py})`}>
                <circle r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
              </g>
            </svg>
          </div>

          {/* Landmark Directory & Suggested Vehicles */}
          <div className="lg:col-span-5 p-4 space-y-2 max-h-[540px] overflow-y-auto">
            {URDAIBAI_LANDMARKS.map((lm) => {
              const found = discoveredSet.has(lm.id);
              const sugSpec = VEHICLE_SPECS[lm.suggestedVehicle];
              return (
                <div
                  key={lm.id}
                  className="p-3 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-slate-50 truncate">
                        {lm.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          found ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {found ? 'Aurkituta' : 'Berria'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{lm.subtitle}</p>
                    <p className="font-mono-num text-[10px] text-slate-500 mt-0.5">
                      {lm.lat.toFixed(4)}° N, {Math.abs(lm.lng).toFixed(4)}° W
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelect(lm, false)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded cursor-pointer"
                    >
                      Joan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect(lm, true)}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded cursor-pointer"
                    >
                      + {sugSpec.name}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
