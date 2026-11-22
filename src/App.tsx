import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type GameMode,
  type HudSnapshot,
  UrdaibaiSceneController,
} from './three/UrdaibaiScene';
import type { VehicleId } from './world/urdaibaiMap';
import { TitleOverlay } from './components/TitleOverlay';
import { HudOverlay } from './components/HudOverlay';
import { UrdaibaiMapModal } from './components/UrdaibaiMapModal';
import { PauseModal } from './components/PauseModal';

const INITIAL_HUD: HudSnapshot = {
  speedKmh: 0,
  altitudeM: 4,
  yawDeg: 45,
  x: -115,
  z: -195,
  lat: 43.4078,
  lng: -2.6993,
  zoneName: 'Mundaka',
  zoneSubtitle: 'Portua eta Santa Katalina · Ezker Olatua',
  vehicle: 'onfoot',
  nearbyVehicle: null,
  discoveredIds: ['mundaka'],
  justDiscoveredName: null,
  cameraPreset: 'chase',
  inThermal: false,
  radioStation: 'sarkor',
  weather: 'sunny',
};

function detectTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 768
  );
}

export default function App() {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [mode, setMode] = useState<GameMode>(autostart ? 'playing' : 'title');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [mapOpen, setMapOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [touchEnabled, setTouchEnabled] = useState<boolean>(detectTouchCapable);
  const [webglError, setWebglError] = useState(false);

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<UrdaibaiSceneController | null>(null);
  const modeRef = useRef<GameMode>(mode);
  modeRef.current = mode;

  const updateGameMode = useCallback((next: GameMode) => {
    modeRef.current = next;
    document.body.dataset.state = next;
    setMode(next);
    controllerRef.current?.setMode(next);
    if (next === 'playing' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  useEffect(() => {
    document.body.dataset.state = modeRef.current;
    const mount = canvasMountRef.current;
    if (!mount) return;

    let ctrl: UrdaibaiSceneController;
    try {
      ctrl = new UrdaibaiSceneController(
        mount,
        modeRef.current,
        (snapshot) => setHud(snapshot),
        (nextMode) => updateGameMode(nextMode),
      );
      controllerRef.current = ctrl;
    } catch {
      setWebglError(true);
      return;
    }

    const canvas = mount.querySelector('canvas');
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const onContextRestored = () => {
      setWebglError(false);
    };
    canvas?.addEventListener('webglcontextlost', onContextLost);
    canvas?.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      canvas?.removeEventListener('webglcontextlost', onContextLost);
      canvas?.removeEventListener('webglcontextrestored', onContextRestored);
      ctrl.dispose();
      controllerRef.current = null;
    };
  }, [updateGameMode]);

  useEffect(() => {
    const onResize = () => {
      if (detectTouchCapable()) {
        setTouchEnabled(true);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setMapOpen((open) => !open);
      } else if (e.code === 'KeyM') {
        if (controllerRef.current) {
          setMuted(controllerRef.current.toggleMute());
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleStart = () => {
    updateGameMode('playing');
  };

  const handleSelectVehicle = (id: VehicleId) => {
    controllerRef.current?.switchVehicle(id);
  };

  const handleTeleport = (landmarkId: string, vehicle?: VehicleId) => {
    controllerRef.current?.teleportToLandmark(landmarkId, vehicle);
    if (mode !== 'playing') {
      updateGameMode('playing');
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Isolated WebGL Viewport Container */}
      <div
        ref={canvasMountRef}
        data-testid="urdaibai-viewport"
        className="fixed inset-0 w-full h-full touch-none"
      />

      {webglError && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-slate-900 border border-white/15 rounded-xl p-6">
            <h2 className="font-display font-bold text-xl text-white">WebGL ez dago erabilgarri</h2>
            <p className="text-sm text-slate-300 mt-2">
              Zure nabigatzaileak ezin izan du 3D WebGL eszena abiarazi. Mesedez, gaitu hardware azelerazioa eta kargatu berriro.
            </p>
          </div>
        </div>
      )}

      {mode === 'title' && (
        <TitleOverlay
          onStart={handleStart}
          onOpenMap={() => setMapOpen(true)}
        />
      )}

      {mode === 'playing' && (
        <HudOverlay
          hud={hud}
          muted={muted}
          touchEnabled={touchEnabled}
          onToggleTouch={() => setTouchEnabled((v) => !v)}
          onTouchInput={(partial) => controllerRef.current?.setTouchInput(partial)}
          onSelectVehicle={handleSelectVehicle}
          onEnterNearest={() => controllerRef.current?.interactNearestVehicle()}
          onToggleMute={() => {
            if (controllerRef.current) {
              setMuted(controllerRef.current.toggleMute());
            }
          }}
          onCycleCamera={() => controllerRef.current?.cycleCameraPreset()}
          onCycleRadio={() => controllerRef.current?.cycleRadioStation()}
          onSelectRadioStation={(id) => controllerRef.current?.setRadioStation(id)}
          onCycleWeather={() => controllerRef.current?.cycleWeather()}
          onOpenMap={() => setMapOpen(true)}
          onReset={() => controllerRef.current?.resetPlayer()}
          onPause={() => updateGameMode('paused')}
        />
      )}

      {mode === 'paused' && (
        <PauseModal
          hud={hud}
          onResume={() => updateGameMode('playing')}
          onRestart={() => {
            controllerRef.current?.resetPlayer();
            updateGameMode('playing');
          }}
          onTitle={() => updateGameMode('title')}
        />
      )}

      {mapOpen && (
        <UrdaibaiMapModal
          playerX={hud.x}
          playerZ={hud.z}
          discoveredIds={hud.discoveredIds}
          onClose={() => setMapOpen(false)}
          onTeleport={handleTeleport}
        />
      )}
    </main>
  );
}
