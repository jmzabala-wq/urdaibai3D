/**
 * Offline OpenStreetMap snapshot of the Urdaibai Biosphere Reserve (Bizkaia).
 * Coordinates & OSM metadata sourced from OpenStreetMap Nominatim/Overpass
 * and projected onto the simplified 1800x1800m Urdaibai world grid so the app
 * runs 100% self-contained without live network dependencies.
 */

export interface OsmPlaceSnapshot {
  id: string;
  name: string;
  osmId: number;
  osmType: 'relation' | 'way' | 'node';
  kind: 'town' | 'village' | 'hamlet' | 'station' | 'heritage' | 'lighthouse' | 'harbor';
  lat: number;
  lng: number;
  worldX: number;
  worldZ: number;
  houseCount: number;
  roofPalette: readonly number[];
  wallPalette: readonly number[];
  description: string;
}

export interface OsmRailStation {
  id: string;
  name: string;
  x: number;
  z: number;
  lat: number;
  lng: number;
}

export const OSM_URDAIBAI_PLACES: readonly OsmPlaceSnapshot[] = [
  {
    id: 'bermeo',
    name: 'Bermeo',
    osmId: 340589,
    osmType: 'relation',
    kind: 'town',
    lat: 43.4194,
    lng: -2.7232,
    worldX: -365,
    worldZ: -320,
    houseCount: 42,
    roofPalette: [0x9a3412, 0xb91c1c, 0x7c2d12, 0x991b1b],
    wallPalette: [0xfef3c7, 0xf1f5f9, 0xfde68a, 0xe0f2fe, 0xfecaca, 0xd1fae5],
    description: 'Arrantzale herria, Lamera parkea, Santa Eufemia eta kaia',
  },
  {
    id: 'mundaka',
    name: 'Mundaka',
    osmId: 344665,
    osmType: 'relation',
    kind: 'village',
    lat: 43.4078,
    lng: -2.6993,
    worldX: -148,
    worldZ: -214,
    houseCount: 28,
    roofPalette: [0x9a3412, 0xb45309, 0x991b1b],
    wallPalette: [0xf8fafc, 0xfef3c7, 0xe2e8f0, 0xbae6fd],
    description: 'Talaia, Santa Katalina baseliza eta portuko etxe zuriak',
  },
  {
    id: 'sukarrieta',
    name: 'Sukarrieta',
    osmId: 340247,
    osmType: 'relation',
    kind: 'village',
    lat: 43.3942,
    lng: -2.6971,
    worldX: -112,
    worldZ: 24,
    houseCount: 16,
    roofPalette: [0x9a3412, 0x78350f],
    wallPalette: [0xf5f5f0, 0xfef9c3, 0xe2e8f0],
    description: 'Txatxarramendi irla eta itsasadarreko parkea',
  },
  {
    id: 'busturia',
    name: 'Busturia',
    osmId: 339545,
    osmType: 'relation',
    kind: 'village',
    lat: 43.3823,
    lng: -2.6983,
    worldX: -102,
    worldZ: 165,
    houseCount: 18,
    roofPalette: [0x9a3412, 0x991b1b],
    wallPalette: [0xf8fafc, 0xfef3c7, 0xf1f5f9],
    description: 'Madariaga Dorretxea (Biodibertsitate Zentroa) eta Axpe',
  },
  {
    id: 'murueta',
    name: 'Murueta',
    osmId: 340639,
    osmType: 'relation',
    kind: 'village',
    lat: 43.3526,
    lng: -2.6828,
    worldX: -76,
    worldZ: 278,
    houseCount: 12,
    roofPalette: [0x7c2d12, 0x9a3412],
    wallPalette: [0xf5f5f0, 0xfde68a],
    description: 'Ontziola historikoa eta padura ertzeko baserriak',
  },
  {
    id: 'forua',
    name: 'Forua',
    osmId: 347288,
    osmType: 'relation',
    kind: 'village',
    lat: 43.3353,
    lng: -2.6889,
    worldX: -48,
    worldZ: 392,
    houseCount: 15,
    roofPalette: [0x9a3412, 0x991b1b],
    wallPalette: [0xf8fafc, 0xfef3c7],
    description: 'Erromatar garaiko aztarnategia eta San Martin eliza',
  },
  {
    id: 'gernika',
    name: 'Gernika-Lumo',
    osmId: 344365,
    osmType: 'relation',
    kind: 'town',
    lat: 43.3144,
    lng: -2.6779,
    worldX: 18,
    worldZ: 515,
    houseCount: 44,
    roofPalette: [0x9a3412, 0x991b1b, 0x7c2d12, 0x78350f],
    wallPalette: [0xf8fafc, 0xfef3c7, 0xe2e8f0, 0xfde68a, 0xf1f5f9],
    description: 'Batzarretxea, Gernikako Arbola, Pasealekua eta Merkatua',
  },
  {
    id: 'arteaga',
    name: 'Gautegiz Arteaga',
    osmId: 154244450,
    osmType: 'way',
    kind: 'heritage',
    lat: 43.352,
    lng: -2.6545,
    worldX: 156,
    worldZ: 258,
    houseCount: 16,
    roofPalette: [0x78350f, 0x9a3412, 0x334155],
    wallPalette: [0xfef3c7, 0xf5f5f0, 0xd6d3d1],
    description: 'Arteagako Gaztelu neogotikoa eta Urdaibai Bird Center',
  },
  {
    id: 'kortezubi',
    name: 'Kortezubi · Santimamiñe',
    osmId: 347289,
    osmType: 'relation',
    kind: 'heritage',
    lat: 43.3409,
    lng: -2.6554,
    worldX: 235,
    worldZ: 358,
    houseCount: 12,
    roofPalette: [0x9a3412, 0x7c2d12],
    wallPalette: [0xf5f5f0, 0xfef3c7],
    description: 'Santimamiñe kobazuloa, Omako basoa eta Basondo',
  },
  {
    id: 'ibarrangelu',
    name: 'Ibarrangelu',
    osmId: 344371,
    osmType: 'relation',
    kind: 'village',
    lat: 43.39,
    lng: -2.6332,
    worldX: 392,
    worldZ: -125,
    houseCount: 16,
    roofPalette: [0x9a3412, 0xb45309],
    wallPalette: [0xf8fafc, 0xfef3c7],
    description: 'Elexaldeko plaza, Laga gaineko baserriak eta Akorda',
  },
  {
    id: 'elantxobe',
    name: 'Elantxobe',
    osmId: 343934,
    osmType: 'relation',
    kind: 'harbor',
    lat: 43.4031,
    lng: -2.6405,
    worldX: 562,
    worldZ: -242,
    houseCount: 24,
    roofPalette: [0x9a3412, 0xb91c1c, 0x7c2d12],
    wallPalette: [0xf8fafc, 0xfef3c7, 0xbae6fd, 0xfecaca, 0xfde68a],
    description: 'Ogoñoko amildegian eskegitako arrantzale herri ikusgarria',
  },
  {
    id: 'matxitxako',
    name: 'Matxitxako Lurmuturra',
    osmId: 227917522,
    osmType: 'way',
    kind: 'lighthouse',
    lat: 43.4554,
    lng: -2.7528,
    worldX: -485,
    worldZ: -392,
    houseCount: 0,
    roofPalette: [0x991b1b],
    wallPalette: [0xf8fafc],
    description: 'Kantauri itsasoko itsasargia eta zetazeoen behatokia',
  },
];

// Euskotren E4 (Bilbao–Gernika–Bermeo) Busturialdea railway polyline along the west bank
export const EUSKOTREN_RAIL_POINTS: ReadonlyArray<readonly [number, number]> = [
  [8, 600],
  [2, 505],
  [-38, 395],
  [-70, 270],
  [-92, 165],
  [-104, 35],
  [-120, -85],
  [-136, -195],
  [-218, -242],
  [-305, -280],
  [-372, -306],
];

export const EUSKOTREN_STATIONS: readonly OsmRailStation[] = [
  { id: 'st-gernika', name: 'Gernika Geltokia', x: 2, z: 505, lat: 43.3148, lng: -2.6774 },
  { id: 'st-forua', name: 'Forua', x: -38, z: 395, lat: 43.3353, lng: -2.6889 },
  { id: 'st-murueta', name: 'Murueta', x: -70, z: 270, lat: 43.3526, lng: -2.6828 },
  { id: 'st-busturia', name: 'Busturia · San Kristobal', x: -92, z: 165, lat: 43.3823, lng: -2.6983 },
  { id: 'st-sukarrieta', name: 'Sukarrieta', x: -104, z: 35, lat: 43.3942, lng: -2.6971 },
  { id: 'st-mundaka', name: 'Mundaka Geltokia', x: -136, z: -195, lat: 43.4076, lng: -2.6995 },
  { id: 'st-bermeo', name: 'Bermeo Geltokia', x: -372, z: -306, lat: 43.419, lng: -2.722 },
];
