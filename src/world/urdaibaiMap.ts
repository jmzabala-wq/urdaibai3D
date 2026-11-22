export type SurfaceType = 'water' | 'sand' | 'road' | 'grass' | 'rock';

export type VehicleId =
  | 'onfoot'
  | 'car'
  | 'moto'
  | 'bike'
  | 'scooter'
  | 'kayak'
  | 'plane'
  | 'heli'
  | 'paraglider';

export interface Landmark {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  z: number;
  lat: number;
  lng: number;
  suggestedVehicle: VehicleId;
  category: 'coast' | 'town' | 'peak' | 'island';
}

export interface RoadSegment {
  id: string;
  name: string;
  points: ReadonlyArray<readonly [number, number]>;
  width: number;
  isBridge?: boolean;
  bridgeHeight?: number;
}

export const WORLD_HALF_SIZE = 900;
export const WATER_LEVEL = 0;

// Origin centered near Mundaka / Laida mouth: 43.400° N, -2.685° W
const ORIGIN_LAT = 43.400;
const ORIGIN_LNG = -2.685;
// Simplified Urdaibai compression scale (~12m per game unit -> realistic feel within 1800x1800m)
const METERS_PER_LAT_DEG = 111111;
const METERS_PER_LNG_DEG = 80800; // cos(43.4°) * 111111
const MAP_SCALE = 11.5;

export function worldToLatLng(x: number, z: number): { lat: number; lng: number } {
  const lat = ORIGIN_LAT - (z * MAP_SCALE) / METERS_PER_LAT_DEG;
  const lng = ORIGIN_LNG + (x * MAP_SCALE) / METERS_PER_LNG_DEG;
  return { lat, lng };
}

import { EUSKOTREN_RAIL_POINTS } from './osmUrdaibaiData';

export const URDAIBAI_LANDMARKS: readonly Landmark[] = [
  {
    id: 'mundaka',
    name: 'Mundaka',
    subtitle: 'Portua eta Santa Katalina · Ezker Olatua',
    x: -115,
    z: -195,
    lat: 43.4078,
    lng: -2.6993,
    suggestedVehicle: 'car',
    category: 'town',
  },
  {
    id: 'laida',
    name: 'Laida Hondartza',
    subtitle: 'Hareatza eta itsasadarraren ahoa',
    x: 55,
    z: -175,
    lat: 43.4025,
    lng: -2.6778,
    suggestedVehicle: 'kayak',
    category: 'coast',
  },
  {
    id: 'izaro',
    name: 'Izaro Uhartea',
    subtitle: 'Biosferako uharte enblematikoa',
    x: -15,
    z: -465,
    lat: 43.424,
    lng: -2.6852,
    suggestedVehicle: 'kayak',
    category: 'island',
  },
  {
    id: 'ogono',
    name: 'Ogoño Lurmuturra',
    subtitle: 'Kareharrizko itsaslabarra · Parapente gunea',
    x: 470,
    z: -310,
    lat: 43.4125,
    lng: -2.6345,
    suggestedVehicle: 'paraglider',
    category: 'peak',
  },
  {
    id: 'laga',
    name: 'Laga Hondartza',
    subtitle: 'Itsasertzeko hondartza Ogoñoren azpian',
    x: 345,
    z: -215,
    lat: 43.406,
    lng: -2.647,
    suggestedVehicle: 'scooter',
    category: 'coast',
  },
  {
    id: 'elantxobe',
    name: 'Elantxobe',
    subtitle: 'Amildegiko portua eta Tala · Ogoño ekialdean',
    x: 562,
    z: -242,
    lat: 43.4031,
    lng: -2.6405,
    suggestedVehicle: 'moto',
    category: 'town',
  },
  {
    id: 'atxarre',
    name: 'San Pedro Atxarre',
    subtitle: 'Artadi kantauriarra eta begiratokia',
    x: 205,
    z: 35,
    lat: 43.3905,
    lng: -2.6625,
    suggestedVehicle: 'paraglider',
    category: 'peak',
  },
  {
    id: 'bermeo',
    name: 'Bermeo',
    subtitle: 'Arrantzale portua, Lamera eta Tala',
    x: -365,
    z: -320,
    lat: 43.4194,
    lng: -2.7232,
    suggestedVehicle: 'heli',
    category: 'town',
  },
  {
    id: 'gaztelugatxe',
    name: 'San Juan Gaztelugatxe',
    subtitle: 'Harrizko zubia eta ermita itsasoan',
    x: -575,
    z: -475,
    lat: 43.447,
    lng: -2.785,
    suggestedVehicle: 'moto',
    category: 'island',
  },
  {
    id: 'sukarrieta',
    name: 'Sukarrieta · Txatxarramendi',
    subtitle: 'Txatxarramendi irla eta itsasadarreko bidea',
    x: -80,
    z: 30,
    lat: 43.3942,
    lng: -2.6971,
    suggestedVehicle: 'bike',
    category: 'town',
  },
  {
    id: 'busturia',
    name: 'Busturia · Madariaga',
    subtitle: 'Madariaga Dorretxea eta padura bidea',
    x: -95,
    z: 165,
    lat: 43.3823,
    lng: -2.6983,
    suggestedVehicle: 'bike',
    category: 'town',
  },
  {
    id: 'arteaga',
    name: 'Gautegiz Arteaga',
    subtitle: 'Arteagako Gaztelua eta Bird Center',
    x: 156,
    z: 258,
    lat: 43.352,
    lng: -2.6545,
    suggestedVehicle: 'car',
    category: 'town',
  },
  {
    id: 'santimamine',
    name: 'Kortezubi · Santimamiñe',
    subtitle: 'Kobazuloa, Omako basoa eta Basondo',
    x: 235,
    z: 358,
    lat: 43.3466,
    lng: -2.6366,
    suggestedVehicle: 'moto',
    category: 'peak',
  },
  {
    id: 'gernika',
    name: 'Gernika-Lumo',
    subtitle: 'Batzarretxea, Arbola eta Oka ibaia',
    x: 20,
    z: 500,
    lat: 43.3144,
    lng: -2.6779,
    suggestedVehicle: 'plane',
    category: 'town',
  },
];

// Simplified Urdaibai road network (BI-2235 west, BI-3234 east, estuary crossings)
export const ROAD_SEGMENTS: readonly RoadSegment[] = [
  {
    id: 'west-bi2235',
    name: 'BI-2235 Kostako Errepidea',
    width: 11,
    points: [
      [20, 560],
      [15, 500],
      [-25, 400],
      [-60, 260],
      [-85, 130],
      [-95, 30],
      [-110, -85],
      [-125, -195],
      [-205, -245],
      [-295, -285],
      [-365, -310],
      [-455, -340],
      [-545, -375],
      [-585, -405],
    ],
  },
  {
    id: 'east-bi3234',
    name: 'BI-3234 Ekialdeko Errepidea',
    width: 10,
    points: [
      [20, 500],
      [95, 420],
      [120, 295],
      [105, 155],
      [88, 25],
      [78, -80],
      [75, -165],
      [165, -185],
      [265, -195],
      [345, -205],
      [410, -235],
    ],
  },
  {
    id: 'ogono-track',
    name: 'Ogoñoko Bidea',
    width: 7,
    points: [
      [410, -235],
      [455, -265],
      [475, -295],
    ],
  },
  {
    id: 'elantxobe-bi3237',
    name: 'BI-3237 Elantxobeko Errepidea',
    width: 8.5,
    points: [
      [410, -235],
      [485, -215],
      [548, -230],
      [568, -246],
    ],
  },
  {
    id: 'arteaga-kortezubi-bi2238',
    name: 'BI-2238 Arteaga · Kortezubi',
    width: 8.5,
    points: [
      [120, 295],
      [156, 258],
      [210, 305],
      [235, 358],
      [145, 420],
      [95, 420],
    ],
  },
  {
    id: 'gernika-bridge',
    name: 'Gernikako Zubia',
    width: 11,
    isBridge: true,
    bridgeHeight: 6.2,
    points: [
      [-15, 500],
      [20, 500],
      [58, 500],
    ],
  },
  {
    id: 'estuary-bridge',
    name: 'Itsasadarreko Pasabidea',
    width: 9.5,
    isBridge: true,
    bridgeHeight: 6.5,
    points: [
      [-95, 30],
      [-30, 28],
      [35, 26],
      [88, 25],
    ],
  },
];

/** Centerline X coordinate of the winding Oka river/estuary at a given Z */
export function okaChannelCenterX(z: number): number {
  return Math.sin(z * 0.0085) * 34 + Math.cos(z * 0.0032) * 14 - 8;
}

/** Width of the Oka estuary channel at a given Z */
export function okaChannelHalfWidth(z: number): number {
  if (z < -260) return 140; // Open bay
  if (z > 420) return 18; // Narrow river in Gernika
  const t = Math.max(0, Math.min(1, (260 - z) / 680));
  return 20 + t * 44;
}

/** Deterministic pseudo-noise using layered trigonometry (fast, smooth, C-infinity) */
function fbm(x: number, z: number): number {
  const n1 = Math.sin(x * 0.0075 + 0.4) * Math.cos(z * 0.008 + 1.1);
  const n2 = Math.sin(x * 0.019 - z * 0.014) * 0.45;
  const n3 = Math.cos(x * 0.041 + z * 0.037) * 0.18;
  return n1 + n2 + n3;
}

function gaussianPeak(x: number, z: number, cx: number, cz: number, height: number, rx: number, rz: number): number {
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  const d2 = dx * dx + dz * dz;
  if (d2 > 14) return 0;
  return height * Math.exp(-d2);
}

function distToSegmentSq(px: number, pz: number, ax: number, az: number, bx: number, bz: number): { d2: number; t: number } {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const len2 = vx * vx + vz * vz;
  if (len2 < 1e-6) return { d2: wx * wx + wz * wz, t: 0 };
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / len2));
  const cx = ax + t * vx;
  const cz = az + t * vz;
  const dx = px - cx;
  const dz = pz - cz;
  return { d2: dx * dx + dz * dz, t };
}

export function getRoadDistanceInfo(x: number, z: number): {
  distance: number;
  width: number;
  isBridge: boolean;
  bridgeHeight: number;
} {
  let bestDist2 = Infinity;
  let bestWidth = 10;
  let bestBridge = false;
  let bestBridgeHeight = 6;

  for (let s = 0; s < ROAD_SEGMENTS.length; s++) {
    const seg = ROAD_SEGMENTS[s];
    const pts = seg.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const { d2 } = distToSegmentSq(x, z, a[0], a[1], b[0], b[1]);
      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestWidth = seg.width;
        bestBridge = Boolean(seg.isBridge);
        bestBridgeHeight = seg.bridgeHeight ?? 6;
      }
    }
  }

  return {
    distance: Math.sqrt(bestDist2),
    width: bestWidth,
    isBridge: bestBridge,
    bridgeHeight: bestBridgeHeight,
  };
}

/**
 * Coastline Z boundary: north of this Z is Cantabrian Sea (unless an island/headland overrides).
 */
export function coastlineZAt(x: number): number {
  // West coast slopes northwest toward Bermeo/Matxitxako; East coast dips at Laga then rises at Ogoño
  if (x < -120) {
    // Mundaka -> Bermeo -> Matxitxako headland
    const westCurve = -245 - Math.sin((x + 120) * 0.005) * 85 + (x + 120) * 0.25;
    return Math.max(-410, westCurve);
  }
  if (x > 120) {
    // Laida -> Laga -> Ogoño
    return -225 + Math.sin((x - 120) * 0.011) * 35;
  }
  // Estuary mouth bay
  return -240;
}

/**
 * Raw natural terrain height (before road/bridge surface deck adjustments).
 */
export function getRawTerrainHeight(x: number, z: number): number {
  const coastZ = coastlineZAt(x);
  const inlandDist = z - coastZ; // positive = south/inland, negative = north/sea

  // Base sea floor vs land slope
  let h = 0;
  if (inlandDist < 0) {
    h = Math.max(-14, inlandDist * 0.14);
  } else {
    // Rolling Urdaibai green valleys & coastal hills
    const baseSlope = Math.min(28, inlandDist * 0.085);
    const hillNoise = fbm(x, z) * Math.min(18, inlandDist * 0.055);
    h = 1.8 + baseSlope + hillNoise;
  }

  // Oka Estuary channel carving (from z = 680 north to z = -270)
  if (z > -290 && z < 700) {
    const cx = okaChannelCenterX(z);
    const hw = okaChannelHalfWidth(z);
    const distRiver = Math.abs(x - cx);
    const riverBlend = Math.exp(-Math.pow(distRiver / (hw * 0.72), 2.4));
    // Carve river channel down to -3.6m
    h = h * (1 - riverBlend) + -3.6 * riverBlend;
  }

  // Laida sandy spit (flat golden sandbar east of the estuary mouth)
  const laidaFlat = gaussianPeak(x, z, 55, -175, 1, 75, 55);
  if (laidaFlat > 0.15) {
    const sandHeight = 1.65 + Math.sin(x * 0.06) * 0.25;
    h = h * (1 - Math.min(0.92, laidaFlat)) + sandHeight * Math.min(0.92, laidaFlat);
  }

  // Laga sandy crescent bay
  const lagaFlat = gaussianPeak(x, z, 345, -215, 1, 60, 42);
  if (lagaFlat > 0.2) {
    const sandHeight = 1.5;
    h = h * (1 - Math.min(0.9, lagaFlat)) + sandHeight * Math.min(0.9, lagaFlat);
  }

  // Mundaka harbor plateau
  const mundakaPlateau = gaussianPeak(x, z, -115, -195, 1, 65, 55);
  if (mundakaPlateau > 0.25) {
    h = h * (1 - Math.min(0.85, mundakaPlateau)) + 4.2 * Math.min(0.85, mundakaPlateau);
  }

  // Bermeo harbor basin & town slope
  const bermeoHarbor = gaussianPeak(x, z, -365, -320, 1, 70, 55);
  if (bermeoHarbor > 0.25) {
    h = h * (1 - Math.min(0.85, bermeoHarbor)) + 3.8 * Math.min(0.85, bermeoHarbor);
  }

  // Gernika valley & town plaza (flat open plain in the south)
  const gernikaPlain = gaussianPeak(x, z, 20, 500, 1, 140, 110);
  if (gernikaPlain > 0.2) {
    const distFromRiver = Math.abs(x - okaChannelCenterX(z));
    if (distFromRiver > 24) {
      h = h * (1 - Math.min(0.88, gernikaPlain)) + 5.2 * Math.min(0.88, gernikaPlain);
    }
  }

  // Gautegiz Arteaga gentle castle terrace
  const arteagaTerrace = gaussianPeak(x, z, 156, 258, 1, 46, 40);
  if (arteagaTerrace > 0.28) {
    h = h * (1 - Math.min(0.8, arteagaTerrace)) + 14.5 * Math.min(0.8, arteagaTerrace);
  }

  // Elantxobe lower harbor terrace carved at the eastern foot of Ogoño
  const elantxobeHarbor = gaussianPeak(x, z, 566, -246, 1, 36, 30);
  if (elantxobeHarbor > 0.35) {
    h = h * (1 - Math.min(0.75, elantxobeHarbor)) + 7.5 * Math.min(0.75, elantxobeHarbor);
  }

  // Iconic Urdaibai peaks & islands!
  // 1. Ogoño Cape (dramatic sea cliff peak + flat launch terrace on top)
  const ogono = gaussianPeak(x, z, 485, -315, 138, 92, 78);
  h += ogono;

  // 2. San Pedro de Atxarre (central panoramic green peak)
  const atxarre = gaussianPeak(x, z, 205, 35, 122, 105, 95);
  h += atxarre;

  // 3. Ereñozar & western Sollube foothills
  h += gaussianPeak(x, z, 380, 210, 96, 130, 120);
  h += gaussianPeak(x, z, -360, 110, 112, 150, 140);
  h += gaussianPeak(x, z, -520, -180, 95, 130, 120);

  // 4. Izaro Island offshore
  const izaroMask = gaussianPeak(x, z, -15, -465, 58, 48, 34);
  if (izaroMask > 2) {
    h = Math.max(h, -6 + izaroMask);
  }

  // 5. San Juan de Gaztelugatxe islet + stone bridge causeway!
  const gazteluPeak = gaussianPeak(x, z, -575, -475, 72, 34, 34);
  if (gazteluPeak > 2) {
    h = Math.max(h, -5 + gazteluPeak);
  }
  // Causeway bridge connecting mainland (-585, -405) to islet (-575, -475)
  const bridgeSeg = distToSegmentSq(x, z, -585, -405, -575, -460);
  if (bridgeSeg.d2 < 36) {
    const bridgeProfile = 4.6 + bridgeSeg.t * 4.2;
    h = Math.max(h, bridgeProfile);
  }

  // 6. Txatxarramendi peninsula in Sukarrieta
  const txatxar = gaussianPeak(x, z, -65, 25, 18, 36, 30);
  if (txatxar > 1.5) {
    h = Math.max(h, txatxar);
  }

  return h;
}

/**
 * Playable ground height at (x, z), including road smoothing and estuary bridges.
 */
export function getTerrainHeight(x: number, z: number): number {
  let h = getRawTerrainHeight(x, z);
  const road = getRoadDistanceInfo(x, z);

  if (road.isBridge) {
    if (road.distance <= road.width * 0.65) {
      return Math.max(h, road.bridgeHeight);
    }
    return h;
  }

  // Smooth paved roadbed over land (or coastal seawall)
  const halfW = road.width * 0.55;
  if (road.distance < halfW + 6) {
    const roadH = Math.max(3.2, h);
    if (road.distance <= halfW) {
      return roadH;
    }
    const blend = 1 - (road.distance - halfW) / 6;
    return h * (1 - blend) + roadH * blend;
  }

  return h;
}

export function getSurfaceType(x: number, z: number, height?: number): SurfaceType {
  const h = height ?? getTerrainHeight(x, z);
  if (h <= WATER_LEVEL + 0.15) return 'water';

  const road = getRoadDistanceInfo(x, z);
  if (road.distance <= road.width * 0.52) return 'road';

  // Gaztelugatxe stone causeway
  const causeway = distToSegmentSq(x, z, -585, -405, -575, -460);
  if (causeway.d2 < 25) return 'rock';

  // Beaches (Laida & Laga & low estuary banks)
  const nearLaida = Math.hypot(x - 55, z + 175) < 88;
  const nearLaga = Math.hypot(x - 345, z + 215) < 68;
  if (h < 3.4 && (nearLaida || nearLaga || z > -260)) {
    return 'sand';
  }

  if (h > 62) return 'rock';
  return 'grass';
}

export function getZoneAt(x: number, z: number): { name: string; subtitle: string } {
  let closest = URDAIBAI_LANDMARKS[0];
  let bestDist = Infinity;

  for (const lm of URDAIBAI_LANDMARKS) {
    const d = Math.hypot(x - lm.x, z - lm.z);
    if (d < bestDist) {
      bestDist = d;
      closest = lm;
    }
  }

  if (bestDist < 125) {
    return { name: closest.name, subtitle: closest.subtitle };
  }
  if (z < -300 && getTerrainHeight(x, z) <= WATER_LEVEL + 0.2) {
    return { name: 'Kantauri Itsasoa', subtitle: 'Urdaibaiko itsasaldea' };
  }
  if (Math.abs(x - okaChannelCenterX(z)) < okaChannelHalfWidth(z) + 20 && z >= -300 && z <= 450) {
    return { name: 'Urdaibaiko Itsasadarra', subtitle: 'Oka ibaia eta padurak' };
  }
  return { name: `Urdaibai · ${closest.name} ingurua`, subtitle: 'Biosfera Erreserba' };
}

/**
 * Returns upward thermal / ridge-soaring wind velocity (m/s) for paragliders & planes.
 */
export function getThermalLift(x: number, z: number, altitudeAboveSea: number): number {
  if (altitudeAboveSea > 260) return 0;
  let lift = 0;
  // Ogoño sea-cliff updraft
  const dOgono = Math.hypot(x - 465, z + 305);
  if (dOgono < 110) lift += (1 - dOgono / 110) * 8.5;
  // Atxarre thermal
  const dAtxarre = Math.hypot(x - 205, z - 35);
  if (dAtxarre < 110) lift += (1 - dAtxarre / 110) * 7.2;
  // Gaztelugatxe sea breeze
  const dGaztelu = Math.hypot(x + 575, z + 475);
  if (dGaztelu < 90) lift += (1 - dGaztelu / 90) * 6.5;
  return lift;
}

/**
 * Returns interpolated world position and yaw for the moving Euskotren Busturialdea train.
 * `phase` in [0, 1] cycles continuously Gernika -> Bermeo -> Gernika.
 */
export function getEuskotrenPose(phase: number): { x: number; y: number; z: number; yaw: number } {
  const pts = EUSKOTREN_RAIL_POINTS;
  const wrapped = ((phase % 1) + 1) % 1;
  // Ping-pong along rail (0..0.5 forward, 0.5..1 return)
  const u = wrapped < 0.5 ? wrapped * 2 : (1 - wrapped) * 2;
  const segCount = pts.length - 1;
  const scaled = Math.min(segCount - 0.0001, Math.max(0, u * segCount));
  const idx = Math.floor(scaled);
  const localT = scaled - idx;
  const a = pts[idx];
  const b = pts[idx + 1];
  const x = a[0] + (b[0] - a[0]) * localT;
  const z = a[1] + (b[1] - a[1]) * localT;
  const dx = wrapped < 0.5 ? b[0] - a[0] : a[0] - b[0];
  const dz = wrapped < 0.5 ? b[1] - a[1] : a[1] - b[1];
  const yaw = Math.atan2(dx, dz);
  const y = Math.max(3.6, getTerrainHeight(x, z)) + 0.5;
  return { x, y, z, yaw };
}
