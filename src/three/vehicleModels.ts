import * as THREE from 'three';
import type { VehicleId } from '../world/urdaibaiMap';

export interface AnimatedActorRig {
  root: THREE.Group;
  contactShadow: THREE.Mesh;
  // Character limbs
  leftArm?: THREE.Mesh;
  rightArm?: THREE.Mesh;
  leftLeg?: THREE.Mesh;
  rightLeg?: THREE.Mesh;
  // Vehicle animatable parts
  wheels?: THREE.Group[];
  frontSteerPivots?: THREE.Group[];
  propeller?: THREE.Group;
  mainRotor?: THREE.Group;
  tailRotor?: THREE.Group;
  paddle?: THREE.Group;
  leanGroup?: THREE.Group;
}

function makeContactShadow(shadowTex: THREE.Texture, radiusX: number, radiusZ: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(radiusX * 2, radiusZ * 2);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.025;
  return mesh;
}

function makeWheel(radius: number, width: number): THREE.Group {
  const g = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e2228, roughness: 0.85, metalness: 0.05 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd0d7e2, roughness: 0.25, metalness: 0.88 });

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  g.add(tire);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width + 0.02, 12), rimMat);
  rim.rotation.z = Math.PI / 2;
  g.add(rim);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, width + 0.05, 8), tireMat);
  hub.rotation.z = Math.PI / 2;
  g.add(hub);

  return g;
}

export function buildCharacterMesh(shadowTex: THREE.Texture): AnimatedActorRig {
  const root = new THREE.Group();
  const contactShadow = makeContactShadow(shadowTex, 0.75, 0.75);
  root.add(contactShadow);

  const jacketMat = new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.65, metalness: 0.05 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.8, metalness: 0.05 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.6, metalness: 0.0 });
  const packMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.75, metalness: 0.05 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.15, metalness: 0.7 });

  // Legs (bottom-center pivot at y=0)
  const legGeo = new THREE.BoxGeometry(0.24, 0.78, 0.26);
  legGeo.translate(0, -0.39, 0);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.16, 0.78, 0);
  leftLeg.castShadow = true;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.16, 0.78, 0);
  rightLeg.castShadow = true;
  root.add(rightLeg);

  // Torso jacket
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.34), jacketMat);
  torso.position.set(0, 1.14, 0);
  torso.castShadow = true;
  root.add(torso);

  // Explorer backpack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.22), packMat);
  pack.position.set(0, 1.16, -0.25);
  pack.castShadow = true;
  root.add(pack);

  // Head + shades
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skinMat);
  head.position.set(0, 1.72, 0);
  head.castShadow = true;
  root.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.12), visorMat);
  visor.position.set(0, 1.75, 0.17);
  root.add(visor);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.18, 0.64, 0.18);
  armGeo.translate(0, -0.28, 0);
  const leftArm = new THREE.Mesh(armGeo, jacketMat);
  leftArm.position.set(-0.42, 1.44, 0);
  leftArm.castShadow = true;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, jacketMat);
  rightArm.position.set(0.42, 1.44, 0);
  rightArm.castShadow = true;
  root.add(rightArm);

  return { root, contactShadow, leftArm, rightArm, leftLeg, rightLeg };
}

export function buildVehicleMesh(vehicleId: VehicleId, shadowTex: THREE.Texture): AnimatedActorRig {
  if (vehicleId === 'onfoot') {
    return buildCharacterMesh(shadowTex);
  }

  const root = new THREE.Group();

  if (vehicleId === 'car') {
    const contactShadow = makeContactShadow(shadowTex, 1.6, 2.7);
    root.add(contactShadow);

    const paintMat = new THREE.MeshPhysicalMaterial({
      color: 0xd9381e,
      roughness: 0.22,
      metalness: 0.65,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.72, metalness: 0.25 });
    const headLightMat = new THREE.MeshStandardMaterial({
      color: 0xfff8dc,
      emissive: 0xfff2b2,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    });
    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xdc2626,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });

    // Extruded GT silhouette along X-axis then rotated to face +Z
    const shape = new THREE.Shape();
    shape.moveTo(-2.15, 0.34);
    shape.lineTo(2.15, 0.34);
    shape.lineTo(2.12, 0.68);
    shape.lineTo(1.15, 0.86);
    shape.lineTo(0.45, 1.32);
    shape.lineTo(-1.05, 1.32);
    shape.lineTo(-1.82, 0.94);
    shape.lineTo(-2.15, 0.82);
    shape.closePath();

    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 1.72,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
    });
    bodyGeo.translate(0, 0, -0.86);
    bodyGeo.rotateY(-Math.PI / 2); // X+ becomes Z+ (front)
    const body = new THREE.Mesh(bodyGeo, paintMat);
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Tinted cabin canopy + sloped rear glass
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.42, 1.56), glassMat);
    cabin.position.set(0, 1.15, -0.24);
    root.add(cabin);

    // Bumpers, twin exhausts & rear spoiler
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.22, 0.22), trimMat);
    frontBumper.position.set(0, 0.38, 2.15);
    root.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.24, 0.2), trimMat);
    rearBumper.position.set(0, 0.4, -2.14);
    root.add(rearBumper);

    for (const ex of [-0.48, 0.48]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 8), trimMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(ex, 0.34, -2.22);
      root.add(pipe);
    }

    const rearSpoiler = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.08, 0.32), trimMat);
    rearSpoiler.position.set(0, 1.06, -1.96);
    root.add(rearSpoiler);

    // Headlights & Taillights
    for (const sx of [-0.66, 0.66]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.08), headLightMat);
      hl.position.set(sx, 0.66, 2.16);
      root.add(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.08), tailLightMat);
      tl.position.set(sx, 0.74, -2.16);
      root.add(tl);
    }

    // 4 Wheels with front steer pivots
    const wheels: THREE.Group[] = [];
    const frontSteerPivots: THREE.Group[] = [];
    const wheelCoords: Array<[number, number, boolean]> = [
      [-0.9, 1.32, true],
      [0.9, 1.32, true],
      [-0.9, -1.32, false],
      [0.9, -1.32, false],
    ];
    for (const [wx, wz, isFront] of wheelCoords) {
      const pivot = new THREE.Group();
      pivot.position.set(wx, 0.38, wz);
      const wheel = makeWheel(0.38, 0.26);
      pivot.add(wheel);
      root.add(pivot);
      wheels.push(wheel);
      if (isFront) frontSteerPivots.push(pivot);
    }

    return { root, contactShadow, wheels, frontSteerPivots };
  }

  if (vehicleId === 'moto') {
    const contactShadow = makeContactShadow(shadowTex, 0.8, 1.6);
    root.add(contactShadow);

    const leanGroup = new THREE.Group();
    root.add(leanGroup);

    const fairingMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.6,
      clearcoat: 1.0,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff5cc, emissiveIntensity: 1.8 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 1.35), fairingMat);
    chassis.position.set(0, 0.68, 0.05);
    chassis.castShadow = true;
    leanGroup.add(chassis);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.68), seatMat);
    seat.position.set(0, 0.88, -0.28);
    leanGroup.add(seat);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.8, 10), frameMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.24, 0.42, -0.55);
    leanGroup.add(exhaust);

    // Front steer fork + handlebars + headlight
    const steerPivot = new THREE.Group();
    steerPivot.position.set(0, 0.72, 0.68);
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.78, 8), frameMat);
    fork.rotation.x = -0.3;
    steerPivot.add(fork);

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.76, 8), frameMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 0.34, -0.1);
    steerPivot.add(handlebar);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), lightMat);
    lamp.position.set(0, 0.2, 0.14);
    steerPivot.add(lamp);

    const frontWheel = makeWheel(0.36, 0.16);
    frontWheel.position.set(0, -0.36, 0.12);
    steerPivot.add(frontWheel);
    leanGroup.add(steerPivot);

    const rearWheel = makeWheel(0.36, 0.2);
    rearWheel.position.set(0, 0.36, -0.78);
    leanGroup.add(rearWheel);

    // Compact rider silhouette
    const rider = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.45, 6, 10), frameMat);
    rider.position.set(0, 1.24, -0.18);
    rider.rotation.x = 0.35;
    leanGroup.add(rider);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), fairingMat);
    helmet.position.set(0, 1.62, -0.02);
    leanGroup.add(helmet);

    return {
      root,
      contactShadow,
      leanGroup,
      wheels: [frontWheel, rearWheel],
      frontSteerPivots: [steerPivot],
    };
  }

  if (vehicleId === 'bike') {
    const contactShadow = makeContactShadow(shadowTex, 0.55, 1.35);
    root.add(contactShadow);
    const leanGroup = new THREE.Group();
    root.add(leanGroup);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35, metalness: 0.6 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });

    const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.86, 8), frameMat);
    topTube.rotation.x = Math.PI / 2;
    topTube.position.set(0, 0.78, 0);
    leanGroup.add(topTube);

    const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.64, 8), frameMat);
    seatTube.position.set(0, 0.62, -0.22);
    seatTube.rotation.x = -0.25;
    leanGroup.add(seatTube);

    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.28), darkMat);
    saddle.position.set(0, 0.96, -0.28);
    leanGroup.add(saddle);

    const steerPivot = new THREE.Group();
    steerPivot.position.set(0, 0.78, 0.45);
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 8), frameMat);
    fork.position.set(0, -0.15, 0.06);
    fork.rotation.x = -0.2;
    steerPivot.add(fork);

    const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8), darkMat);
    bars.rotation.z = Math.PI / 2;
    bars.position.set(0, 0.2, -0.02);
    steerPivot.add(bars);

    const fw = makeWheel(0.36, 0.08);
    fw.position.set(0, -0.42, 0.14);
    steerPivot.add(fw);
    leanGroup.add(steerPivot);

    const rw = makeWheel(0.36, 0.08);
    rw.position.set(0, 0.36, -0.58);
    leanGroup.add(rw);

    // Rider
    const rider = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.46, 6, 10), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 }));
    rider.position.set(0, 1.32, -0.15);
    rider.rotation.x = 0.25;
    leanGroup.add(rider);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), darkMat);
    helmet.position.set(0, 1.7, 0);
    leanGroup.add(helmet);

    return { root, contactShadow, leanGroup, wheels: [fw, rw], frontSteerPivots: [steerPivot] };
  }

  if (vehicleId === 'scooter') {
    const contactShadow = makeContactShadow(shadowTex, 0.45, 0.95);
    root.add(contactShadow);

    const deckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.78, metalness: 0.2 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.7 });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.92), deckMat);
    deck.position.set(0, 0.16, 0);
    deck.castShadow = true;
    root.add(deck);

    const steerPivot = new THREE.Group();
    steerPivot.position.set(0, 0.2, 0.44);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 1.05, 8), accentMat);
    stem.position.set(0, 0.52, -0.05);
    stem.rotation.x = -0.12;
    steerPivot.add(stem);

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), deckMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.04, -0.1);
    steerPivot.add(bar);

    const fw = makeWheel(0.14, 0.07);
    fw.position.set(0, -0.06, 0.04);
    steerPivot.add(fw);
    root.add(steerPivot);

    const rw = makeWheel(0.14, 0.07);
    rw.position.set(0, 0.14, -0.44);
    root.add(rw);

    // Standing rider
    const rider = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.58, 6, 10), new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.65 }));
    rider.position.set(0, 0.92, -0.05);
    root.add(rider);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.6 }));
    head.position.set(0, 1.46, 0);
    root.add(head);

    return { root, contactShadow, wheels: [fw, rw], frontSteerPivots: [steerPivot] };
  }

  if (vehicleId === 'kayak') {
    const contactShadow = makeContactShadow(shadowTex, 0.75, 2.3);
    root.add(contactShadow);

    const hullMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      roughness: 0.28,
      metalness: 0.1,
      clearcoat: 0.85,
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });

    // Tapered sea-kayak hull via LatheGeometry stretched on Z
    const profile = [
      new THREE.Vector2(0.01, -2.1),
      new THREE.Vector2(0.28, -1.3),
      new THREE.Vector2(0.42, 0),
      new THREE.Vector2(0.28, 1.3),
      new THREE.Vector2(0.01, 2.1),
    ];
    const hullGeo = new THREE.LatheGeometry(profile, 14);
    hullGeo.rotateX(Math.PI / 2);
    hullGeo.scale(1.0, 0.55, 1.0);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.24;
    hull.castShadow = true;
    root.add(hull);

    const cockpit = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 16), trimMat);
    cockpit.rotation.x = Math.PI / 2;
    cockpit.position.set(0, 0.44, -0.05);
    root.add(cockpit);

    // Seated paddler
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.38, 6, 10), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.6 }));
    torso.position.set(0, 0.68, -0.08);
    root.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.6 }));
    head.position.set(0, 1.06, -0.05);
    root.add(head);

    // Animated double-bladed paddle
    const paddle = new THREE.Group();
    paddle.position.set(0, 0.72, 0.14);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), trimMat);
    shaft.rotation.z = Math.PI / 2;
    paddle.add(shaft);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), bladeMat);
    b1.position.set(-1.12, 0, 0);
    paddle.add(b1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), bladeMat);
    b2.position.set(1.12, 0, 0);
    paddle.add(b2);
    root.add(paddle);

    return { root, contactShadow, paddle };
  }

  if (vehicleId === 'plane') {
    const contactShadow = makeContactShadow(shadowTex, 3.2, 2.8);
    root.add(contactShadow);

    const fuseMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.3, clearcoat: 0.9 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.4 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.2, clearcoat: 1.0 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.8 });

    // Fuselage
    const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(0.56, 3.3, 8, 14), fuseMat);
    fuse.rotation.x = Math.PI / 2;
    fuse.position.set(0, 1.05, 0);
    fuse.castShadow = true;
    root.add(fuse);

    // High main wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.14, 1.15), stripeMat);
    wing.position.set(0, 1.65, 0.2);
    wing.castShadow = true;
    root.add(wing);

    // Wing struts
    for (const sx of [-1.6, 1.6]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 6), metalMat);
      strut.position.set(sx * 0.65, 1.22, 0.2);
      strut.rotation.z = sx > 0 ? -0.65 : 0.65;
      root.add(strut);
    }

    // Tail fin & horizontal stabilizer
    const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 0.85), stripeMat);
    vTail.position.set(0, 1.72, -1.9);
    root.add(vTail);
    const hTail = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.09, 0.65), fuseMat);
    hTail.position.set(0, 1.2, -1.95);
    root.add(hTail);

    // Cockpit windshield
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.45, 0.95), glassMat);
    canopy.position.set(0, 1.38, 0.62);
    root.add(canopy);

    // Spinning propeller
    const propeller = new THREE.Group();
    propeller.position.set(0, 1.05, 2.24);
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 10), stripeMat);
    spinner.rotation.x = Math.PI / 2;
    propeller.add(spinner);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.14, 0.04), metalMat);
    propeller.add(blade);
    root.add(propeller);

    // Landing gear wheels
    const w1 = makeWheel(0.28, 0.16);
    w1.position.set(-0.78, 0.28, 0.55);
    root.add(w1);
    const w2 = makeWheel(0.28, 0.16);
    w2.position.set(0.78, 0.28, 0.55);
    root.add(w2);
    const w3 = makeWheel(0.16, 0.1);
    w3.position.set(0, 0.24, -1.85);
    root.add(w3);

    return { root, contactShadow, propeller, wheels: [w1, w2, w3] };
  }

  if (vehicleId === 'heli') {
    const contactShadow = makeContactShadow(shadowTex, 2.5, 2.8);
    root.add(contactShadow);

    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xeab308, roughness: 0.24, metalness: 0.35, clearcoat: 0.9 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.08, metalness: 0.25, clearcoat: 1.0 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.8 });

    // Cabin pod
    const pod = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 12), bodyMat);
    pod.scale.set(0.95, 0.95, 1.55);
    pod.position.set(0, 1.35, 0.3);
    pod.castShadow = true;
    root.add(pod);

    const noseGlass = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), glassMat);
    noseGlass.rotation.x = Math.PI / 2;
    noseGlass.position.set(0, 1.4, 0.68);
    root.add(noseGlass);

    // Tail boom + fin
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 2.9, 10), bodyMat);
    boom.rotation.x = Math.PI / 2;
    boom.position.set(0, 1.48, -1.9);
    root.add(boom);

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.55), bodyMat);
    tailFin.position.set(0, 1.85, -3.2);
    root.add(tailFin);

    // Skids
    for (const sx of [-0.82, 0.82]) {
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), metalMat);
      skid.rotation.x = Math.PI / 2;
      skid.position.set(sx, 0.14, 0.2);
      root.add(skid);
      const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6), metalMat);
      s1.position.set(sx * 0.85, 0.42, 0.8);
      root.add(s1);
      const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6), metalMat);
      s2.position.set(sx * 0.85, 0.42, -0.4);
      root.add(s2);
    }

    // Main 4-blade rotor
    const mainRotor = new THREE.Group();
    mainRotor.position.set(0, 2.52, 0.2);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 10), metalMat);
    mainRotor.add(hub);
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.04, 0.22), metalMat);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 6.2), metalMat);
    mainRotor.add(blade1, blade2);
    root.add(mainRotor);

    // Tail rotor
    const tailRotor = new THREE.Group();
    tailRotor.position.set(0.16, 1.9, -3.25);
    const tBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 0.12), metalMat);
    tailRotor.add(tBlade);
    root.add(tailRotor);

    return { root, contactShadow, mainRotor, tailRotor };
  }

  // Paraglider: arched colorful wing overhead + suspension risers + seated pilot
  const contactShadow = makeContactShadow(shadowTex, 1.4, 1.0);
  root.add(contactShadow);

  const wingMat1 = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.72, side: THREE.DoubleSide });
  const wingMat2 = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.72, side: THREE.DoubleSide });
  const harnessMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Seated pilot at bottom
  const harness = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.52), harnessMat);
  harness.position.set(0, 0.55, 0);
  harness.castShadow = true;
  root.add(harness);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), wingMat1);
  helmet.position.set(0, 1.06, 0.05);
  root.add(helmet);

  // Curved multi-cell airfoil canopy overhead (7 arched segments)
  const canopyGroup = new THREE.Group();
  canopyGroup.position.set(0, 3.85, 0);
  const segCount = 7;
  const radius = 2.6;
  for (let i = 0; i < segCount; i++) {
    const frac = (i - (segCount - 1) / 2) / ((segCount - 1) / 2); // -1 to +1
    const angle = frac * 0.78;
    const cell = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.18, 1.45),
      i % 2 === 0 ? wingMat1 : wingMat2,
    );
    cell.position.set(Math.sin(angle) * radius, (Math.cos(angle) - 1) * radius * 0.85, 0);
    cell.rotation.z = -angle;
    cell.castShadow = true;
    canopyGroup.add(cell);
  }
  root.add(canopyGroup);

  // Suspension lines
  const linePoints: THREE.Vector3[] = [];
  for (const sx of [-1.8, -0.9, 0.9, 1.8]) {
    linePoints.push(new THREE.Vector3(sx > 0 ? 0.22 : -0.22, 0.85, 0));
    linePoints.push(new THREE.Vector3(sx, 3.45, 0.35));
    linePoints.push(new THREE.Vector3(sx > 0 ? 0.22 : -0.22, 0.85, 0));
    linePoints.push(new THREE.Vector3(sx, 3.45, -0.35));
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.65 }));
  root.add(lines);

  return { root, contactShadow };
}
