import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  URDAIBAI_LANDMARKS,
  WATER_LEVEL,
  getEuskotrenPose,
  getTerrainHeight,
  getThermalLift,
  getZoneAt,
  worldToLatLng,
  type VehicleId,
} from '../world/urdaibaiMap';
import {
  type InputState,
  type ParkedVehicle,
  type PlayerState,
  VEHICLE_SPECS,
  createInitialPlayerState,
  findNearestParkedVehicle,
  stepPlayerPhysics,
  switchVehicleState,
} from '../physics/vehiclePhysics';
import { createProceduralTextures } from './textures';
import { type AnimatedActorRig, buildVehicleMesh } from './vehicleModels';
import { type WorldHandles, buildUrdaibaiWorld } from './worldBuilder';
import { SoundEngine } from '../audio/soundEngine';
import type { RadioStationId } from '../audio/radioEngine';
import {
  WEATHER_PRESETS,
  type WeatherCondition,
  lerpScalar,
  nextWeatherCondition,
} from '../world/weatherSystem';

export type GameMode = 'title' | 'playing' | 'paused';
export type CameraPreset = 'chase' | 'wide' | 'aerial';

export interface HudSnapshot {
  speedKmh: number;
  altitudeM: number;
  yawDeg: number;
  x: number;
  z: number;
  lat: number;
  lng: number;
  zoneName: string;
  zoneSubtitle: string;
  vehicle: VehicleId;
  nearbyVehicle: ParkedVehicle | null;
  discoveredIds: string[];
  justDiscoveredName: string | null;
  cameraPreset: CameraPreset;
  inThermal: boolean;
  radioStation: RadioStationId;
  weather: WeatherCondition;
}

const _camDesired = new THREE.Vector3();
const _lookDesired = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class UrdaibaiSceneController {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private sky: Sky;
  private fog: THREE.FogExp2;
  private isSoftwareGl: boolean;
  private world: WorldHandles;
  private sound = new SoundEngine();

  private playerState: PlayerState;
  private rigs = new Map<VehicleId, AnimatedActorRig>();
  private activeRig: AnimatedActorRig;
  private discovered = new Set<string>(['mundaka']);
  private justDiscoveredName: string | null = null;
  private discoveredTimer = 0;

  private mode: GameMode = 'title';
  private cameraPreset: CameraPreset = 'chase';
  private keys = new Set<string>();
  private touchInput: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jumpOrUp: false,
    downOrSprint: false,
    pitchUp: false,
    pitchDown: false,
  };
  private cameraPos = new THREE.Vector3();
  private cameraLook = new THREE.Vector3();
  private titleTime = 0;
  private worldTime = 0;
  private trainPhase = 0.18;

  private weatherFrom: WeatherCondition = 'sunny';
  private weatherTarget: WeatherCondition = 'sunny';
  private weatherBlend = 1;
  private weatherAutoTimer = 0;
  private tmpColorA = new THREE.Color();
  private tmpColorB = new THREE.Color();
  private sunOffsetDir = new THREE.Vector3();

  private rafId = 0;
  private timerId = 0;
  private lastTime = 0;
  private hudEmitAccum = 0;
  private disposed = false;

  private onHudUpdate: (snapshot: HudSnapshot) => void;
  private onModeChange: (mode: GameMode) => void;

  constructor(
    container: HTMLElement,
    initialMode: GameMode,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    onModeChange: (mode: GameMode) => void,
  ) {
    this.container = container;
    this.mode = initialMode;
    this.onHudUpdate = onHudUpdate;
    this.onModeChange = onModeChange;
    this.isSoftwareGl = detectSoftwareGl();

    // 1. Renderer setup per Three.js skill (software-WebGL safe)
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 2. Scene, Sky & Environment Map (RoomEnvironment on every device)
    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0xb8d8ec);
    this.scene.background = skyColor;
    this.fog = new THREE.FogExp2(0xc4dfee, 0.00072);
    this.scene.fog = this.fog;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const sky = new Sky();
    sky.scale.setScalar(10000);
    const skyUniforms = sky.material.uniforms;
    skyUniforms.turbidity.value = 4.2;
    skyUniforms.rayleigh.value = 1.38;
    skyUniforms.mieCoefficient.value = 0.004;
    skyUniforms.mieDirectionalG.value = 0.82;
    const sunPos = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(62), THREE.MathUtils.degToRad(210));
    skyUniforms.sunPosition.value.copy(sunPos);
    this.sunOffsetDir.copy(sunPos);
    this.scene.add(sky);
    this.sky = sky;

    // 3. Warm/Cool 3-Point Outdoor Lighting
    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x3f6212, 0.78);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    const sunLight = new THREE.DirectionalLight(0xfff4d6, 2.35);
    sunLight.position.copy(sunPos).multiplyScalar(320);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 20;
    sunLight.shadow.camera.far = 520;
    const d = 110;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);
    this.scene.add(sunLight.target);
    this.sunLight = sunLight;

    // 4. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.5,
      3600,
    );

    // 5. Build Urdaibai World & All 9 Vehicle/Character Rigs
    const textures = createProceduralTextures(this.renderer.capabilities.getMaxAnisotropy());
    this.world = buildUrdaibaiWorld(this.scene, textures, this.isSoftwareGl);

    const vehicles: VehicleId[] = ['onfoot', 'car', 'moto', 'bike', 'scooter', 'kayak', 'plane', 'heli', 'paraglider'];
    for (const v of vehicles) {
      const rig = buildVehicleMesh(v, textures.contactShadowMap);
      rig.root.visible = false;
      this.scene.add(rig.root);
      this.rigs.set(v, rig);
    }

    // Spawn player in Mundaka facing NE toward Laida & Izaro Island
    const startY = getTerrainHeight(-115, -195);
    this.playerState = createInitialPlayerState(-115, -195, startY);
    this.activeRig = this.rigs.get('onfoot')!;
    this.activeRig.root.visible = true;
    this.syncRigTransform(0);

    // Initial camera framing
    this.cameraPos.set(-125, startY + 12, -208);
    this.cameraLook.set(-60, startY + 2, -160);
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraLook);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleBlur);

    this.lastTime = performance.now();
    this.emitHud();
    this.scheduleNextTick();
  }

  public setMode(next: GameMode): void {
    this.mode = next;
    if (next === 'playing') {
      this.sound.unlock();
      this.keys.clear();
      // Snap camera smoothly behind player when leaving title flyover
      const fx = Math.sin(this.playerState.yaw);
      const fz = Math.cos(this.playerState.yaw);
      this.cameraPos.set(
        this.playerState.x - fx * 11,
        this.playerState.y + 5.2,
        this.playerState.z - fz * 11,
      );
    } else if (next === 'paused') {
      this.keys.clear();
    }
  }

  public switchVehicle(vehicle: VehicleId): void {
    if (this.playerState.vehicle === vehicle) return;
    this.activeRig.root.visible = false;
    const groundY = getTerrainHeight(this.playerState.x, this.playerState.z);
    this.playerState = switchVehicleState(this.playerState, vehicle, groundY);
    this.activeRig = this.rigs.get(vehicle)!;
    this.activeRig.root.visible = true;
    this.sound.playChime('vehicle');
    this.syncRigTransform(0);
    this.emitHud();
  }

  public interactNearestVehicle(): void {
    if (this.playerState.vehicle !== 'onfoot') {
      this.switchVehicle('onfoot');
      return;
    }
    const near = findNearestParkedVehicle(this.playerState.x, this.playerState.z, this.world.parkedVehicles, 11);
    if (near) {
      this.switchVehicle(near.vehicle);
    }
  }

  public teleportToLandmark(landmarkId: string, suggestedVehicle?: VehicleId): void {
    const lm = URDAIBAI_LANDMARKS.find((l) => l.id === landmarkId);
    if (!lm) return;

    this.playerState.x = lm.x;
    this.playerState.z = lm.z;
    this.playerState.vx = 0;
    this.playerState.vy = 0;
    this.playerState.vz = 0;
    const gy = Math.max(WATER_LEVEL, getTerrainHeight(lm.x, lm.z));
    this.playerState.y = gy;
    this.playerState.grounded = true;

    if (suggestedVehicle) {
      this.activeRig.root.visible = false;
      this.playerState = switchVehicleState(this.playerState, suggestedVehicle, gy);
      this.activeRig = this.rigs.get(suggestedVehicle)!;
      this.activeRig.root.visible = true;
    }

    if (!this.discovered.has(lm.id)) {
      this.discovered.add(lm.id);
      this.justDiscoveredName = lm.name;
      this.discoveredTimer = 3.2;
      this.sound.playChime('discover');
    }

    const fx = Math.sin(this.playerState.yaw);
    const fz = Math.cos(this.playerState.yaw);
    this.cameraPos.set(this.playerState.x - fx * 12, this.playerState.y + 7, this.playerState.z - fz * 12);
    this.syncRigTransform(0);
    this.emitHud();
  }

  public cycleCameraPreset(): CameraPreset {
    const order: CameraPreset[] = ['chase', 'wide', 'aerial'];
    const idx = order.indexOf(this.cameraPreset);
    this.cameraPreset = order[(idx + 1) % order.length];
    this.emitHud();
    return this.cameraPreset;
  }

  public toggleMute(): boolean {
    const muted = this.sound.toggleMute();
    return muted;
  }

  public setRadioStation(id: RadioStationId): void {
    this.sound.setRadioStation(id);
    this.sound.playChime('vehicle');
    this.emitHud();
  }

  public cycleRadioStation(): RadioStationId {
    const next = this.sound.cycleRadioStation();
    this.sound.playChime('vehicle');
    this.emitHud();
    return next;
  }

  public setWeather(next: WeatherCondition): void {
    if (this.weatherTarget === next) return;
    this.weatherFrom = this.weatherTarget;
    this.weatherTarget = next;
    this.weatherBlend = 0;
    this.weatherAutoTimer = 0;
    this.sound.playChime('vehicle');
    this.emitHud();
  }

  public cycleWeather(): WeatherCondition {
    const next = nextWeatherCondition(this.weatherTarget);
    this.setWeather(next);
    return next;
  }

  public setTouchInput(partial: Partial<InputState>): void {
    Object.assign(this.touchInput, partial);
  }

  public resetPlayer(): void {
    this.activeRig.root.visible = false;
    const startY = getTerrainHeight(-115, -195);
    this.playerState = createInitialPlayerState(-115, -195, startY);
    this.activeRig = this.rigs.get('onfoot')!;
    this.activeRig.root.visible = true;
    this.syncRigTransform(0);
    this.emitHud();
  }

  private handleResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleBlur = (): void => {
    this.keys.clear();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    this.keys.add(code);

    if (this.mode === 'title') {
      if (code === 'Enter' || code === 'Space') {
        e.preventDefault();
        this.onModeChange('playing');
      }
      return;
    }

    if (code === 'Escape' || code === 'KeyP') {
      e.preventDefault();
      this.onModeChange(this.mode === 'playing' ? 'paused' : 'playing');
      return;
    }

    if (this.mode !== 'playing') return;

    if (code === 'KeyF') {
      this.interactNearestVehicle();
    } else if (code === 'KeyC') {
      this.cycleCameraPreset();
    } else if (code === 'KeyN') {
      this.cycleRadioStation();
    } else if (code === 'KeyG') {
      this.cycleWeather();
    } else if (code === 'KeyR') {
      this.resetPlayer();
    } else if (code === 'Digit0') this.switchVehicle('onfoot');
    else if (code === 'Digit1') this.switchVehicle('car');
    else if (code === 'Digit2') this.switchVehicle('moto');
    else if (code === 'Digit3') this.switchVehicle('bike');
    else if (code === 'Digit4') this.switchVehicle('scooter');
    else if (code === 'Digit5') this.switchVehicle('kayak');
    else if (code === 'Digit6') this.switchVehicle('plane');
    else if (code === 'Digit7') this.switchVehicle('heli');
    else if (code === 'Digit8') this.switchVehicle('paraglider');
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private readInput(): InputState {
    return {
      forward: this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.touchInput.forward,
      backward: this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.touchInput.backward,
      left: this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.touchInput.left,
      right: this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.touchInput.right,
      jumpOrUp: this.keys.has('Space') || this.touchInput.jumpOrUp,
      downOrSprint: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchInput.downOrSprint,
      pitchUp: this.keys.has('ArrowUp') || this.keys.has('KeyQ') || this.touchInput.pitchUp,
      pitchDown: this.keys.has('ArrowDown') || this.keys.has('KeyE') || this.touchInput.pitchDown,
    };
  }

  private syncRigTransform(dt: number): void {
    const s = this.playerState;
    const rig = this.activeRig;
    rig.root.position.set(s.x, s.y, s.z);
    rig.root.rotation.order = 'YXZ';
    rig.root.rotation.y = s.yaw;
    rig.root.rotation.x = s.pitch;
    rig.root.rotation.z = s.roll;

    // Ground contact shadow projection height
    const groundY = Math.max(WATER_LEVEL, getTerrainHeight(s.x, s.z));
    const heightAbove = Math.max(0, s.y - groundY);
    rig.contactShadow.position.y = Math.min(0.03, -heightAbove + 0.03);
    (rig.contactShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, 0.48 - heightAbove * 0.015);

    if (s.vehicle === 'onfoot' && rig.leftArm && rig.rightArm && rig.leftLeg && rig.rightLeg) {
      const speed = Math.hypot(s.vx, s.vz);
      const swing = speed > 0.5 ? Math.sin(s.stridePhase) * Math.min(0.75, speed * 0.08) : 0;
      rig.leftLeg.rotation.x = swing;
      rig.rightLeg.rotation.x = -swing;
      rig.leftArm.rotation.x = -swing * 0.85;
      rig.rightArm.rotation.x = swing * 0.85;
    }

    if (rig.leanGroup) {
      rig.leanGroup.rotation.z = s.roll;
    }
    if (rig.frontSteerPivots) {
      for (const p of rig.frontSteerPivots) p.rotation.y = s.steerAngle;
    }
    if (rig.wheels) {
      for (const w of rig.wheels) w.rotation.x = s.wheelSpin;
    }
    if (rig.propeller) {
      rig.propeller.rotation.z = s.rotorAngle;
    }
    if (rig.mainRotor) {
      rig.mainRotor.rotation.y = s.rotorAngle;
    }
    if (rig.tailRotor) {
      rig.tailRotor.rotation.x = s.rotorAngle * 1.4;
    }
    if (rig.paddle) {
      rig.paddle.rotation.x = Math.sin(s.stridePhase) * 0.55;
      rig.paddle.rotation.z = Math.cos(s.stridePhase) * 0.22;
    }

    // Animate world beacons, windsock, lighthouse, sailboats, gulls & Mundaka surf waves
    this.world.windsock.rotation.y = Math.sin(this.worldTime * 1.3) * 0.25 - 0.8;
    this.world.beaconLight.rotation.y += dt * 2;
    this.world.sailboats.forEach((sb, idx) => {
      sb.position.y = WATER_LEVEL + 0.05 + Math.sin(this.worldTime * 1.6 + idx * 1.4) * 0.14;
      sb.rotation.z = Math.sin(this.worldTime * 1.2 + idx) * 0.04;
    });
    this.world.seagulls.forEach((gull, idx) => {
      const ang = this.worldTime * gull.speed + idx * 1.2;
      const nx = gull.cx + Math.cos(ang) * gull.radius;
      const nz = gull.cz + Math.sin(ang) * gull.radius;
      gull.group.position.set(nx, gull.y + Math.sin(this.worldTime * 1.8 + idx) * 1.6, nz);
      gull.group.rotation.y = -ang + (gull.speed > 0 ? 0 : Math.PI);
      const flap = Math.sin(this.worldTime * 7.5 + idx * 2.1) * 0.42;
      gull.leftWing.rotation.z = flap;
      gull.rightWing.rotation.z = -flap;
    });
    this.world.waveCrests.forEach((wv, idx) => {
      wv.position.y = WATER_LEVEL + 0.22 + Math.sin(this.worldTime * 2.1 - idx * 0.9) * 0.25;
      wv.scale.z = 0.85 + Math.sin(this.worldTime * 2.1 - idx * 0.9) * 0.35;
    });
  }

  private updateCamera(dt: number): void {
    if (this.mode === 'title') {
      this.titleTime += dt;
      // Live World Camera Tour flying gently across Urdaibai estuary, Mundaka, Laida & Izaro
      const angle = this.titleTime * 0.075;
      const cx = -30 + Math.cos(angle) * 235;
      const cz = -220 + Math.sin(angle) * 165;
      const groundH = Math.max(WATER_LEVEL, getTerrainHeight(cx, cz));
      this.cameraPos.set(cx, groundH + 58 + Math.sin(angle * 2) * 14, cz);
      this.cameraLook.set(-20, 12, -230);
      this.camera.position.copy(this.cameraPos);
      this.camera.lookAt(this.cameraLook);
      return;
    }

    const s = this.playerState;
    const fx = Math.sin(s.yaw);
    const fz = Math.cos(s.yaw);

    const isAir = s.vehicle === 'plane' || s.vehicle === 'heli' || s.vehicle === 'paraglider';
    let dist = isAir ? 15 : s.vehicle === 'car' ? 9.5 : 6.8;
    let height = isAir ? 5.2 : s.vehicle === 'car' ? 3.8 : 2.9;

    if (this.cameraPreset === 'wide') {
      dist *= 1.65;
      height *= 1.55;
    } else if (this.cameraPreset === 'aerial') {
      dist = 24;
      height = 28;
    }

    _camDesired.set(s.x - fx * dist, s.y + height, s.z - fz * dist);

    // Prevent camera from dipping below terrain or water surface
    const camGround = Math.max(WATER_LEVEL + 1.2, getTerrainHeight(_camDesired.x, _camDesired.z) + 1.8);
    if (_camDesired.y < camGround) {
      _camDesired.y = camGround;
    }

    _lookDesired.set(s.x + fx * 6, s.y + (isAir ? 1.5 : 1.3), s.z + fz * 6);

    const alpha = 1 - Math.exp(-7.5 * dt);
    this.cameraPos.lerp(_camDesired, alpha);
    this.cameraLook.lerp(_lookDesired, alpha);

    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraLook);

    // Subtle speed FOV kick
    const targetFov = 58 + Math.min(18, s.speedKmh * 0.085);
    if (Math.abs(this.camera.fov - targetFov) > 0.08) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 1 - Math.exp(-5 * dt));
      this.camera.updateProjectionMatrix();
    }

    // Keep shadow frustum centered near player
    this.sunLight.target.position.set(s.x, s.y, s.z);
    this.sunLight.position.set(
      s.x + this.sunOffsetDir.x * 240,
      s.y + Math.max(85, this.sunOffsetDir.y * 280),
      s.z + this.sunOffsetDir.z * 240,
    );
    void _rayOrigin;
    void _rayDir;
  }

  private updateWeatherSystem(dt: number): void {
    // Auto-cycle weather gently every ~75s during active play
    if (this.mode === 'playing') {
      this.weatherAutoTimer += dt;
      if (this.weatherAutoTimer >= 75) {
        this.weatherAutoTimer = 0;
        this.weatherFrom = this.weatherTarget;
        this.weatherTarget = nextWeatherCondition(this.weatherTarget);
        this.weatherBlend = 0;
        this.emitHud();
      }
    }

    if (this.weatherBlend < 1) {
      this.weatherBlend = Math.min(1, this.weatherBlend + dt * 0.32);
    }

    const fromP = WEATHER_PRESETS[this.weatherFrom];
    const toP = WEATHER_PRESETS[this.weatherTarget];
    const t = this.weatherBlend;

    const skyUniforms = this.sky.material.uniforms;
    skyUniforms.turbidity.value = lerpScalar(fromP.skyTurbidity, toP.skyTurbidity, t);
    skyUniforms.rayleigh.value = lerpScalar(fromP.skyRayleigh, toP.skyRayleigh, t);
    skyUniforms.mieCoefficient.value = lerpScalar(
      this.weatherFrom === 'sunny' ? 0.004 : this.weatherFrom === 'cloudy' ? 0.022 : 0.055,
      this.weatherTarget === 'sunny' ? 0.004 : this.weatherTarget === 'cloudy' ? 0.022 : 0.055,
      t,
    );
    const elevDeg = lerpScalar(fromP.sunElevationDeg, toP.sunElevationDeg, t);
    this.sunOffsetDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevDeg), THREE.MathUtils.degToRad(210));
    skyUniforms.sunPosition.value.copy(this.sunOffsetDir);

    this.sunLight.intensity = lerpScalar(fromP.sunIntensity, toP.sunIntensity, t);
    this.hemiLight.intensity = lerpScalar(fromP.hemiIntensity, toP.hemiIntensity, t);
    this.renderer.toneMappingExposure = lerpScalar(fromP.exposure, toP.exposure, t);

    this.fog.density = lerpScalar(fromP.fogDensity, toP.fogDensity, t);
    this.tmpColorA.setHex(fromP.fogColorHex);
    this.tmpColorB.setHex(toP.fogColorHex);
    this.fog.color.copy(this.tmpColorA).lerp(this.tmpColorB, t);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(this.fog.color);
    }

    this.tmpColorA.setHex(fromP.waterColorHex);
    this.tmpColorB.setHex(toP.waterColorHex);
    this.world.waterMat.color.copy(this.tmpColorA).lerp(this.tmpColorB, t);

    this.world.cloudMat.opacity = lerpScalar(fromP.cloudOpacity, toP.cloudOpacity, t);
    this.tmpColorA.setHex(fromP.cloudColorHex);
    this.tmpColorB.setHex(toP.cloudColorHex);
    this.world.cloudMat.color.copy(this.tmpColorA).lerp(this.tmpColorB, t);
    this.world.cloudsGroup.children.forEach((cl, idx) => {
      cl.position.x += dt * (2.6 + (idx % 3) * 0.8);
      if (cl.position.x > 820) cl.position.x = -820;
    });

    this.world.roadMat.roughness = lerpScalar(fromP.roadRoughness, toP.roadRoughness, t);

    // Rain particle streaks centered around camera
    const rainAmt = lerpScalar(fromP.rainIntensity, toP.rainIntensity, t);
    if (rainAmt > 0.03) {
      this.world.rainLines.visible = true;
      this.world.rainMat.opacity = rainAmt * 0.82;
      this.world.rainLines.position.set(this.cameraPos.x, Math.max(0, this.cameraPos.y - 24), this.cameraPos.z);
      const posAttr = this.world.rainLines.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const fall = dt * 44;
      for (let i = 0; i < arr.length; i += 6) {
        arr[i + 1] -= fall;
        arr[i + 4] -= fall;
        if (arr[i + 1] < 0) {
          const ny = 50 + (i % 7);
          arr[i + 1] = ny;
          arr[i + 4] = ny - 3.4;
        }
      }
      posAttr.needsUpdate = true;
    } else {
      this.world.rainLines.visible = false;
    }
  }

  private checkLandmarkDiscovery(dt: number): void {
    if (this.discoveredTimer > 0) {
      this.discoveredTimer = Math.max(0, this.discoveredTimer - dt);
      if (this.discoveredTimer === 0) this.justDiscoveredName = null;
    }

    for (const lm of URDAIBAI_LANDMARKS) {
      const ring = this.world.landmarkBeacons.get(lm.id);
      if (ring) {
        ring.rotation.y += dt * 1.4;
      }
      if (!this.discovered.has(lm.id)) {
        const d = Math.hypot(this.playerState.x - lm.x, this.playerState.z - lm.z);
        if (d < 28) {
          this.discovered.add(lm.id);
          this.justDiscoveredName = lm.name;
          this.discoveredTimer = 3.2;
          this.sound.playChime('discover');
          if (ring) {
            const mat = ring.material as THREE.MeshStandardMaterial;
            mat.color.setHex(0x10b981);
            mat.emissive.setHex(0x059669);
            mat.opacity = 0.25;
          }
        }
      }
    }
  }

  private emitHud(): void {
    const s = this.playerState;
    const zone = getZoneAt(s.x, s.z);
    const coords = worldToLatLng(s.x, s.z);
    const nearby =
      s.vehicle === 'onfoot'
        ? findNearestParkedVehicle(s.x, s.z, this.world.parkedVehicles, 11)
        : null;
    const inThermal = s.vehicle === 'paraglider' && getThermalLift(s.x, s.z, s.y) > 0.5;

    this.onHudUpdate({
      speedKmh: s.speedKmh,
      altitudeM: s.altitudeM,
      yawDeg: Math.round(((s.yaw * 180) / Math.PI + 360) % 360),
      x: s.x,
      z: s.z,
      lat: coords.lat,
      lng: coords.lng,
      zoneName: zone.name,
      zoneSubtitle: zone.subtitle,
      vehicle: s.vehicle,
      nearbyVehicle: nearby,
      discoveredIds: Array.from(this.discovered),
      justDiscoveredName: this.justDiscoveredName,
      cameraPreset: this.cameraPreset,
      inThermal,
      radioStation: this.sound.getRadioStation(),
      weather: this.weatherTarget,
    });
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.timerId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.timerId = window.setTimeout(cb, 80);
      }
    };
    this.timerId = window.setTimeout(poll, 5);
  }

  private scheduleNextTick(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private tick = (): void => {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.worldTime += dt;
    this.world.waterMaterialUniforms.uTime.value += dt;
    this.trainPhase = (this.trainPhase + dt * 0.012) % 1;
    const trainPose = getEuskotrenPose(this.trainPhase);
    this.world.euskotrenTrain.position.set(trainPose.x, trainPose.y, trainPose.z);
    this.world.euskotrenTrain.rotation.y = trainPose.yaw;

    this.updateWeatherSystem(dt);

    if (this.mode === 'playing') {
      const input = this.readInput();
      this.playerState = stepPlayerPhysics(
        this.playerState,
        input,
        dt,
        getTerrainHeight,
        getThermalLift,
      );
      this.syncRigTransform(dt);
      this.checkLandmarkDiscovery(dt);
      this.sound.update(
        this.playerState.vehicle,
        this.playerState.speedKmh,
        this.playerState.altitudeM,
        false,
        dt,
        this.weatherTarget,
      );
      this.hudEmitAccum += dt;
      if (this.hudEmitAccum >= 0.1) {
        this.hudEmitAccum = 0;
        this.emitHud();
      }
    } else {
      this.titleTime += dt;
      this.sound.update(this.playerState.vehicle, 0, 0, true, dt, this.weatherTarget);
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextTick();
  };

  public getVehicleName(id: VehicleId): string {
    return VEHICLE_SPECS[id].name;
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.timerId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleBlur);
    this.sound.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
