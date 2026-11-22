import {
  WATER_LEVEL,
  WORLD_HALF_SIZE,
  type VehicleId,
} from '../world/urdaibaiMap';

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  category: 'Lurra' | 'Ura' | 'Airea';
  maxSpeedKmh: number;
  hotkey: string;
  controlsHint: string;
}

export const VEHICLE_SPECS: Record<VehicleId, VehicleSpec> = {
  onfoot: {
    id: 'onfoot',
    name: 'Oinez',
    category: 'Lurra',
    maxSpeedKmh: 28,
    hotkey: '0',
    controlsHint: 'WASD Mugitu · Shift Korrika · Space Salto · F Ibilgailua',
  },
  car: {
    id: 'car',
    name: 'Autoa',
    category: 'Lurra',
    maxSpeedKmh: 165,
    hotkey: '1',
    controlsHint: 'W/S Azeleratu/Balazta · A/D Biratu · Space Eskuko Balazta',
  },
  moto: {
    id: 'moto',
    name: 'Motoa',
    category: 'Lurra',
    maxSpeedKmh: 190,
    hotkey: '2',
    controlsHint: 'W/S Azeleratu · A/D Inklinatu · Space Turbo/Balazta',
  },
  bike: {
    id: 'bike',
    name: 'Bizikleta',
    category: 'Lurra',
    maxSpeedKmh: 48,
    hotkey: '3',
    controlsHint: 'W/S Pedaleatu · A/D Biratu · Space Jauzi Txikia',
  },
  scooter: {
    id: 'scooter',
    name: 'Patinetea',
    category: 'Lurra',
    maxSpeedKmh: 42,
    hotkey: '4',
    controlsHint: 'W/S Azeleratu · A/D Biratu · Space Salto',
  },
  kayak: {
    id: 'kayak',
    name: 'Piragua',
    category: 'Ura',
    maxSpeedKmh: 34,
    hotkey: '5',
    controlsHint: 'W/S Arraun Egin · A/D Lemaz Biratu · Uretan flotatzen du',
  },
  plane: {
    id: 'plane',
    name: 'Hegazkina',
    category: 'Airea',
    maxSpeedKmh: 260,
    hotkey: '6',
    controlsHint: 'W/S Potentzia · ↑/↓ Gorantz/Beherantz · A/D Biratu · Space Turbo',
  },
  heli: {
    id: 'heli',
    name: 'Helikopteroa',
    category: 'Airea',
    maxSpeedKmh: 210,
    hotkey: '7',
    controlsHint: 'Space Igo · Shift Jaitsi · W/S Aurrera/Atzera · A/D Biratu',
  },
  paraglider: {
    id: 'paraglider',
    name: 'Parapentea',
    category: 'Airea',
    maxSpeedKmh: 68,
    hotkey: '8',
    controlsHint: 'W/S Planeatu · A/D Biratu · Space Haize Termikoa (Ogoño/Atxarre)',
  },
};

export const VEHICLE_ORDER: readonly VehicleId[] = [
  'onfoot',
  'car',
  'moto',
  'bike',
  'scooter',
  'kayak',
  'plane',
  'heli',
  'paraglider',
];

export interface ParkedVehicle {
  id: string;
  vehicle: Exclude<VehicleId, 'onfoot'>;
  x: number;
  z: number;
  yaw: number;
  label: string;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  roll: number;
  steerAngle: number;
  wheelSpin: number;
  rotorAngle: number;
  stridePhase: number;
  grounded: boolean;
  inWater: boolean;
  coyoteTimer: number;
  vehicle: VehicleId;
  speedKmh: number;
  altitudeM: number;
  airborneTime: number;
  driftFactor: number;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jumpOrUp: boolean;
  downOrSprint: boolean;
  pitchUp: boolean;
  pitchDown: boolean;
}

export function createInitialPlayerState(x = -115, z = -195, groundY = 4.5): PlayerState {
  return {
    x,
    y: groundY,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: Math.PI * 0.25, // Facing NE out over the Oka estuary & Izaro Island
    pitch: 0,
    roll: 0,
    steerAngle: 0,
    wheelSpin: 0,
    rotorAngle: 0,
    stridePhase: 0,
    grounded: true,
    inWater: false,
    coyoteTimer: 0,
    vehicle: 'onfoot',
    speedKmh: 0,
    altitudeM: groundY,
    airborneTime: 0,
    driftFactor: 0,
  };
}

export function findNearestParkedVehicle(
  x: number,
  z: number,
  parked: readonly ParkedVehicle[],
  maxDist = 9,
): ParkedVehicle | null {
  let closest: ParkedVehicle | null = null;
  let bestDist = maxDist;
  for (const pv of parked) {
    const d = Math.hypot(pv.x - x, pv.z - z);
    if (d < bestDist) {
      bestDist = d;
      closest = pv;
    }
  }
  return closest;
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function clampWorldBounds(state: PlayerState): void {
  const limit = WORLD_HALF_SIZE - 25;
  if (state.x < -limit) {
    state.x = -limit;
    if (state.vx < 0) state.vx *= -0.3;
  } else if (state.x > limit) {
    state.x = limit;
    if (state.vx > 0) state.vx *= -0.3;
  }
  if (state.z < -limit) {
    state.z = -limit;
    if (state.vz < 0) state.vz *= -0.3;
  } else if (state.z > limit) {
    state.z = limit;
    if (state.vz > 0) state.vz *= -0.3;
  }
}

export function switchVehicleState(
  state: PlayerState,
  nextVehicle: VehicleId,
  groundY: number,
): PlayerState {
  const next = { ...state, vehicle: nextVehicle };
  next.pitch = 0;
  next.roll = 0;
  next.steerAngle = 0;
  next.driftFactor = 0;

  if (nextVehicle === 'plane') {
    // Give safe runway or gentle airborne launch if high/in water
    if (next.y < WATER_LEVEL + 2) {
      next.y = Math.max(groundY + 18, 22);
      const fx = Math.sin(next.yaw);
      const fz = Math.cos(next.yaw);
      next.vx = fx * 26;
      next.vz = fz * 26;
      next.vy = 1.5;
      next.grounded = false;
    }
  } else if (nextVehicle === 'heli') {
    if (next.y < WATER_LEVEL + 2) {
      next.y = Math.max(groundY + 6, 8);
      next.grounded = false;
    }
  } else if (nextVehicle === 'paraglider') {
    // Launch smoothly into glide if on ground or cliff
    next.y = Math.max(next.y, groundY + 14, 18);
    const fx = Math.sin(next.yaw);
    const fz = Math.cos(next.yaw);
    next.vx = fx * 13;
    next.vz = fz * 13;
    next.vy = -1.2;
    next.grounded = false;
  } else if (nextVehicle === 'kayak') {
    next.y = Math.max(WATER_LEVEL, groundY);
    next.vy = 0;
  } else {
    next.y = Math.max(next.y, groundY);
  }

  return next;
}

export function stepPlayerPhysics(
  state: PlayerState,
  input: InputState,
  rawDt: number,
  getGroundY: (x: number, z: number) => number,
  getThermal: (x: number, z: number, alt: number) => number = () => 0,
): PlayerState {
  const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
  const s = { ...state };

  const throttle = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0); // +1 left (CCW), -1 right (CW)

  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  const rx = Math.cos(s.yaw);
  const rz = -Math.sin(s.yaw);

  const groundY = getGroundY(s.x, s.z);
  const waterDeep = groundY < WATER_LEVEL - 0.35;

  if (s.vehicle === 'onfoot') {
    const inWater = waterDeep && s.y <= WATER_LEVEL + 0.3;
    s.inWater = inWater;
    const maxSpd = inWater ? 6.5 : input.downOrSprint ? 11.5 : 7.0;
    const accel = inWater ? 18 : s.grounded ? 38 : 14;

    if (steer !== 0) {
      s.yaw += steer * 2.8 * dt;
    }

    const nfx = Math.sin(s.yaw);
    const nfz = Math.cos(s.yaw);

    if (throttle !== 0) {
      s.vx += nfx * throttle * accel * dt;
      s.vz += nfz * throttle * accel * dt;
    } else {
      const drag = s.grounded || inWater ? 10 : 2.5;
      s.vx = damp(s.vx, 0, drag, dt);
      s.vz = damp(s.vz, 0, drag, dt);
    }

    const hSpeed = Math.hypot(s.vx, s.vz);
    if (hSpeed > maxSpd) {
      s.vx = (s.vx / hSpeed) * maxSpd;
      s.vz = (s.vz / hSpeed) * maxSpd;
    }

    if (s.grounded) s.coyoteTimer = 0.12;
    else s.coyoteTimer = Math.max(0, s.coyoteTimer - dt);

    if (input.jumpOrUp) {
      if (inWater) {
        s.vy = 4.5;
      } else if (s.coyoteTimer > 0) {
        s.vy = 9.2;
        s.grounded = false;
        s.coyoteTimer = 0;
      }
    }

    if (inWater) {
      const buoyancy = (WATER_LEVEL - 0.35 - s.y) * 18;
      s.vy += (buoyancy - s.vy * 4.5) * dt;
    } else {
      s.vy -= 22 * dt;
    }

    s.x += s.vx * dt;
    s.z += s.vz * dt;
    s.y += s.vy * dt;

    const newGround = getGroundY(s.x, s.z);
    if (s.y <= newGround) {
      s.y = newGround;
      s.vy = 0;
      s.grounded = true;
      s.airborneTime = 0;
    } else {
      s.grounded = false;
      s.airborneTime += dt;
    }

    s.stridePhase += Math.hypot(s.vx, s.vz) * dt * 1.6;
    s.pitch = damp(s.pitch, 0, 8, dt);
    s.roll = damp(s.roll, steer * 0.08, 8, dt);
  } else if (s.vehicle === 'car' || s.vehicle === 'moto' || s.vehicle === 'bike' || s.vehicle === 'scooter') {
    const isCar = s.vehicle === 'car';
    const isMoto = s.vehicle === 'moto';
    const isBike = s.vehicle === 'bike';

    const maxFwd = isCar ? 46 : isMoto ? 53 : isBike ? 14 : 12;
    const maxRev = isCar ? 14 : 6;
    const accelForce = isCar ? 26 : isMoto ? 34 : isBike ? 12 : 16;
    const brakeForce = isCar ? 36 : 28;
    const turnRateBase = isCar ? 2.1 : isMoto ? 2.5 : isBike ? 3.0 : 3.2;

    const fwdVel = s.vx * fx + s.vz * fz;
    const latVel = s.vx * rx + s.vz * rz;

    // Water bogging for wheeled vehicles
    const submerged = waterDeep && s.y < WATER_LEVEL - 0.1;
    s.inWater = submerged;
    const waterScale = submerged ? 0.38 : 1.0;

    let nextFwd = fwdVel;
    if (throttle > 0) {
      nextFwd += accelForce * waterScale * dt;
    } else if (throttle < 0) {
      if (fwdVel > 1.5) nextFwd -= brakeForce * dt;
      else nextFwd -= accelForce * 0.55 * waterScale * dt;
    } else {
      nextFwd = damp(nextFwd, 0, s.grounded ? 1.6 : 0.3, dt);
    }
    nextFwd = Math.max(-maxRev, Math.min(maxFwd * waterScale, nextFwd));

    // Steering scales smoothly with speed
    const speedFactor = Math.min(1, Math.abs(nextFwd) / 6);
    const dirSign = nextFwd >= -0.2 ? 1 : -1;
    const handbrake = isCar && input.jumpOrUp;
    const steerEffectiveness = s.grounded ? speedFactor : 0.35;
    s.yaw += steer * turnRateBase * steerEffectiveness * dirSign * dt;

    // Lateral tire grip (lower grip during handbrake drift!)
    const lateralGrip = !s.grounded ? 0.4 : handbrake ? 2.2 : isCar ? 8.5 : 12.0;
    const nextLat = damp(latVel, 0, lateralGrip, dt);
    s.driftFactor = Math.min(1, Math.abs(nextLat) / 9);

    const nfx = Math.sin(s.yaw);
    const nfz = Math.cos(s.yaw);
    const nrx = Math.cos(s.yaw);
    const nrz = -Math.sin(s.yaw);

    s.vx = nfx * nextFwd + nrx * nextLat;
    s.vz = nfz * nextFwd + nrz * nextLat;

    // Bike/Scooter hop
    if ((isBike || s.vehicle === 'scooter') && input.jumpOrUp && s.grounded) {
      s.vy = 6.8;
      s.grounded = false;
    }

    s.vy -= 22 * dt;
    s.x += s.vx * dt;
    s.z += s.vz * dt;
    s.y += s.vy * dt;

    const newGround = getGroundY(s.x, s.z);
    // Keep wheeled vehicles above deep seafloor slightly or grounded
    if (s.y <= newGround) {
      s.y = newGround;
      s.vy = 0;
      s.grounded = true;
      s.airborneTime = 0;
    } else {
      s.grounded = false;
      s.airborneTime += dt;
    }

    // Terrain slope pitch alignment + suspension feel
    const aheadY = getGroundY(s.x + nfx * 2.0, s.z + nfz * 2.0);
    const behindY = getGroundY(s.x - nfx * 2.0, s.z - nfz * 2.0);
    const slopePitch = s.grounded ? -Math.atan2(aheadY - behindY, 4.0) : -s.vy * 0.025;
    const accelPitch = -throttle * (isMoto ? 0.09 : 0.035);
    s.pitch = damp(s.pitch, slopePitch + accelPitch, 10, dt);

    const targetRoll = isMoto || isBike
      ? -steer * Math.min(0.45, Math.abs(nextFwd) * 0.025)
      : steer * Math.min(0.12, Math.abs(nextFwd) * 0.004);
    s.roll = damp(s.roll, targetRoll, 9, dt);
    s.steerAngle = damp(s.steerAngle, steer * 0.5, 14, dt);
    s.wheelSpin += nextFwd * dt * 2.2;
  } else if (s.vehicle === 'kayak') {
    const onWater = groundY <= WATER_LEVEL + 0.15;
    s.inWater = onWater;

    const fwdVel = s.vx * fx + s.vz * fz;
    const latVel = s.vx * rx + s.vz * rz;

    const paddleThrust = onWater ? 15 : 2.5;
    let nextFwd = fwdVel;
    if (throttle !== 0) {
      nextFwd += throttle * paddleThrust * dt;
    } else {
      nextFwd = damp(nextFwd, 0, onWater ? 1.4 : 6.0, dt);
    }
    nextFwd = Math.max(-4.5, Math.min(onWater ? 10.5 : 2.5, nextFwd));

    s.yaw += steer * (onWater ? 2.1 : 0.9) * dt;
    const nextLat = damp(latVel, 0, onWater ? 5.5 : 10, dt);

    const nfx = Math.sin(s.yaw);
    const nfz = Math.cos(s.yaw);
    const nrx = Math.cos(s.yaw);
    const nrz = -Math.sin(s.yaw);

    s.vx = nfx * nextFwd + nrx * nextLat;
    s.vz = nfz * nextFwd + nrz * nextLat;

    s.x += s.vx * dt;
    s.z += s.vz * dt;

    const newGround = getGroundY(s.x, s.z);
    if (newGround <= WATER_LEVEL) {
      const targetY = WATER_LEVEL + 0.05;
      s.y = damp(s.y, targetY, 10, dt);
      s.vy = 0;
      s.grounded = true;
    } else {
      s.y = newGround;
      s.vy = 0;
      s.grounded = true;
    }

    s.stridePhase += (Math.abs(nextFwd) + Math.abs(steer) * 2) * dt * 2.4;
    s.pitch = damp(s.pitch, -throttle * 0.06, 6, dt);
    s.roll = damp(s.roll, steer * 0.14 + Math.sin(s.stridePhase) * 0.05, 7, dt);
  } else if (s.vehicle === 'plane') {
    s.inWater = false;
    const fwdVel = s.vx * fx + s.vz * fz;
    const boost = input.jumpOrUp ? 1.45 : 1.0;

    // Throttle control (W/S accelerates airspeed, ArrowUp/Down or space climbs)
    let airspeed = Math.hypot(s.vx, s.vy, s.vz);
    if (throttle > 0) airspeed += 32 * boost * dt;
    else if (throttle < 0) airspeed -= 20 * dt;
    else if (!s.grounded) airspeed = damp(airspeed, 38, 0.35, dt);
    else airspeed = damp(airspeed, 0, 1.2, dt);

    airspeed = Math.max(0, Math.min(78, airspeed));

    // Pitch input: pitchUp / pitchDown, or Space climb
    const pitchCmd =
      (input.pitchUp ? 1 : 0) -
      (input.pitchDown ? 1 : 0) +
      (input.jumpOrUp && airspeed > 15 ? 0.85 : 0);

    if (s.grounded) {
      s.pitch = damp(s.pitch, pitchCmd > 0 && airspeed > 15 ? 0.38 : 0, 6, dt);
    } else {
      s.pitch = Math.max(-0.68, Math.min(0.68, damp(s.pitch, pitchCmd * 0.58, 5, dt)));
    }

    // Bank & turn
    s.roll = damp(s.roll, -steer * 0.65, 6, dt);
    s.yaw += steer * (s.grounded ? 1.15 : 1.35) * dt;

    const nfx = Math.sin(s.yaw);
    const nfz = Math.cos(s.yaw);
    const cosP = Math.cos(s.pitch);
    const sinP = Math.sin(s.pitch);

    // Aerodynamic lift vs stall gravity sink
    const stallSink = airspeed < 18 ? (1 - airspeed / 18) * 14 : 0;
    s.vx = nfx * airspeed * cosP;
    s.vz = nfz * airspeed * cosP;
    if (s.grounded && s.pitch <= 0.02) {
      s.vy = 0;
    } else {
      s.vy = airspeed * sinP - stallSink;
    }

    s.x += s.vx * dt;
    s.z += s.vz * dt;
    s.y += s.vy * dt;

    const newGround = Math.max(WATER_LEVEL + 0.2, getGroundY(s.x, s.z));
    if (s.y <= newGround) {
      s.y = newGround;
      if (s.vy < 0) s.vy = 0;
      s.grounded = true;
      s.airborneTime = 0;
    } else {
      s.grounded = false;
      s.airborneTime += dt;
    }
    s.rotorAngle += (8 + airspeed * 1.4) * dt;
  } else if (s.vehicle === 'heli') {
    s.inWater = false;
    const collective = (input.jumpOrUp ? 1 : 0) - (input.downOrSprint ? 1 : 0);
    const targetVy = collective * 18;
    s.vy = damp(s.vy, s.grounded && collective <= 0 ? 0 : targetVy, 5, dt);

    // Cyclic forward/back tilt drives horizontal thrust
    const targetPitch = throttle * 0.34;
    s.pitch = damp(s.pitch, s.grounded && collective <= 0 ? 0 : targetPitch, 6, dt);

    s.yaw += steer * 1.9 * dt;
    s.roll = damp(s.roll, -steer * 0.28, 6, dt);

    const nfx = Math.sin(s.yaw);
    const nfz = Math.cos(s.yaw);
    const targetFwd = throttle * 48;
    const curFwd = s.vx * nfx + s.vz * nfz;
    const nextFwd = damp(curFwd, targetFwd, 2.8, dt);

    s.vx = nfx * nextFwd;
    s.vz = nfz * nextFwd;

    s.x += s.vx * dt;
    s.z += s.vz * dt;
    s.y += s.vy * dt;

    const newGround = Math.max(WATER_LEVEL + 0.15, getGroundY(s.x, s.z));
    if (s.y <= newGround) {
      s.y = newGround;
      if (s.vy < 0) s.vy = 0;
      s.grounded = true;
      s.airborneTime = 0;
    } else {
      s.grounded = false;
      s.airborneTime += dt;
    }
    s.rotorAngle += 28 * dt;
  } else if (s.vehicle === 'paraglider') {
    s.inWater = false;
    s.yaw += steer * 1.55 * dt;
    s.roll = damp(s.roll, -steer * 0.42, 5, dt);

    const nfx = Math.sin(s.yaw);
    const nfz = Math.cos(s.yaw);

    // Speed bar (W = faster glide + slightly more sink, S = flare / slow)
    const targetAirspeed = throttle > 0 ? 18.5 : throttle < 0 ? 9.5 : 13.5;
    const curSpeed = Math.hypot(s.vx, s.vz);
    const nextSpeed = damp(curSpeed, s.grounded ? 0 : targetAirspeed, 3.5, dt);

    s.vx = nfx * nextSpeed;
    s.vz = nfz * nextSpeed;

    const thermal = getThermal(s.x, s.z, s.y);
    const manualBoost = input.jumpOrUp ? 3.5 : 0; // Ridge/thermal boost assist
    const baseSink = throttle > 0 ? -2.8 : throttle < 0 ? -1.4 : -1.9;
    const targetVy = s.grounded ? 0 : baseSink + thermal + manualBoost;
    s.vy = damp(s.vy, targetVy, 3.5, dt);

    s.pitch = damp(s.pitch, throttle * 0.18, 5, dt);

    s.x += s.vx * dt;
    s.z += s.vz * dt;
    s.y += s.vy * dt;

    const newGround = Math.max(WATER_LEVEL + 0.15, getGroundY(s.x, s.z));
    if (s.y <= newGround) {
      s.y = newGround;
      s.vy = 0;
      s.grounded = true;
      s.airborneTime = 0;
    } else {
      s.grounded = false;
      s.airborneTime += dt;
    }
  }

  // Ceiling limit
  if (s.y > 420) {
    s.y = 420;
    if (s.vy > 0) s.vy = 0;
  }

  clampWorldBounds(s);
  s.speedKmh = Math.round(Math.hypot(s.vx, s.vz, s.vy * 0.3) * 3.6);
  s.altitudeM = Math.max(0, Math.round(s.y));

  return s;
}
