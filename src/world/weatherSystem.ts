export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy';

export interface WeatherPreset {
  id: WeatherCondition;
  label: string;
  subtitle: string;
  skyTurbidity: number;
  skyRayleigh: number;
  sunElevationDeg: number;
  sunIntensity: number;
  hemiIntensity: number;
  fogColorHex: number;
  fogDensity: number;
  waterColorHex: number;
  cloudOpacity: number;
  cloudColorHex: number;
  rainIntensity: number;
  roadRoughness: number;
  exposure: number;
}

export const WEATHER_ORDER: readonly WeatherCondition[] = ['sunny', 'cloudy', 'rainy'];

export const WEATHER_PRESETS: Record<WeatherCondition, WeatherPreset> = {
  sunny: {
    id: 'sunny',
    label: 'Eguzkitsua',
    subtitle: 'Zerua garbi · Haize leuna',
    skyTurbidity: 3.6,
    skyRayleigh: 1.45,
    sunElevationDeg: 32,
    sunIntensity: 2.5,
    hemiIntensity: 0.78,
    fogColorHex: 0xc4dfee,
    fogDensity: 0.00068,
    waterColorHex: 0x0d6b82,
    cloudOpacity: 0.45,
    cloudColorHex: 0xf8fafc,
    rainIntensity: 0,
    roadRoughness: 0.82,
    exposure: 1.08,
  },
  cloudy: {
    id: 'cloudy',
    label: 'Lainotua',
    subtitle: 'Itsas lainoak · Bista leunak',
    skyTurbidity: 14.0,
    skyRayleigh: 0.28,
    sunElevationDeg: 18,
    sunIntensity: 0.95,
    hemiIntensity: 0.84,
    fogColorHex: 0x94a3b8,
    fogDensity: 0.00145,
    waterColorHex: 0x164e63,
    cloudOpacity: 0.88,
    cloudColorHex: 0xcbd5e1,
    rainIntensity: 0,
    roadRoughness: 0.62,
    exposure: 0.92,
  },
  rainy: {
    id: 'rainy',
    label: 'Euritsua',
    subtitle: 'Kantauriko euria · Errepide bustia',
    skyTurbidity: 22.0,
    skyRayleigh: 0.08,
    sunElevationDeg: 9,
    sunIntensity: 0.42,
    hemiIntensity: 0.58,
    fogColorHex: 0x475569,
    fogDensity: 0.0022,
    waterColorHex: 0x172b3a,
    cloudOpacity: 0.95,
    cloudColorHex: 0x475569,
    rainIntensity: 1.0,
    roadRoughness: 0.16,
    exposure: 0.78,
  },
};

export function nextWeatherCondition(current: WeatherCondition): WeatherCondition {
  const idx = WEATHER_ORDER.indexOf(current);
  return WEATHER_ORDER[(idx + 1) % WEATHER_ORDER.length];
}

export function lerpScalar(a: number, b: number, t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return a + (b - a) * c;
}
