import React from 'react';

interface TitleOverlayProps {
  onStart: () => void;
  onOpenMap: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({ onStart, onOpenMap }) => {
  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-8 md:p-14 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, rgba(7, 14, 24, 0.84) 0%, rgba(7, 14, 24, 0.48) 44%, rgba(7, 14, 24, 0.08) 100%)',
      }}
    >
      <div className="max-w-lg my-auto pointer-events-auto">
        <div className="mb-5 flex items-center gap-3.5">
          <svg
            viewBox="0 0 56 56"
            className="w-12 h-12 shrink-0"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="52" height="52" rx="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
            <path d="M8 36 Q18 22 28 28 T48 24 L48 46 L8 46 Z" fill="#0d6b82" />
            <path d="M10 38 Q22 30 32 36 T48 34" fill="none" stroke="#fef3c7" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M26 24 L36 12 L46 24 Z" fill="#2e7d32" />
            <circle cx="19" cy="17" r="4.5" fill="#f59e0b" />
          </svg>
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-amber-400 uppercase">
              Biosfera Erreserba · Mundu Irekia
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-slate-50 leading-none mt-1">
              URDAIBAI 3D
            </h1>
          </div>
        </div>

        <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-md mb-8">
          Esploratu Mundaka, Laida, Laga, Ogoño, Izaro, Gaztelugatxe, Bermeo eta Gernika-Lumo 3Dn.
          Gidatu edo hegan egin edozein ibilgailurekin: autoa, motoa, bizikleta, patinetea, piragua, hegazkina, helikopteroa eta parapentea.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-display font-bold text-base tracking-wide rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Hasi Esplorazioa
          </button>

          <button
            type="button"
            onClick={onOpenMap}
            className="px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/20 font-medium text-sm rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
          >
            Ikusi Mapa Topografikoa
          </button>
        </div>
      </div>

      <div className="text-xs md:text-sm text-slate-300/90 hud-text-shadow font-medium tracking-wide">
        WASD / Ukipena · Space Salto/Hegan · F Ibilgailura · 1–8 Aldatu · N Irratia · G Eguraldia · Tab Mapa
      </div>
    </div>
  );
};
