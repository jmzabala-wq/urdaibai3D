import React from 'react';
import { VEHICLE_SPECS } from '../physics/vehiclePhysics';
import { URDAIBAI_LANDMARKS } from '../world/urdaibaiMap';
import { WEATHER_PRESETS } from '../world/weatherSystem';
import type { HudSnapshot } from '../three/UrdaibaiScene';

interface PauseModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  hud,
  onResume,
  onRestart,
  onTitle,
}) => {
  return (
    <div className="fixed inset-0 z-30 bg-[rgba(5,10,18,0.82)] flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-white/20 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
          Urdaibai 3D
        </p>
        <h2 className="font-display font-bold text-2xl text-slate-50 mt-1">
          Jokoa Pausatuta
        </h2>

        <div className="grid grid-cols-3 gap-2.5 my-5">
          <div className="bg-slate-900 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Lekuak</div>
            <div className="font-display font-bold text-lg text-slate-50 font-mono-num">
              {hud.discoveredIds.length}/{URDAIBAI_LANDMARKS.length}
            </div>
          </div>
          <div className="bg-slate-900 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Ibilgailua</div>
            <div className="font-display font-bold text-lg text-amber-400 truncate">
              {VEHICLE_SPECS[hud.vehicle].name}
            </div>
          </div>
          <div className="bg-slate-900 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Eguraldia</div>
            <div className="font-display font-bold text-base text-slate-50 truncate">
              {WEATHER_PRESETS[hud.weather].label}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm rounded-lg cursor-pointer"
          >
            Jarraitu Esploratzen [P / Esc]
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg cursor-pointer"
          >
            Berrabiarazi Mundakan
          </button>
          <button
            type="button"
            onClick={onTitle}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-medium text-sm rounded-lg cursor-pointer"
          >
            Hasierako Menura Itzuli
          </button>
        </div>
      </div>
    </div>
  );
};
