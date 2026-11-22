import React, { useRef, useState } from 'react';
import type { InputState } from '../physics/vehiclePhysics';
import type { VehicleId } from '../world/urdaibaiMap';

interface MobileControlsProps {
  vehicle: VehicleId;
  hasNearbyVehicle: boolean;
  nearbyLabel?: string;
  onTouchInput: (partial: Partial<InputState>) => void;
  onEnterOrExit: () => void;
}

const STICK_RADIUS = 44;

export const MobileControls: React.FC<MobileControlsProps> = ({
  vehicle,
  hasNearbyVehicle,
  nearbyLabel,
  onTouchInput,
  onEnterOrExit,
}) => {
  const stickRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const updateStickFromPoint = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > STICK_RADIUS) {
      dx = (dx / dist) * STICK_RADIUS;
      dy = (dy / dist) * STICK_RADIUS;
    }
    setKnob({ x: dx, y: dy });

    const nx = dx / STICK_RADIUS;
    const ny = dy / STICK_RADIUS;
    onTouchInput({
      left: nx < -0.25,
      right: nx > 0.25,
      forward: ny < -0.22,
      backward: ny > 0.25,
      pitchUp: ny < -0.25,
      pitchDown: ny > 0.25,
    });
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnob({ x: 0, y: 0 });
    onTouchInput({
      left: false,
      right: false,
      forward: false,
      backward: false,
      pitchUp: false,
      pitchDown: false,
    });
  };

  const isAir = vehicle === 'plane' || vehicle === 'heli' || vehicle === 'paraglider';

  return (
    <div
      data-testid="mobile-controls"
      className="fixed inset-x-0 bottom-32 sm:bottom-44 z-20 pointer-events-none flex items-end justify-between px-3 sm:px-6 select-none touch-none"
    >
      {/* Left Virtual Analog Stick */}
      <div
        ref={stickRef}
        role="application"
        aria-label="Norabide ukipen kontrola"
        onPointerDown={(e) => {
          e.preventDefault();
          activePointerId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateStickFromPoint(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activePointerId.current !== e.pointerId) return;
          updateStickFromPoint(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (activePointerId.current === e.pointerId) resetStick();
        }}
        onPointerCancel={(e) => {
          if (activePointerId.current === e.pointerId) resetStick();
        }}
        className="pointer-events-auto relative w-28 h-28 rounded-full bg-[rgba(9,17,26,0.72)] border-2 border-white/25 flex items-center justify-center touch-none shadow-lg"
      >
        <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
        <div
          className="w-11 h-11 rounded-full bg-amber-400/90 border-2 border-white shadow-md pointer-events-none"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      {/* Right Touch Action Buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-2 touch-none">
        {(hasNearbyVehicle || vehicle !== 'onfoot') && (
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.preventDefault();
              onEnterOrExit();
            }}
            className="px-3.5 py-2 rounded-lg bg-amber-500 active:bg-amber-400 text-slate-950 font-display font-bold text-xs shadow-md touch-none cursor-pointer"
          >
            {vehicle === 'onfoot' ? `Sartu · ${nearbyLabel ?? 'Ibilgailua'}` : 'Oinez Irten'}
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              onTouchInput({ downOrSprint: true });
            }}
            onPointerUp={() => onTouchInput({ downOrSprint: false })}
            onPointerCancel={() => onTouchInput({ downOrSprint: false })}
            className="w-16 h-16 rounded-full bg-[rgba(9,17,26,0.82)] active:bg-slate-700 border-2 border-white/25 text-slate-100 font-display font-bold text-xs flex flex-col items-center justify-center touch-none cursor-pointer shadow-lg"
          >
            <span>{isAir ? 'Behera' : 'Azkar'}</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              onTouchInput({ jumpOrUp: true });
            }}
            onPointerUp={() => onTouchInput({ jumpOrUp: false })}
            onPointerCancel={() => onTouchInput({ jumpOrUp: false })}
            className="w-16 h-16 rounded-full bg-[rgba(245,158,11,0.9)] active:bg-amber-400 border-2 border-white/50 text-slate-950 font-display font-bold text-xs flex flex-col items-center justify-center touch-none cursor-pointer shadow-lg"
          >
            <span>{isAir ? 'Gora' : 'Salto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
