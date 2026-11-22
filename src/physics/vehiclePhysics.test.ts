import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type InputState,
  createInitialPlayerState,
  findNearestParkedVehicle,
  stepPlayerPhysics,
  switchVehicleState,
} from './vehiclePhysics';
import { WATER_LEVEL, getTerrainHeight, getThermalLift, okaChannelCenterX } from '../world/urdaibaiMap';

const IDLE_INPUT: InputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jumpOrUp: false,
  downOrSprint: false,
  pitchUp: false,
  pitchDown: false,
};

test('Player survives first seconds idle on spawn without sinking or moving erratically', () => {
  const startY = getTerrainHeight(-115, -195);
  let state = createInitialPlayerState(-115, -195, startY);
  for (let i = 0; i < 60; i++) {
    state = stepPlayerPhysics(state, IDLE_INPUT, 1 / 60, getTerrainHeight, getThermalLift);
  }
  assert.equal(state.grounded, true);
  assert.ok(Math.abs(state.y - startY) < 0.25);
  assert.equal(state.speedKmh, 0);
});

test('Car accelerates, turns, and reaches high speed on road', () => {
  let state = createInitialPlayerState(-115, -195, getTerrainHeight(-115, -195));
  state = switchVehicleState(state, 'car', getTerrainHeight(state.x, state.z));

  const driveInput: InputState = { ...IDLE_INPUT, forward: true, left: true };
  const startYaw = state.yaw;
  for (let i = 0; i < 90; i++) {
    state = stepPlayerPhysics(state, driveInput, 1 / 30, getTerrainHeight, getThermalLift);
  }
  assert.ok(state.speedKmh > 60, `Car should accelerate > 60 km/h, got ${state.speedKmh}`);
  assert.notEqual(state.yaw, startYaw);
});

test('Kayak floats buoyantly on Oka estuary water and paddles forward', () => {
  const riverX = okaChannelCenterX(-100);
  let state = createInitialPlayerState(riverX, -100, WATER_LEVEL);
  state = switchVehicleState(state, 'kayak', getTerrainHeight(riverX, -100));

  const paddle: InputState = { ...IDLE_INPUT, forward: true };
  for (let i = 0; i < 45; i++) {
    state = stepPlayerPhysics(state, paddle, 1 / 30, getTerrainHeight, getThermalLift);
  }
  assert.ok(state.y >= WATER_LEVEL - 0.1 && state.y <= WATER_LEVEL + 0.5);
  assert.ok(state.speedKmh >= 15, `Kayak speed (${state.speedKmh}) should rise`);
});

test('Helicopter climbs on Space and translates forward with W', () => {
  let state = createInitialPlayerState(-365, -320, getTerrainHeight(-365, -320));
  state = switchVehicleState(state, 'heli', getTerrainHeight(state.x, state.z));
  const initialY = state.y;

  const climbInput: InputState = { ...IDLE_INPUT, jumpOrUp: true, forward: true };
  for (let i = 0; i < 60; i++) {
    state = stepPlayerPhysics(state, climbInput, 1 / 30, getTerrainHeight, getThermalLift);
  }
  assert.ok(state.y > initialY + 10, `Helicopter should climb (from ${initialY} to ${state.y})`);
  assert.ok(state.speedKmh > 25);
});

test('Airplane accelerates and climbs when pitched up', () => {
  let state = createInitialPlayerState(20, 500, getTerrainHeight(20, 500));
  state = switchVehicleState(state, 'plane', getTerrainHeight(state.x, state.z));

  const takeoff: InputState = { ...IDLE_INPUT, forward: true, pitchUp: true, jumpOrUp: true };
  for (let i = 0; i < 90; i++) {
    state = stepPlayerPhysics(state, takeoff, 1 / 30, getTerrainHeight, getThermalLift);
  }
  assert.ok(state.y > 25, `Airplane should climb into the sky, got y=${state.y}`);
  assert.ok(state.speedKmh > 120, `Airplane speed should exceed 120 km/h, got ${state.speedKmh}`);
});

test('Paraglider launches from Ogoño cliff and catches thermal lift', () => {
  const ogonoY = getTerrainHeight(470, -310);
  let state = createInitialPlayerState(470, -310, ogonoY);
  state = switchVehicleState(state, 'paraglider', ogonoY);
  const launchY = state.y;

  const soar: InputState = { ...IDLE_INPUT, jumpOrUp: true };
  for (let i = 0; i < 45; i++) {
    state = stepPlayerPhysics(state, soar, 1 / 30, getTerrainHeight, getThermalLift);
  }
  assert.ok(state.y > launchY, `Paraglider should gain altitude in Ogoño thermal (from ${launchY} to ${state.y})`);
});

test('findNearestParkedVehicle detects nearby vehicle within range', () => {
  const parked = [
    { id: 'p1', vehicle: 'car' as const, x: -110, z: -190, yaw: 0, label: 'Autoa' },
    { id: 'p2', vehicle: 'kayak' as const, x: 50, z: -170, yaw: 0, label: 'Piragua' },
  ];
  const near = findNearestParkedVehicle(-112, -191, parked, 10);
  assert.equal(near?.id, 'p1');
  const none = findNearestParkedVehicle(300, 300, parked, 10);
  assert.equal(none, null);
});
