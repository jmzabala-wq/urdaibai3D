import React, { useState } from 'react';
import {
  type InputState,
  VEHICLE_ORDER,
  VEHICLE_SPECS,
} from '../physics/vehiclePhysics';
import { URDAIBAI_LANDMARKS, type VehicleId } from '../world/urdaibaiMap';
import { RADIO_STATIONS, type RadioStationId } from '../audio/radioEngine';
import { WEATHER_PRESETS, type WeatherCondition } from '../world/weatherSystem';
import type { CameraPreset, HudSnapshot } from '../three/UrdaibaiScene';
import { UrdaibaiMinimap } from './UrdaibaiMinimap';
import { MobileControls } from './MobileControls';

interface HudOverlayProps {
  hud: HudSnapshot;
  muted: boolean;
  touchEnabled: boolean;
  onToggleTouch: () => void;
  onTouchInput: (partial: Partial<InputState>) => void;
  onSelectVehicle: (id: VehicleId) => void;
  onEnterNearest: () => void;
  onToggleMute: () => void;
  onCycleCamera: () => void;
  onCycleRadio: () => void;
  onSelectRadioStation: (id: RadioStationId) => void;
  onCycleWeather: () => void;
  onOpenMap: () => void;
  onReset: () => void;
  onPause: () => void;
}

const CAMERA_LABEL: Record<CameraPreset, string> = {
  chase: 'Hurbil',
  wide: 'Zabal',
  aerial: 'Goitik',
};

const WeatherIcon: React.FC<{ weather: WeatherCondition }> = ({ weather }) => {
  if (weather === 'sunny') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-amber-400" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    );
  }
  if (weather === 'cloudy') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-slate-300" strokeWidth="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-sky-400" strokeWidth="2">
      <path d="M16 13v8" />
      <path d="M8 13v8" />
      <path d="M12 15v8" />
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
    </svg>
  );
};

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  muted,
  touchEnabled,
  onToggleTouch,
  onTouchInput,
  onSelectVehicle,
  onEnterNearest,
  onToggleMute,
  onCycleCamera,
  onCycleRadio,
  onSelectRadioStation,
  onCycleWeather,
  onOpenMap,
  onReset,
  onPause,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false);

  const activeSpec = VEHICLE_SPECS[hud.vehicle];
  const activeStation = RADIO_STATIONS.find((s) => s.id === hud.radioStation) ?? RADIO_STATIONS[0];
  const weatherSpec = WEATHER_PRESETS[hud.weather];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-5">
      {/* Top Row: Zone / Coordinates (Left), Radio & Weather (Center-Right), Utility Buttons (Right) */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="bg-[rgba(9,17,26,0.84)] border border-white/15 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg max-w-[180px] sm:max-w-xs">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display font-bold text-sm sm:text-lg text-slate-50 leading-tight truncate">
              {hud.zoneName}
            </h2>
            <span className="font-mono-num text-[11px] sm:text-xs font-semibold text-amber-400 shrink-0">
              {hud.discoveredIds.length}/{URDAIBAI_LANDMARKS.length}
            </span>
          </div>
          <p className="hidden sm:block text-xs text-slate-300 truncate mt-0.5">{hud.zoneSubtitle}</p>
          <p className="font-mono-num text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">
            {hud.lat.toFixed(4)}° N · {Math.abs(hud.lng).toFixed(4)}° W
          </p>
        </div>

        {/* Discovery Notification Banner */}
        {hud.justDiscoveredName && (
          <div className="hidden md:block bg-[rgba(6,78,59,0.92)] border border-emerald-400/40 rounded-lg px-4 py-2 text-center shadow-lg">
            <p className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
              Leku Berria Aurkituta
            </p>
            <p className="font-display font-bold text-base text-white">{hud.justDiscoveredName}</p>
          </div>
        )}

        {/* Top-Right Radio Tuner, Weather & Utility Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {/* Urdaibai Irratia Tuner Pill */}
            <div className="relative flex items-center bg-[rgba(9,17,26,0.88)] border border-white/15 rounded-lg overflow-hidden shadow-lg">
              <button
                type="button"
                tabIndex={-1}
                data-testid="radio-menu-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setRadioOpen((v) => !v);
                }}
                title="Urdaibai Irratia"
                className="h-9 sm:h-10 px-2.5 sm:px-3 flex items-center gap-2 hover:bg-slate-800/80 text-left cursor-pointer"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: activeStation.accentHex }}
                />
                <div className="leading-tight">
                  <div className="font-display font-bold text-[11px] sm:text-xs text-slate-100 whitespace-nowrap">
                    {activeStation.bandName}
                  </div>
                  <div className="hidden md:block text-[10px] text-slate-400 whitespace-nowrap">
                    {activeStation.town} · {activeStation.trackTitle}
                  </div>
                </div>
              </button>
              <button
                type="button"
                tabIndex={-1}
                data-testid="radio-next-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onCycleRadio();
                }}
                aria-label="Hurrengo Irrati Katea"
                title="Aldatu Irratia [N]"
                className="h-9 sm:h-10 px-2 border-l border-white/10 hover:bg-slate-800 text-[11px] font-mono-num text-amber-400 font-bold cursor-pointer"
              >
                [N]
              </button>

              {radioOpen && (
                <div className="absolute right-0 top-11 w-64 bg-slate-950 border border-white/20 rounded-lg p-1.5 shadow-2xl z-30">
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-b border-white/10 mb-1">
                    Urdaibai Irratia · Taldeak
                  </div>
                  {RADIO_STATIONS.map((st) => {
                    const selected = st.id === hud.radioStation;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onSelectRadioStation(st.id);
                          setRadioOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded text-left flex items-center justify-between gap-2 text-xs cursor-pointer ${
                          selected
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate">{st.bandName}</div>
                          <div className={`text-[10px] truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
                            {st.town} · {st.genre}
                          </div>
                        </div>
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: selected ? '#09111a' : st.accentHex }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weather Switch Button [G] */}
            <button
              type="button"
              tabIndex={-1}
              data-testid="weather-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleWeather();
              }}
              aria-label="Aldatu Eguraldia"
              title={`Eguraldia: ${weatherSpec.label} [G]`}
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg bg-[rgba(9,17,26,0.86)] hover:bg-slate-800 border border-white/15 text-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <WeatherIcon weather={hud.weather} />
              <span className="hidden sm:inline">{weatherSpec.label}</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenMap();
              }}
              aria-label="Ireki Mapa"
              title="Urdaibaiko Mapa [Tab]"
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg bg-[rgba(9,17,26,0.86)] hover:bg-slate-800 border border-white/15 text-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
              <span className="hidden lg:inline">Mapa</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleCamera();
              }}
              aria-label="Aldatu Kamera"
              title="Kamera [C]"
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg bg-[rgba(9,17,26,0.86)] hover:bg-slate-800 border border-white/15 text-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="hidden lg:inline">{CAMERA_LABEL[hud.cameraPreset]}</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              data-testid="touch-toggle-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouch();
              }}
              aria-label="Ukipen Kontrola"
              title="Ukipen Kontrolak (Mugikorra)"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-white/15 flex items-center justify-center cursor-pointer ${
                touchEnabled
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-[rgba(9,17,26,0.86)] hover:bg-slate-800 text-slate-100'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Aktibatu Soinua' : 'Isildu Soinua'}
              title="Soinua [M]"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[rgba(9,17,26,0.86)] hover:bg-slate-800 border border-white/15 text-slate-100 flex items-center justify-center cursor-pointer"
            >
              {muted ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-rose-400" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onReset();
              }}
              aria-label="Berrezarri Kokapena"
              title="Berrezarri [R]"
              className="hidden sm:flex w-10 h-10 rounded-lg bg-[rgba(9,17,26,0.86)] hover:bg-slate-800 border border-white/15 text-slate-100 items-center justify-center cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pausatu Jokoa"
              title="Pausa [P / Esc]"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[rgba(9,17,26,0.86)] hover:bg-slate-800 border border-white/15 text-slate-100 flex items-center justify-center cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Touch Controls Overlay when mobile/touch active */}
      {touchEnabled && (
        <MobileControls
          vehicle={hud.vehicle}
          hasNearbyVehicle={Boolean(hud.nearbyVehicle)}
          nearbyLabel={hud.nearbyVehicle?.label}
          onTouchInput={onTouchInput}
          onEnterOrExit={onEnterNearest}
        />
      )}

      {/* Bottom Row: Minimap (Left), Vehicle Dock (Center), Speedometer/Altimeter (Right) */}
      <div className="flex items-end justify-between gap-2 sm:gap-4">
        <div className="shrink-0">
          <UrdaibaiMinimap
            playerX={hud.x}
            playerZ={hud.z}
            yawDeg={hud.yawDeg}
            discoveredIds={hud.discoveredIds}
            onOpenFullMap={onOpenMap}
          />
        </div>

        {/* Center Collapsible Vehicle Dock & Proximity Enter Prompt */}
        <div className="flex flex-col items-center gap-1.5 min-w-0 max-w-[calc(100vw-230px)] sm:max-w-[min(860px,92vw)]">
          {!touchEnabled && hud.nearbyVehicle && hud.vehicle === 'onfoot' && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onEnterNearest();
              }}
              className="pointer-events-auto px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs md:text-sm rounded-md shadow-md cursor-pointer"
            >
              [F] Sartu · {hud.nearbyVehicle.label}
            </button>
          )}

          {hud.inThermal && (
            <div className="px-3 py-1 bg-amber-500/90 text-slate-950 font-display font-bold text-xs rounded">
              Haize Termikoa Gorantz · Parapentea
            </div>
          )}

          <div className="flex flex-col items-center pointer-events-auto w-full">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                setDockCollapsed((v) => !v);
              }}
              className="px-3 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-200 bg-[rgba(9,17,26,0.88)] border border-b-0 border-white/15 rounded-t-md hover:text-amber-300 cursor-pointer truncate max-w-full"
            >
              {dockCollapsed ? 'Ibilgailuak Erakutsi' : `${activeSpec.name} · ${activeSpec.controlsHint}`}
            </button>

            {!dockCollapsed && (
              <div className="flex items-center sm:justify-center gap-1 p-1 sm:p-1.5 bg-[rgba(9,17,26,0.9)] border border-white/15 rounded-lg shadow-xl max-w-full overflow-x-auto">
                {VEHICLE_ORDER.map((vid) => {
                  const spec = VEHICLE_SPECS[vid];
                  const active = hud.vehicle === vid;
                  return (
                    <button
                      key={vid}
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectVehicle(vid);
                      }}
                      className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="hidden sm:inline opacity-65 mr-1 font-mono-num">{spec.hotkey}</span>
                      {spec.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom-Right Speedometer & Altimeter */}
        <div className="bg-[rgba(9,17,26,0.86)] border border-white/15 rounded-lg px-2.5 py-2 sm:px-4 sm:py-3 shadow-lg min-w-[96px] sm:min-w-[144px] text-right shrink-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-semibold truncate">
            {activeSpec.name}
          </div>
          <div className="flex items-baseline justify-end gap-1 sm:gap-1.5 mt-0.5">
            <span className="font-display font-bold text-2xl sm:text-3xl text-slate-50 font-mono-num leading-none">
              {hud.speedKmh}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-amber-400">km/h</span>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 mt-1 pt-1 border-t border-white/10 text-[10px] sm:text-xs font-mono-num text-slate-300">
            <span>{hud.altitudeM} m</span>
            <span aria-hidden="true">·</span>
            <span>{hud.yawDeg}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
