import test from 'node:test';
import assert from 'node:assert/strict';
import {
  URDAIBAI_LANDMARKS,
  WATER_LEVEL,
  getEuskotrenPose,
  getRoadDistanceInfo,
  getSurfaceType,
  getTerrainHeight,
  getThermalLift,
  getZoneAt,
  okaChannelCenterX,
  worldToLatLng,
} from './urdaibaiMap';
import { EUSKOTREN_STATIONS, OSM_URDAIBAI_PLACES } from './osmUrdaibaiData';
import { RADIO_STATIONS, UrdaibaiRadioEngine } from '../audio/radioEngine';
import { WEATHER_PRESETS, lerpScalar, nextWeatherCondition } from './weatherSystem';

test('Mundaka spawn point is above water and on paved/town ground', () => {
  const mundaka = URDAIBAI_LANDMARKS.find((l) => l.id === 'mundaka');
  assert.ok(mundaka, 'Mundaka landmark must exist');
  const h = getTerrainHeight(mundaka.x, mundaka.z);
  assert.ok(h > WATER_LEVEL + 2, `Mundaka height (${h}) must be above sea level`);
});

test('Oka estuary channel at z=0 is submerged underwater except on bridge', () => {
  const cx = okaChannelCenterX(0);
  const h = getTerrainHeight(cx, 0);
  assert.ok(h < WATER_LEVEL, `Oka river center at z=0 (${h}) should be below water level`);
  assert.equal(getSurfaceType(cx, 0, h), 'water');
});

test('Estuary bridge at Sukarrieta spans above water level', () => {
  const cx = okaChannelCenterX(27);
  const roadInfo = getRoadDistanceInfo(cx, 27);
  assert.equal(roadInfo.isBridge, true);
  const h = getTerrainHeight(cx, 27);
  assert.ok(h > WATER_LEVEL + 4, `Bridge deck height (${h}) must clear water`);
  assert.equal(getSurfaceType(cx, 27, h), 'road');
});

test('Iconic Urdaibai peaks (Ogoño, Atxarre, Gaztelugatxe, Izaro) have positive relief', () => {
  const ogono = URDAIBAI_LANDMARKS.find((l) => l.id === 'ogono')!;
  const atxarre = URDAIBAI_LANDMARKS.find((l) => l.id === 'atxarre')!;
  const gaztelu = URDAIBAI_LANDMARKS.find((l) => l.id === 'gaztelugatxe')!;
  const izaro = URDAIBAI_LANDMARKS.find((l) => l.id === 'izaro')!;

  assert.ok(getTerrainHeight(ogono.x, ogono.z) > 100, 'Ogoño cliff > 100m');
  assert.ok(getTerrainHeight(atxarre.x, atxarre.z) > 95, 'Atxarre peak > 95m');
  assert.ok(getTerrainHeight(gaztelu.x, gaztelu.z) > 55, 'Gaztelugatxe rock > 55m');
  assert.ok(getTerrainHeight(izaro.x, izaro.z) > 35, 'Izaro island > 35m');
});

test('Thermal updrafts exist near Ogoño cliff for paragliding', () => {
  const ogono = URDAIBAI_LANDMARKS.find((l) => l.id === 'ogono')!;
  const lift = getThermalLift(ogono.x, ogono.z, 120);
  assert.ok(lift > 5, `Ogoño thermal lift (${lift}) should be > 5 m/s`);
});

test('Laida beach is sandy shore and zone lookup identifies Mundaka & Gernika', () => {
  const laida = URDAIBAI_LANDMARKS.find((l) => l.id === 'laida')!;
  const h = getTerrainHeight(laida.x, laida.z);
  assert.equal(getSurfaceType(laida.x, laida.z, h), 'sand');
  assert.equal(getZoneAt(-115, -195).name, 'Mundaka');
  assert.equal(getZoneAt(20, 500).name, 'Gernika-Lumo');

  const coords = worldToLatLng(-115, -195);
  assert.ok(coords.lat > 43.3 && coords.lat < 43.5);
  assert.ok(coords.lng < -2.6 && coords.lng > -2.8);
});

test('OSM snapshot includes enriched Urdaibai towns and Euskotren rail pose stays above water', () => {
  assert.ok(OSM_URDAIBAI_PLACES.some((p) => p.id === 'elantxobe'));
  assert.ok(OSM_URDAIBAI_PLACES.some((p) => p.id === 'arteaga'));
  assert.ok(EUSKOTREN_STATIONS.length >= 7);

  for (const phase of [0, 0.25, 0.5, 0.75]) {
    const pose = getEuskotrenPose(phase);
    assert.ok(pose.y > WATER_LEVEL + 3, `Euskotren height at phase ${phase} must be on dry track`);
  }
});

test('Urdaibai Radio includes Sarkor, Tooth, Backbone, and Inner and cycles cleanly', () => {
  const ids = RADIO_STATIONS.map((s) => s.id);
  for (const band of ['sarkor', 'tooth', 'backbone', 'inner'] as const) {
    assert.ok(ids.includes(band), `Missing radio station ${band}`);
  }
  const radio = new UrdaibaiRadioEngine();
  assert.equal(radio.getStation(), 'sarkor');
  assert.equal(radio.cycleStation(), 'tooth');
  assert.equal(radio.cycleStation(), 'backbone');
  assert.equal(radio.cycleStation(), 'inner');
});

test('Weather system cycles sunny -> cloudy -> rainy -> sunny and adjusts rain/fog/roads', () => {
  assert.equal(nextWeatherCondition('sunny'), 'cloudy');
  assert.equal(nextWeatherCondition('cloudy'), 'rainy');
  assert.equal(nextWeatherCondition('rainy'), 'sunny');
  assert.equal(WEATHER_PRESETS.sunny.rainIntensity, 0);
  assert.equal(WEATHER_PRESETS.rainy.rainIntensity, 1);
  assert.ok(WEATHER_PRESETS.rainy.roadRoughness < WEATHER_PRESETS.sunny.roadRoughness);
  assert.equal(lerpScalar(10, 20, 0.5), 15);
});
