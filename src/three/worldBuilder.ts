import * as THREE from 'three';
import {
  ROAD_SEGMENTS,
  URDAIBAI_LANDMARKS,
  WATER_LEVEL,
  WORLD_HALF_SIZE,
  getRoadDistanceInfo,
  getSurfaceType,
  getTerrainHeight,
} from '../world/urdaibaiMap';
import {
  EUSKOTREN_RAIL_POINTS,
  EUSKOTREN_STATIONS,
  OSM_URDAIBAI_PLACES,
} from '../world/osmUrdaibaiData';
import type { ParkedVehicle } from '../physics/vehiclePhysics';
import type { ProceduralTextures } from './textures';
import { buildVehicleMesh } from './vehicleModels';

export interface WorldHandles {
  waterMaterialUniforms: { uTime: { value: number } };
  waterMat: THREE.MeshPhysicalMaterial;
  roadMat: THREE.MeshStandardMaterial;
  landmarkBeacons: Map<string, THREE.Mesh>;
  parkedMeshes: Map<string, THREE.Group>;
  parkedVehicles: ParkedVehicle[];
  windsock: THREE.Mesh;
  beaconLight: THREE.Mesh;
  euskotrenTrain: THREE.Group;
  sailboats: THREE.Group[];
  seagulls: Array<{ group: THREE.Group; leftWing: THREE.Mesh; rightWing: THREE.Mesh; cx: number; cz: number; radius: number; speed: number; y: number }>;
  cloudsGroup: THREE.Group;
  cloudMat: THREE.MeshStandardMaterial;
  rainLines: THREE.LineSegments;
  rainMat: THREE.LineBasicMaterial;
  waveCrests: THREE.Mesh[];
}

function buildRoadRibbon(
  points: ReadonlyArray<readonly [number, number]>,
  width: number,
  isBridge: boolean,
  bridgeHeight: number,
  mat: THREE.Material,
  yOffset = 0.16,
): THREE.Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let accumDist = 0;

  const densePts: Array<[number, number]> = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const segLen = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.ceil(segLen / 10));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      densePts.push([ax + (bx - ax) * t, az + (bz - az) * t]);
    }
  }
  densePts.push([points[points.length - 1][0], points[points.length - 1][1]]);

  const hw = width * 0.5;
  for (let i = 0; i < densePts.length; i++) {
    const [px, pz] = densePts[i];
    const prev = densePts[Math.max(0, i - 1)];
    const next = densePts[Math.min(densePts.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;

    if (i > 0) {
      accumDist += Math.hypot(px - prev[0], pz - prev[1]);
    }

    const lx = px + nx * hw;
    const lz = pz + nz * hw;
    const rx = px - nx * hw;
    const rz = pz - nz * hw;

    const y = isBridge ? bridgeHeight + 0.14 : getTerrainHeight(px, pz) + yOffset;

    positions.push(lx, y, lz, rx, y, rz);
    uvs.push(0, accumDist / 12, 1, accumDist / 12);

    if (i < densePts.length - 1) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

function buildHermitage(stoneMat: THREE.Material, roofColor: number): THREE.Group {
  const g = new THREE.Group();
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.72 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.85 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(8, 5.5, 11), stoneMat);
  body.position.y = 2.75;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.6, 3.4, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 7.2;
  roof.castShadow = true;
  g.add(roof);

  const bellWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.8), stoneMat);
  bellWall.position.set(0, 7.6, 5.1);
  g.add(bellWall);

  const door = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 0.4), woodMat);
  door.position.set(0, 1.5, 5.5);
  g.add(door);

  return g;
}

function buildBasqueChurch(stoneMat: THREE.Material, roofColor: number): THREE.Group {
  const g = new THREE.Group();
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.72 });

  const nave = new THREE.Mesh(new THREE.BoxGeometry(11, 8.5, 18), stoneMat);
  nave.position.y = 4.25;
  nave.castShadow = true;
  nave.receiveShadow = true;
  g.add(nave);

  const naveRoof = new THREE.Mesh(new THREE.ConeGeometry(10.5, 4.0, 4), roofMat);
  naveRoof.rotation.y = Math.PI / 4;
  naveRoof.scale.set(1, 1, 1.45);
  naveRoof.position.y = 10.5;
  g.add(naveRoof);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(4.4, 17, 4.4), stoneMat);
  tower.position.set(0, 8.5, 8.5);
  tower.castShadow = true;
  g.add(tower);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.4, 5.5, 4), roofMat);
  spire.rotation.y = Math.PI / 4;
  spire.position.set(0, 19.5, 8.5);
  g.add(spire);

  return g;
}

function buildArteagaCastle(stoneMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const slateMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55, metalness: 0.15 });

  const keep = new THREE.Mesh(new THREE.BoxGeometry(14, 13, 14), stoneMat);
  keep.position.y = 6.5;
  keep.castShadow = true;
  keep.receiveShadow = true;
  g.add(keep);

  const centralTower = new THREE.Mesh(new THREE.BoxGeometry(6.5, 22, 6.5), stoneMat);
  centralTower.position.y = 11;
  centralTower.castShadow = true;
  g.add(centralTower);

  const centralRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 5.5, 4), slateMat);
  centralRoof.rotation.y = Math.PI / 4;
  centralRoof.position.y = 24.5;
  g.add(centralRoof);

  const offsets = [
    [-7, -7],
    [7, -7],
    [-7, 7],
    [7, 7],
  ];
  for (const [ox, oz] of offsets) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 15, 10), stoneMat);
    turret.position.set(ox, 7.5, oz);
    turret.castShadow = true;
    g.add(turret);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.0, 10), slateMat);
    cap.position.set(ox, 17, oz);
    g.add(cap);
  }

  return g;
}

function buildEuskotrenTrain(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.18 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.12 });
  const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.18, metalness: 0.45 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65 });

  for (const zOff of [-5.2, 5.2]) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.8, 9.6), bodyMat);
    car.position.set(0, 1.8, zOff);
    car.castShadow = true;
    g.add(car);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.55, 9.64), stripeMat);
    stripe.position.set(0, 1.0, zOff);
    g.add(stripe);

    const wins = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.9, 8.4), winMat);
    wins.position.set(0, 2.2, zOff);
    g.add(wins);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 9.2), roofMat);
    roof.position.set(0, 3.35, zOff);
    g.add(roof);
  }

  const headLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 2.0 }),
  );
  headLight.position.set(0, 1.3, 10.05);
  g.add(headLight);

  return g;
}

function buildSailboat(hullColor: number): THREE.Group {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.1, 7.6),
    new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.48 }),
  );
  hull.position.y = 0.3;
  g.add(hull);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.9, 2.8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 }),
  );
  cabin.position.set(0, 1.15, -0.4);
  g.add(cabin);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 7.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.4 }),
  );
  mast.position.set(0, 4.4, 0.4);
  g.add(mast);

  const sail = new THREE.Mesh(
    new THREE.ConeGeometry(2.1, 6.0, 3),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.75 }),
  );
  sail.scale.set(0.08, 1, 1);
  sail.position.set(0, 4.5, -0.7);
  g.add(sail);

  return g;
}

export function buildUrdaibaiWorld(
  scene: THREE.Scene,
  textures: ProceduralTextures,
  isSoftwareGl: boolean,
): WorldHandles {
  // 1. Vertex-colored Terrain Mesh (1800m x 1800m)
  const segs = 160;
  const size = WORLD_HALF_SIZE * 2;
  const terrainGeo = new THREE.PlaneGeometry(size, size, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cSand = new THREE.Color(0xe6cf9a);
  const cGrassLow = new THREE.Color(0x3f7334);
  const cGrassDark = new THREE.Color(0x274e24);
  const cGrassHigh = new THREE.Color(0x34612d);
  const cRock = new THREE.Color(0x8c96a4);
  const cRockDark = new THREE.Color(0x646e7a);
  const cSeabed = new THREE.Color(0x164e63);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const vy = getTerrainHeight(vx, vz);
    pos.setY(i, vy);

    const micro = 0.5 + 0.5 * (Math.sin(vx * 0.045 + vz * 0.032) * Math.cos(vx * 0.021 - vz * 0.051));
    const surface = getSurfaceType(vx, vz, vy);
    if (vy <= WATER_LEVEL + 0.1) {
      tmpColor.copy(cSeabed).lerp(cSand, Math.max(0, (vy + 3.5) / 3.6));
    } else if (surface === 'sand') {
      tmpColor.copy(cSand).offsetHSL(0, 0, (micro - 0.5) * 0.04);
    } else if (surface === 'rock' || vy > 58) {
      const t = Math.min(1, Math.max(0, (vy - 42) / 55));
      tmpColor.copy(cGrassHigh).lerp(cRock, t).lerp(cRockDark, micro * 0.32 * t);
    } else {
      const hBlend = Math.min(1, Math.max(0, vy / 50));
      tmpColor.copy(cGrassLow).lerp(cGrassHigh, hBlend).lerp(cGrassDark, micro * 0.38);
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.02,
    bumpMap: textures.terrainBumpMap,
    bumpScale: 0.45,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // 2. Animated Cantabrian Sea & Oka Estuary Water Surface
  const waterGeo = new THREE.PlaneGeometry(4400, 4400, isSoftwareGl ? 32 : 96, isSoftwareGl ? 32 : 96);
  waterGeo.rotateX(-Math.PI / 2);

  const waterMaterialUniforms = { uTime: { value: 0 } };
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d6b82,
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.88,
  });

  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterMaterialUniforms.uTime;
    shader.vertexShader =
      `uniform float uTime;\nvarying vec2 vWorldXZ;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vWorldXZ = (modelMatrix * vec4(transformed, 1.0)).xz;
         float w1 = sin(dot(vWorldXZ, vec2(0.032, 0.024)) + uTime * 1.2);
         float w2 = cos(dot(vWorldXZ, vec2(-0.022, 0.038)) + uTime * 0.9);
         transformed.y += (w1 + w2) * 0.14;`,
      );
    shader.fragmentShader =
      `uniform float uTime;\nvarying vec2 vWorldXZ;\n` +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float r1 = sin(dot(vWorldXZ, vec2(0.09, 0.07)) + uTime * 1.5);
         float r2 = sin(dot(vWorldXZ, vec2(-0.06, 0.11)) - uTime * 1.2);
         float ripple = (r1 + r2) * 0.5;
         diffuseColor.rgb += vec3(0.012, 0.028, 0.034) * ripple;`,
      );
  };

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = WATER_LEVEL;
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // 3. Roads, Estuary Bridges & Euskotren Busturialdea Rail Track
  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.asphaltMap,
    roughness: 0.82,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneMap,
    roughness: 0.84,
    metalness: 0.05,
  });

  for (const seg of ROAD_SEGMENTS) {
    const ribbon = buildRoadRibbon(
      seg.points,
      seg.width,
      Boolean(seg.isBridge),
      seg.bridgeHeight ?? 6,
      roadMat,
    );
    scene.add(ribbon);

    if (seg.isBridge) {
      const start = seg.points[0];
      const end = seg.points[seg.points.length - 1];
      const bh = seg.bridgeHeight ?? 6;
      for (let t = 0.2; t <= 0.85; t += 0.3) {
        const px = start[0] + (end[0] - start[0]) * t;
        const pz = start[1] + (end[1] - start[1]) * t;
        const pier = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, bh + 5, 10), stoneMat);
        pier.position.set(px, (bh - 5) * 0.5, pz);
        pier.castShadow = true;
        scene.add(pier);
      }
    }
  }

  // Euskotren rail ballast bed + wooden ties + station canopies
  const ballastMat = new THREE.MeshStandardMaterial({
    color: 0x57534e,
    roughness: 0.92,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  scene.add(buildRoadRibbon(EUSKOTREN_RAIL_POINTS, 3.8, false, 0, ballastMat, 0.22));

  const tiePositions: Array<{ x: number; y: number; z: number; yaw: number }> = [];
  for (let i = 0; i < EUSKOTREN_RAIL_POINTS.length - 1; i++) {
    const [ax, az] = EUSKOTREN_RAIL_POINTS[i];
    const [bx, bz] = EUSKOTREN_RAIL_POINTS[i + 1];
    const segLen = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(bx - ax, bz - az);
    const steps = Math.max(2, Math.floor(segLen / 7));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const rx = ax + (bx - ax) * t;
      const rz = az + (bz - az) * t;
      tiePositions.push({ x: rx, y: Math.max(3.4, getTerrainHeight(rx, rz)) + 0.32, z: rz, yaw });
    }
  }
  const tieGeo = new THREE.BoxGeometry(2.6, 0.22, 0.85);
  const tieMesh = new THREE.InstancedMesh(
    tieGeo,
    new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 }),
    tiePositions.length,
  );
  const dummy = new THREE.Object3D();
  tiePositions.forEach((tp, idx) => {
    dummy.position.set(tp.x, tp.y, tp.z);
    dummy.rotation.set(0, tp.yaw, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    tieMesh.setMatrixAt(idx, dummy.matrix);
  });
  tieMesh.instanceMatrix.needsUpdate = true;
  tieMesh.computeBoundingSphere();
  scene.add(tieMesh);

  // Euskotren stations (blue/white shelters along the line)
  const stPlatformMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
  const stCanopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 });
  for (const st of EUSKOTREN_STATIONS) {
    const sy = Math.max(3.4, getTerrainHeight(st.x, st.z));
    const plat = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.9, 14), stPlatformMat);
    plat.position.set(st.x + 3.2, sy + 0.45, st.z);
    scene.add(plat);
    const shelter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 10), stCanopyMat);
    shelter.position.set(st.x + 3.5, sy + 3.2, st.z);
    scene.add(shelter);
  }

  // Animated Euskotren commuter train
  const euskotrenTrain = buildEuskotrenTrain();
  scene.add(euskotrenTrain);

  // 4. Signature Urdaibai Landmarks & Dressed Towns
  // A) San Juan de Gaztelugatxe: Arched stone bridge + hermitage
  const gaztelu = URDAIBAI_LANDMARKS.find((l) => l.id === 'gaztelugatxe')!;
  const gazteluGroup = new THREE.Group();
  gazteluGroup.position.set(gaztelu.x, getTerrainHeight(gaztelu.x, gaztelu.z), gaztelu.z);
  gazteluGroup.add(buildHermitage(stoneMat, 0xb45309));
  scene.add(gazteluGroup);

  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const bx = -584 + t * 9;
    const bz = -408 - t * 50;
    const by = 4.4 + t * 3.8;
    const span = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.5, 11), stoneMat);
    span.position.set(bx, by - 2.2, bz);
    span.castShadow = true;
    span.receiveShadow = true;
    scene.add(span);
  }

  // B) Mundaka Harbor Pier, Lighthouse, Santa Katalina & Santa Maria Church
  const pierMat = stoneMat;
  const mundakaPier = new THREE.Mesh(new THREE.BoxGeometry(36, 4.8, 12), pierMat);
  mundakaPier.position.set(-96, 1.8, -206);
  mundakaPier.castShadow = true;
  mundakaPier.receiveShadow = true;
  scene.add(mundakaPier);

  // Cobblestone plaza pad in Mundaka town center
  const mundakaPlaza = new THREE.Mesh(new THREE.CylinderGeometry(16, 16.5, 0.4, 24), stoneMat);
  mundakaPlaza.position.set(-148, getTerrainHeight(-148, -214) + 0.15, -214);
  mundakaPlaza.receiveShadow = true;
  scene.add(mundakaPlaza);

  const mundakaChurch = buildBasqueChurch(stoneMat, 0x9a3412);
  mundakaChurch.position.set(-142, getTerrainHeight(-142, -214), -214);
  mundakaChurch.scale.setScalar(0.72);
  scene.add(mundakaChurch);

  const lighthouse = new THREE.Group();
  lighthouse.position.set(-82, 4.2, -206);
  const lhTower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.6, 9, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }),
  );
  lhTower.position.y = 4.5;
  lhTower.castShadow = true;
  lighthouse.add(lhTower);
  const beaconLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 2.2 }),
  );
  beaconLight.position.y = 9.4;
  lighthouse.add(beaconLight);
  scene.add(lighthouse);

  const santaKatalina = buildHermitage(stoneMat, 0x991b1b);
  santaKatalina.position.set(-142, getTerrainHeight(-142, -242), -242);
  santaKatalina.scale.setScalar(0.8);
  scene.add(santaKatalina);

  // Matxitxako Cape Lighthouse (NW headland)
  const matxitxako = OSM_URDAIBAI_PLACES.find((p) => p.id === 'matxitxako')!;
  const matxGroup = new THREE.Group();
  matxGroup.position.set(matxitxako.worldX, getTerrainHeight(matxitxako.worldX, matxitxako.worldZ), matxitxako.worldZ);
  const matxTower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 2.2, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 }),
  );
  matxTower.position.y = 8;
  matxGroup.add(matxTower);
  const matxTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 2.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 }),
  );
  matxTop.position.y = 17;
  matxGroup.add(matxTop);
  scene.add(matxGroup);

  // C) Bermeo Harbor Breakwater, Port Crane, Santa Eufemia Church & Fishing Fleet
  const bermeoPier = new THREE.Mesh(new THREE.BoxGeometry(66, 5.2, 15), pierMat);
  bermeoPier.position.set(-342, 2.0, -344);
  bermeoPier.rotation.y = 0.25;
  bermeoPier.castShadow = true;
  scene.add(bermeoPier);

  // Red harbor crane on Bermeo pier
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5, metalness: 0.35 });
  const craneBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 12, 3.2), craneMat);
  craneBase.position.set(-330, 8.5, -342);
  scene.add(craneBase);
  const craneBoom = new THREE.Mesh(new THREE.BoxGeometry(14, 1.4, 1.4), craneMat);
  craneBoom.position.set(-325, 15, -342);
  craneBoom.rotation.z = 0.28;
  scene.add(craneBoom);

  const bermeoChurch = buildBasqueChurch(stoneMat, 0x7c2d12);
  bermeoChurch.position.set(-362, getTerrainHeight(-362, -310), -310);
  bermeoChurch.scale.setScalar(0.88);
  scene.add(bermeoChurch);

  const boatHullGeo = new THREE.BoxGeometry(3.2, 1.4, 8.6);
  const boatHullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
  const boats = new THREE.InstancedMesh(boatHullGeo, boatHullMat, 16);
  for (let i = 0; i < 16; i++) {
    if (i < 12) {
      // Bermeo fishing fleet
      dummy.position.set(-382 + i * 7.2, 0.4, -326 - (i % 3) * 8.5);
      dummy.rotation.set(0, 0.22 + (i % 3) * 0.12, 0);
    } else {
      // Elantxobe harbor boats
      const k = i - 12;
      dummy.position.set(558 + k * 7, 0.4, -264 - (k % 2) * 8);
      dummy.rotation.set(0, -0.35, 0);
    }
    dummy.scale.setScalar(0.88 + (i % 3) * 0.12);
    dummy.updateMatrix();
    boats.setMatrixAt(i, dummy.matrix);
    const c = i % 3 === 0 ? 0x0284c7 : i % 3 === 1 ? 0xdc2626 : 0x059669;
    boats.setColorAt(i, new THREE.Color(c));
  }
  boats.instanceMatrix.needsUpdate = true;
  if (boats.instanceColor) boats.instanceColor.needsUpdate = true;
  boats.computeBoundingSphere();
  scene.add(boats);

  // Moored white sailboats bobbing gently in Mundaka & Oka estuary channel
  const sailboats: THREE.Group[] = [];
  const sailSpots: Array<[number, number, number, number]> = [
    [-72, -196, 0.4, 0x0369a1],
    [-58, -182, -0.2, 0x0f766e],
    [-44, -145, 0.8, 0xb91c1c],
    [-25, -40, 0.1, 0x1d4ed8],
    [-335, -356, 1.1, 0x0284c7],
  ];
  for (const [sx, sz, syaw, scol] of sailSpots) {
    const sb = buildSailboat(scol);
    sb.position.set(sx, WATER_LEVEL + 0.05, sz);
    sb.rotation.y = syaw;
    scene.add(sb);
    sailboats.push(sb);
  }

  // D) Gernika Casa de Juntas, Sacred Oak, Plaza & Santa Maria Church
  const gernika = URDAIBAI_LANDMARKS.find((l) => l.id === 'gernika')!;
  const gY = getTerrainHeight(gernika.x - 24, gernika.z + 18);
  const casaJuntas = new THREE.Group();
  casaJuntas.position.set(gernika.x - 24, gY, gernika.z + 18);
  const cjBody = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 14), stoneMat);
  cjBody.position.y = 4.5;
  cjBody.castShadow = true;
  casaJuntas.add(cjBody);
  const cjRoof = new THREE.Mesh(
    new THREE.ConeGeometry(14, 4, 4),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.72 }),
  );
  cjRoof.rotation.y = Math.PI / 4;
  cjRoof.position.y = 11;
  casaJuntas.add(cjRoof);
  const oakTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.3, 5.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 }),
  );
  oakTrunk.position.set(16, 2.75, 0);
  casaJuntas.add(oakTrunk);
  const oakCanopy = new THREE.Mesh(
    new THREE.DodecahedronGeometry(4.8, 1),
    new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.82 }),
  );
  oakCanopy.position.set(16, 7.2, 0);
  oakCanopy.castShadow = true;
  casaJuntas.add(oakCanopy);
  scene.add(casaJuntas);

  const gernikaPlaza = new THREE.Mesh(new THREE.BoxGeometry(46, 0.35, 36), stoneMat);
  gernikaPlaza.position.set(gernika.x - 16, gY + 0.1, gernika.z + 20);
  gernikaPlaza.receiveShadow = true;
  scene.add(gernikaPlaza);

  const gernikaChurch = buildBasqueChurch(stoneMat, 0x991b1b);
  gernikaChurch.position.set(gernika.x + 28, getTerrainHeight(gernika.x + 28, gernika.z + 44), gernika.z + 44);
  gernikaChurch.scale.setScalar(0.95);
  scene.add(gernikaChurch);

  // E) Gautegiz Arteaga Castle + Busturia Madariaga Tower + Elantxobe Breakwater
  const arteagaCastle = buildArteagaCastle(stoneMat);
  arteagaCastle.position.set(156, getTerrainHeight(156, 258), 258);
  scene.add(arteagaCastle);

  const madariagaTower = new THREE.Mesh(new THREE.BoxGeometry(9, 14, 9), stoneMat);
  madariagaTower.position.set(-95, getTerrainHeight(-95, 165) + 7, 165);
  madariagaTower.castShadow = true;
  scene.add(madariagaTower);
  const madariagaRoof = new THREE.Mesh(
    new THREE.ConeGeometry(7.2, 3.6, 4),
    new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.72 }),
  );
  madariagaRoof.rotation.y = Math.PI / 4;
  madariagaRoof.position.set(-95, getTerrainHeight(-95, 165) + 15.8, 165);
  scene.add(madariagaRoof);

  const elantxobePier = new THREE.Mesh(new THREE.BoxGeometry(38, 4.6, 10), pierMat);
  elantxobePier.position.set(570, 1.8, -262);
  elantxobePier.rotation.y = -0.32;
  scene.add(elantxobePier);

  // F) Atxarre Hermitage + Ogoño Launch Ramp & Windsock + Izaro Beacon
  const atxarre = URDAIBAI_LANDMARKS.find((l) => l.id === 'atxarre')!;
  const atxHermit = buildHermitage(stoneMat, 0x991b1b);
  atxHermit.position.set(atxarre.x, getTerrainHeight(atxarre.x, atxarre.z), atxarre.z);
  atxHermit.scale.setScalar(0.75);
  scene.add(atxHermit);

  const ogono = URDAIBAI_LANDMARKS.find((l) => l.id === 'ogono')!;
  const ogonoY = getTerrainHeight(ogono.x, ogono.z);
  const launchDeck = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.8, 14),
    new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85 }),
  );
  launchDeck.position.set(ogono.x, ogonoY + 0.3, ogono.z);
  launchDeck.rotation.y = -0.35;
  scene.add(launchDeck);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 }),
  );
  pole.position.set(ogono.x + 6, ogonoY + 3, ogono.z - 4);
  scene.add(pole);

  const windsockGeo = new THREE.ConeGeometry(0.55, 2.8, 8, 1, true);
  windsockGeo.rotateX(Math.PI / 2);
  windsockGeo.translate(0, 0, 1.4);
  const windsock = new THREE.Mesh(
    windsockGeo,
    new THREE.MeshStandardMaterial({ color: 0xf97316, side: THREE.DoubleSide, roughness: 0.7 }),
  );
  windsock.position.set(ogono.x + 6, ogonoY + 5.7, ogono.z - 4);
  scene.add(windsock);

  const izaro = URDAIBAI_LANDMARKS.find((l) => l.id === 'izaro')!;
  const izBeacon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 6, 8), stoneMat);
  izBeacon.position.set(izaro.x, getTerrainHeight(izaro.x, izaro.z) + 2.5, izaro.z);
  scene.add(izBeacon);

  // F2) Mundaka Ezker Olatua (curling surf wave crest arcs at estuary bar)
  const waveCrests: THREE.Mesh[] = [];
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xe0f7fa,
    roughness: 0.35,
    transparent: true,
    opacity: 0.82,
  });
  for (let w = 0; w < 3; w++) {
    const wave = new THREE.Mesh(new THREE.BoxGeometry(26 - w * 4, 0.55, 2.2), foamMat);
    wave.position.set(-80 + w * 9, WATER_LEVEL + 0.25, -222 + w * 11);
    wave.rotation.y = 0.42;
    scene.add(wave);
    waveCrests.push(wave);
  }

  // F3) Urdaibai Bird Center & Gautegiz Wetland Boardwalk (115, 208)
  const woodDeckMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88 });
  const birdCenterY = Math.max(WATER_LEVEL + 1.4, getTerrainHeight(115, 208));
  const birdPavilion = new THREE.Mesh(new THREE.BoxGeometry(14, 5.2, 9), woodDeckMat);
  birdPavilion.position.set(115, birdCenterY + 2.6, 208);
  birdPavilion.castShadow = true;
  scene.add(birdPavilion);
  const birdRoof = new THREE.Mesh(
    new THREE.ConeGeometry(10.5, 2.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 }),
  );
  birdRoof.rotation.y = Math.PI / 4;
  birdRoof.position.set(115, birdCenterY + 6.5, 208);
  scene.add(birdRoof);
  const wetlandWalk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 34), woodDeckMat);
  wetlandWalk.position.set(95, WATER_LEVEL + 1.1, 198);
  wetlandWalk.rotation.y = 0.65;
  scene.add(wetlandWalk);

  // F4) Txatxarramendi wooden footbridge (Sukarrieta) + Laida Dune Boardwalk
  const txBridge = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 22), woodDeckMat);
  txBridge.position.set(-72, WATER_LEVEL + 2.2, 28);
  txBridge.rotation.y = 1.15;
  scene.add(txBridge);

  const laidaBoardwalk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 38), woodDeckMat);
  laidaBoardwalk.position.set(58, Math.max(WATER_LEVEL + 1.5, getTerrainHeight(58, -162)) + 0.15, -162);
  laidaBoardwalk.rotation.y = 0.25;
  scene.add(laidaBoardwalk);

  // F5) Omako Basoa (Basque Painted Forest trunks near Kortezubi / Santimamiñe)
  const omaColors = [0x2563eb, 0xdc2626, 0xfacc15, 0xf8fafc, 0x10b981];
  for (let o = 0; o < 12; o++) {
    const ox = 242 + (o % 4) * 5.2;
    const oz = 342 + Math.floor(o / 4) * 5.4;
    const oy = getTerrainHeight(ox, oz);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.58, 7.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 }),
    );
    trunk.position.set(ox, oy + 3.7, oz);
    scene.add(trunk);
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.49, 0.52, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: omaColors[o % omaColors.length], roughness: 0.72 }),
    );
    band.position.set(ox, oy + 3.1, oz);
    scene.add(band);
    const crown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.6, 1),
      new THREE.MeshStandardMaterial({ color: 0x1e5631, roughness: 0.85 }),
    );
    crown.position.set(ox, oy + 8.4, oz);
    scene.add(crown);
  }

  // F6) Soaring Coastal Seagulls above Mundaka, Izaro & Ogoño
  const seagulls: WorldHandles['seagulls'] = [];
  const gullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
  const gullCircuits: Array<[number, number, number, number, number]> = [
    [-95, -205, 42, 0.45, 24],
    [-85, -195, 52, -0.38, 29],
    [-15, -455, 65, 0.34, 48],
    [55, -175, 48, 0.4, 26],
    [470, -310, 72, -0.32, 152],
    [-365, -335, 58, 0.36, 36],
  ];
  for (const [cx, cz, radius, speed, y] of gullCircuits) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 1.3), gullMat);
    g.add(body);
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.45), gullMat);
    leftWing.position.set(-0.75, 0.08, 0);
    g.add(leftWing);
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.45), gullMat);
    rightWing.position.set(0.75, 0.08, 0);
    g.add(rightWing);
    g.position.set(cx + radius, y, cz);
    scene.add(g);
    seagulls.push({ group: g, leftWing, rightWing, cx, cz, radius, speed, y });
  }

  // F7) 3D Drifting Cloud Layers & Dynamic Rain Streaks (weather system!)
  const cloudsGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.95,
    metalness: 0,
    transparent: true,
    opacity: 0.42,
  });
  const puffGeo = new THREE.DodecahedronGeometry(24, 1);
  for (let c = 0; c < 18; c++) {
    const cluster = new THREE.Group();
    const cx = ((c * 211) % 1500) - 750;
    const cz = ((c * 347) % 1500) - 750;
    const cy = 195 + (c % 5) * 18;
    cluster.position.set(cx, cy, cz);
    for (let p = 0; p < 3; p++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set((p - 1) * 22, (p % 2) * 5, ((p * 7) % 10) - 5);
      puff.scale.set(1.3 + (p % 2) * 0.4, 0.42, 0.95);
      cluster.add(puff);
    }
    cloudsGroup.add(cluster);
  }
  scene.add(cloudsGroup);

  // Rain line streaks in a local box centered on the camera
  const rainCount = 1400;
  const rainPositions = new Float32Array(rainCount * 6);
  for (let i = 0; i < rainCount; i++) {
    const rx = (Math.random() - 0.5) * 95;
    const ry = Math.random() * 52;
    const rz = (Math.random() - 0.5) * 95;
    rainPositions[i * 6 + 0] = rx;
    rainPositions[i * 6 + 1] = ry;
    rainPositions[i * 6 + 2] = rz;
    rainPositions[i * 6 + 3] = rx - 0.55;
    rainPositions[i * 6 + 4] = ry - 3.4;
    rainPositions[i * 6 + 5] = rz - 0.2;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0,
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.frustumCulled = false;
  rainLines.visible = false;
  scene.add(rainLines);

  // G) Laida & Laga Beach Umbrellas & Wooden Dune Boardwalk (InstancedMesh)
  const umbrellaSpots: Array<[number, number, number]> = [
    [42, -172, 0xef4444],
    [52, -182, 0x0284c7],
    [65, -178, 0xf59e0b],
    [74, -168, 0x10b981],
    [48, -162, 0xec4899],
    [336, -214, 0x0284c7],
    [348, -218, 0xef4444],
    [358, -210, 0xfacc15],
  ];
  const umbPoleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6);
  umbPoleGeo.translate(0, 1.3, 0);
  const umbCapGeo = new THREE.ConeGeometry(1.9, 0.85, 8);
  umbCapGeo.translate(0, 2.75, 0);
  const umbPoles = new THREE.InstancedMesh(
    umbPoleGeo,
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }),
    umbrellaSpots.length,
  );
  const umbCaps = new THREE.InstancedMesh(
    umbCapGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 }),
    umbrellaSpots.length,
  );
  umbrellaSpots.forEach(([ux, uz, col], idx) => {
    const uy = Math.max(WATER_LEVEL + 0.4, getTerrainHeight(ux, uz));
    dummy.position.set(ux, uy, uz);
    dummy.rotation.set(0.06, idx * 0.8, 0.04);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    umbPoles.setMatrixAt(idx, dummy.matrix);
    umbCaps.setMatrixAt(idx, dummy.matrix);
    umbCaps.setColorAt(idx, new THREE.Color(col));
  });
  umbPoles.instanceMatrix.needsUpdate = true;
  umbCaps.instanceMatrix.needsUpdate = true;
  if (umbCaps.instanceColor) umbCaps.instanceColor.needsUpdate = true;
  scene.add(umbPoles, umbCaps);

  // 5. InstancedMesh Urdaibai Foliage (Holm Oaks & Maritime Pines), Rocks & Dressed Town Houses
  const treeCount = 460;
  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 3.6, 6);
  trunkGeo.translate(0, 1.8, 0);
  const canopyGeo = new THREE.DodecahedronGeometry(2.8, 1);
  canopyGeo.translate(0, 5.1, 0);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
  canopies.castShadow = !isSoftwareGl;
  canopies.receiveShadow = true;

  let tIdx = 0;
  for (let i = 0; i < 1400 && tIdx < treeCount; i++) {
    const rx = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 1550;
    const rz = ((Math.cos(i * 78.233) * 23421.631) % 1) * 1450;
    const x = rx > 775 ? rx - 1550 : rx < -775 ? rx + 1550 : rx;
    const z = rz > 725 ? rz - 1450 : rz < -725 ? rz + 1450 : rz;

    if (Math.hypot(x - -115, z - -195) < 26) continue;
    const h = getTerrainHeight(x, z);
    const surf = getSurfaceType(x, z, h);
    if (surf !== 'grass' || h < 4 || h > 95) continue;

    const scale = 0.85 + ((i * 37) % 30) / 100;
    dummy.position.set(x, h - 0.15, z);
    dummy.rotation.set(0, (i * 1.7) % (Math.PI * 2), 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();

    trunks.setMatrixAt(tIdx, dummy.matrix);
    canopies.setMatrixAt(tIdx, dummy.matrix);
    const shade = new THREE.Color().setHSL(0.28 + ((i % 7) - 3) * 0.012, 0.45, 0.16 + (i % 5) * 0.02);
    canopies.setColorAt(tIdx, shade);
    tIdx++;
  }
  trunks.count = tIdx;
  canopies.count = tIdx;
  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
  trunks.computeBoundingSphere();
  canopies.computeBoundingSphere();
  scene.add(trunks, canopies);

  // Coastal & Cliff Rocks
  const rockCount = 150;
  const rockGeo = new THREE.DodecahedronGeometry(2.2, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, metalness: 0.05 });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  let rIdx = 0;
  for (let i = 0; i < 650 && rIdx < rockCount; i++) {
    const x = Math.sin(i * 45.1) * 760;
    const z = Math.cos(i * 19.7) * 680;
    const h = getTerrainHeight(x, z);
    const surf = getSurfaceType(x, z, h);
    if (surf === 'road' || h < 0.5) continue;
    if (surf === 'rock' || Math.abs(h - 2.5) < 1.2) {
      dummy.position.set(x, h, z);
      dummy.rotation.set(i, i * 0.7, 0);
      dummy.scale.set(0.8 + (i % 4) * 0.35, 0.6 + (i % 3) * 0.3, 0.8 + ((i + 1) % 4) * 0.3);
      dummy.updateMatrix();
      rocks.setMatrixAt(rIdx, dummy.matrix);
      rIdx++;
    }
  }
  rocks.count = rIdx;
  rocks.instanceMatrix.needsUpdate = true;
  rocks.computeBoundingSphere();
  scene.add(rocks);

  // Dressed Basque Houses & Colorful Harbor Townhouses driven by OSM_URDAIBAI_PLACES
  interface HousePlacement {
    x: number;
    y: number;
    z: number;
    yaw: number;
    sx: number;
    sy: number;
    sz: number;
    wallCol: number;
    roofCol: number;
  }
  const houses: HousePlacement[] = [];
  const streetLampPositions: Array<[number, number, number]> = [];

  for (const place of OSM_URDAIBAI_PLACES) {
    if (place.houseCount <= 0) continue;

    // Add 6-10 warm streetlights along each town perimeter
    const lampTarget = place.kind === 'town' ? 10 : 5;
    for (let l = 0; l < lampTarget; l++) {
      const ang = (l / lampTarget) * Math.PI * 2;
      const rad = place.kind === 'town' ? 28 + (l % 2) * 14 : 18 + (l % 2) * 10;
      const lx = place.worldX + Math.cos(ang) * rad;
      const lz = place.worldZ + Math.sin(ang) * rad;
      if (Math.hypot(lx - -115, lz - -195) < 16) continue;
      const ly = getTerrainHeight(lx, lz);
      if (ly > WATER_LEVEL + 1.5 && ly < 42) {
        streetLampPositions.push([lx, ly, lz]);
      }
    }

    for (let i = 0; i < place.houseCount; i++) {
      const ang = i * 2.39996;
      const maxRing = place.kind === 'town' ? 8 : 5;
      const rad = 16 + (i % maxRing) * 8.5;
      const hx = place.worldX + Math.cos(ang) * rad;
      const hz = place.worldZ + Math.sin(ang) * rad;

      // Keep Mundaka spawn & vista corridor + church plazas clear
      if (Math.hypot(hx - -115, hz - -195) < 32) continue;
      if (Math.hypot(hx - -90, hz - -175) < 25) continue;
      if (Math.hypot(hx - -142, hz - -214) < 14) continue;
      if (Math.hypot(hx - 156, hz - 258) < 18) continue;

      const roadInfo = getRoadDistanceInfo(hx, hz);
      if (roadInfo.distance < roadInfo.width * 0.65 + 4.5) continue;

      const hy = getTerrainHeight(hx, hz);
      const surf = getSurfaceType(hx, hz, hy);
      if (surf !== 'grass' && surf !== 'rock') continue;
      if (hy <= WATER_LEVEL + 1.6 || hy > 48) continue;

      const wallCol = place.wallPalette[i % place.wallPalette.length];
      const roofCol = place.roofPalette[i % place.roofPalette.length];
      const scaleW = 0.82 + (i % 4) * 0.12;
      const scaleH = place.kind === 'harbor' || place.kind === 'town' ? 0.9 + (i % 3) * 0.28 : 0.88 + (i % 3) * 0.14;

      houses.push({
        x: hx,
        y: hy,
        z: hz,
        yaw: ang + Math.PI / 2,
        sx: scaleW,
        sy: scaleH,
        sz: scaleW,
        wallCol,
        roofCol,
      });
    }
  }

  const hPlinthGeo = new THREE.BoxGeometry(7.9, 1.4, 9.6);
  hPlinthGeo.translate(0, 0.7, 0);
  const hWallGeo = new THREE.BoxGeometry(7.5, 4.4, 9.2);
  hWallGeo.translate(0, 3.6, 0);
  const hBalconyGeo = new THREE.BoxGeometry(8.05, 0.45, 5.4);
  hBalconyGeo.translate(0, 5.2, 0);
  const hBandGeo = new THREE.BoxGeometry(7.72, 1.1, 4.8);
  hBandGeo.translate(0, 3.8, 0);
  const hRoofGeo = new THREE.ConeGeometry(6.9, 3.0, 4);
  hRoofGeo.rotateY(Math.PI / 4);
  hRoofGeo.translate(0, 7.3, 0);

  const plinthMesh = new THREE.InstancedMesh(
    hPlinthGeo,
    new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 }),
    houses.length,
  );
  const wallMesh = new THREE.InstancedMesh(
    hWallGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 }),
    houses.length,
  );
  const balconyMesh = new THREE.InstancedMesh(
    hBalconyGeo,
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 }),
    houses.length,
  );
  const windowBandMesh = new THREE.InstancedMesh(
    hBandGeo,
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.25 }),
    houses.length,
  );
  const roofMesh = new THREE.InstancedMesh(
    hRoofGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 }),
    houses.length,
  );
  wallMesh.castShadow = !isSoftwareGl;
  roofMesh.castShadow = !isSoftwareGl;

  houses.forEach((h, idx) => {
    dummy.position.set(h.x, h.y - 0.1, h.z);
    dummy.rotation.set(0, h.yaw, 0);
    dummy.scale.set(h.sx, h.sy, h.sz);
    dummy.updateMatrix();
    plinthMesh.setMatrixAt(idx, dummy.matrix);
    wallMesh.setMatrixAt(idx, dummy.matrix);
    balconyMesh.setMatrixAt(idx, dummy.matrix);
    windowBandMesh.setMatrixAt(idx, dummy.matrix);
    roofMesh.setMatrixAt(idx, dummy.matrix);
    wallMesh.setColorAt(idx, new THREE.Color(h.wallCol));
    roofMesh.setColorAt(idx, new THREE.Color(h.roofCol));
  });
  plinthMesh.instanceMatrix.needsUpdate = true;
  wallMesh.instanceMatrix.needsUpdate = true;
  balconyMesh.instanceMatrix.needsUpdate = true;
  windowBandMesh.instanceMatrix.needsUpdate = true;
  roofMesh.instanceMatrix.needsUpdate = true;
  if (wallMesh.instanceColor) wallMesh.instanceColor.needsUpdate = true;
  if (roofMesh.instanceColor) roofMesh.instanceColor.needsUpdate = true;
  plinthMesh.computeBoundingSphere();
  wallMesh.computeBoundingSphere();
  balconyMesh.computeBoundingSphere();
  windowBandMesh.computeBoundingSphere();
  roofMesh.computeBoundingSphere();
  scene.add(plinthMesh, wallMesh, balconyMesh, windowBandMesh, roofMesh);

  // Streetlights along Urdaibai towns & harbors
  if (streetLampPositions.length > 0) {
    const lampPoleGeo = new THREE.CylinderGeometry(0.11, 0.16, 4.6, 6);
    lampPoleGeo.translate(0, 2.3, 0);
    const lampBulbGeo = new THREE.SphereGeometry(0.32, 8, 6);
    lampBulbGeo.translate(0, 4.75, 0);

    const lampPoles = new THREE.InstancedMesh(
      lampPoleGeo,
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.35 }),
      streetLampPositions.length,
    );
    const lampBulbs = new THREE.InstancedMesh(
      lampBulbGeo,
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfbbf24, emissiveIntensity: 1.6 }),
      streetLampPositions.length,
    );
    streetLampPositions.forEach(([lx, ly, lz], idx) => {
      dummy.position.set(lx, ly - 0.05, lz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      lampPoles.setMatrixAt(idx, dummy.matrix);
      lampBulbs.setMatrixAt(idx, dummy.matrix);
    });
    lampPoles.instanceMatrix.needsUpdate = true;
    lampBulbs.instanceMatrix.needsUpdate = true;
    lampPoles.computeBoundingSphere();
    lampBulbs.computeBoundingSphere();
    scene.add(lampPoles, lampBulbs);
  }

  // 6. Parked World Vehicles across Urdaibai (GTA-style!)
  const parkedVehicles: ParkedVehicle[] = [
    { id: 'pv-car-mundaka', vehicle: 'car', x: -102, z: -182, yaw: 0.5, label: 'Autoa (Mundaka)' },
    { id: 'pv-scooter-mundaka', vehicle: 'scooter', x: -122, z: -196, yaw: 1.2, label: 'Patinetea (Mundaka)' },
    { id: 'pv-kayak-laida', vehicle: 'kayak', x: 32, z: -175, yaw: -0.4, label: 'Piragua (Laida)' },
    { id: 'pv-bike-sukarrieta', vehicle: 'bike', x: -86, z: 32, yaw: 1.5, label: 'Bizikleta (Sukarrieta)' },
    { id: 'pv-bike-busturia', vehicle: 'bike', x: -88, z: 168, yaw: 0.2, label: 'Bizikleta (Busturia)' },
    { id: 'pv-car-arteaga', vehicle: 'car', x: 144, z: 266, yaw: -0.6, label: 'Autoa (Arteaga)' },
    { id: 'pv-moto-elantxobe', vehicle: 'moto', x: 556, z: -236, yaw: -1.8, label: 'Motoa (Elantxobe)' },
    { id: 'pv-moto-gaztelu', vehicle: 'moto', x: -578, z: -400, yaw: -0.2, label: 'Motoa (Gaztelugatxe)' },
    { id: 'pv-heli-bermeo', vehicle: 'heli', x: -355, z: -328, yaw: 0.8, label: 'Helikopteroa (Bermeo)' },
    { id: 'pv-plane-gernika', vehicle: 'plane', x: 45, z: 485, yaw: 0.0, label: 'Hegazkina (Gernika)' },
    { id: 'pv-para-ogono', vehicle: 'paraglider', x: 468, z: -308, yaw: -2.6, label: 'Parapentea (Ogoño)' },
    { id: 'pv-para-atxarre', vehicle: 'paraglider', x: 208, z: 38, yaw: -0.4, label: 'Parapentea (Atxarre)' },
  ];

  const parkedMeshes = new Map<string, THREE.Group>();
  for (const pv of parkedVehicles) {
    const rig = buildVehicleMesh(pv.vehicle, textures.contactShadowMap);
    const py = pv.vehicle === 'kayak' ? Math.max(WATER_LEVEL, getTerrainHeight(pv.x, pv.z)) : getTerrainHeight(pv.x, pv.z);
    rig.root.position.set(pv.x, py, pv.z);
    rig.root.rotation.y = pv.yaw;
    scene.add(rig.root);
    parkedMeshes.set(pv.id, rig.root);
  }

  // 7. Landmark Discovery Floating Beacon Markers
  const landmarkBeacons = new Map<string, THREE.Mesh>();
  const beaconGeo = new THREE.OctahedronGeometry(1.6, 0);
  for (const lm of URDAIBAI_LANDMARKS) {
    const isInitial = lm.id === 'mundaka';
    const beaconMat = new THREE.MeshStandardMaterial({
      color: isInitial ? 0x10b981 : 0xf59e0b,
      emissive: isInitial ? 0x059669 : 0xd97706,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: isInitial ? 0.45 : 0.88,
      roughness: 0.2,
      metalness: 0.3,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    const ly = getTerrainHeight(lm.x, lm.z);
    beacon.position.set(lm.x, ly + 8.5, lm.z);
    scene.add(beacon);
    landmarkBeacons.set(lm.id, beacon);
  }

  return {
    waterMaterialUniforms,
    waterMat,
    roadMat,
    landmarkBeacons,
    parkedMeshes,
    parkedVehicles,
    windsock,
    beaconLight,
    euskotrenTrain,
    sailboats,
    seagulls,
    cloudsGroup,
    cloudMat,
    rainLines,
    rainMat,
    waveCrests,
  };
}
