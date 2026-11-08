// Fetches and normalises conditions. Runs on the server only, so API keys stay hidden.
import { tidePhaseAt } from './score.mjs';

export type TidePoint = { time: string; height: number; type?: 'high' | 'low' };
export type Hour = { time: string; windKmh: number | null; gustKmh: number | null; windFromDeg: number | null; tempC: number | null; rainChance: number | null; swellM: number | null; swellPeriodS: number | null };
export type Conditions = {
  timezone: string;
  nowLocal: string;
  current: { tempC: number | null; windKmh: number | null; gustKmh: number | null; windFromDeg: number | null; rainMm: number | null; weatherCode: number | null; swellM: number | null; swellPeriodS: number | null; swellFromDeg: number | null };
  hours: Hour[];
  sun: { sunrise: string | null; sunset: string | null };
  tides: { source: 'willyweather' | 'modelled' | 'none'; points: TidePoint[]; extremes: TidePoint[]; phaseNow: 'rising' | 'falling' | 'slack' | null; stationName?: string };
  isLowLight: boolean;
  sources: string[];
};

// Local "YYYY-MM-DDTHH:mm" strings are compared as if UTC. Both sides use the same local clock, so it is consistent.
const asMs = (s: string) => Date.parse(s.replace(' ', 'T').slice(0, 16) + ':00Z');

function nowIn(tz: string) {
  const s = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  return s.replace(' ', 'T');
}

async function getJson(url: string, revalidate = 900) {
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error(`${new URL(url).host} returned ${r.status}`);
  return r.json();
}

async function willyTides(lat: number, lon: number, startDate: string): Promise<{ extremes: TidePoint[]; stationName?: string; swell?: TidePoint[] } | null> {
  const key = process.env.WILLYWEATHER_API_KEY;
  if (!key) return null;
  try {
    const base = `https://api.willyweather.com.au/v2/${encodeURIComponent(key)}`;
    const found = await getJson(`${base}/search.json?lat=${lat}&lng=${lon}&units=distance:km`, 86400);
    const id = found?.location?.id;
    if (!id) return null;
    const w = await getJson(`${base}/locations/${id}/weather.json?forecasts=tides&days=3&startDate=${startDate}`, 3600);
    const days = w?.forecasts?.tides?.days ?? [];
    const extremes: TidePoint[] = days.flatMap((d: any) => (d.entries ?? []).map((e: any) => ({ time: String(e.dateTime).replace(' ', 'T').slice(0, 16), height: Number(e.height), type: e.type === 'high' ? 'high' : 'low' })));
    return extremes.length ? { extremes, stationName: found?.location?.name } : null;
  } catch {
    return null;
  }
}

function phaseFromExtremes(ex: TidePoint[], now: string): 'rising' | 'falling' | 'slack' | null {
  const t = asMs(now);
  const next = ex.find((e) => asMs(e.time) > t);
  const prev = [...ex].reverse().find((e) => asMs(e.time) <= t);
  if (!next || !prev) return null;
  const nearTurn = Math.min(t - asMs(prev.time), asMs(next.time) - t) < 40 * 60 * 1000;
  if (nearTurn) return 'slack';
  return next.type === 'high' ? 'rising' : 'falling';
}

export async function getConditions(lat: number, lon: number): Promise<Conditions> {
  const sources: string[] = [];
  const fq = new URLSearchParams({
    latitude: String(lat), longitude: String(lon), timezone: 'auto', wind_speed_unit: 'kmh', forecast_days: '3',
    current: 'temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,weather_code',
    hourly: 'temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability',
    daily: 'sunrise,sunset',
  });
  const mq = new URLSearchParams({
    latitude: String(lat), longitude: String(lon), timezone: 'auto', forecast_days: '3',
    current: 'swell_wave_height,swell_wave_period,swell_wave_direction',
    hourly: 'swell_wave_height,swell_wave_period,sea_level_height_msl',
  });
  const [fc, marine] = await Promise.all([
    getJson(`https://api.open-meteo.com/v1/forecast?${fq}`),
    getJson(`https://marine-api.open-meteo.com/v1/marine?${mq}`).catch(() => null),
  ]);
  sources.push('Weather: Open-Meteo');
  if (marine) sources.push('Swell: Open-Meteo Marine');

  const tz: string = fc.timezone || 'Australia/Melbourne';
  const now = nowIn(tz);
  const hourIdx = (fc.hourly?.time ?? []).findIndex((t: string) => asMs(t) >= asMs(now) - 30 * 60 * 1000);
  const start = Math.max(0, hourIdx);
  const mIndex = new Map<string, number>((marine?.hourly?.time ?? []).map((t: string, i: number) => [t, i]));
  const hours: Hour[] = (fc.hourly?.time ?? []).slice(start, start + 24).map((t: string, k: number) => {
    const i = start + k, mi = mIndex.get(t);
    return {
      time: t,
      windKmh: fc.hourly.wind_speed_10m?.[i] ?? null,
      gustKmh: fc.hourly.wind_gusts_10m?.[i] ?? null,
      windFromDeg: fc.hourly.wind_direction_10m?.[i] ?? null,
      tempC: fc.hourly.temperature_2m?.[i] ?? null,
      rainChance: fc.hourly.precipitation_probability?.[i] ?? null,
      swellM: mi != null ? marine.hourly.swell_wave_height?.[mi] ?? null : null,
      swellPeriodS: mi != null ? marine.hourly.swell_wave_period?.[mi] ?? null : null,
    };
  });

  // Tides: WillyWeather when a key is set, otherwise Open-Meteo's modelled sea level (rough near the coast).
  let tides: Conditions['tides'] = { source: 'none', points: [], extremes: [], phaseNow: null };
  const willy = await willyTides(lat, lon, now.slice(0, 10));
  if (willy) {
    tides = { source: 'willyweather', points: [], extremes: willy.extremes, phaseNow: phaseFromExtremes(willy.extremes, now), stationName: willy.stationName };
    sources.push('Tides: WillyWeather');
  } else if (marine?.hourly?.sea_level_height_msl?.some((v: number | null) => v != null)) {
    const pts: TidePoint[] = marine.hourly.time.map((t: string, i: number) => ({ time: t, height: marine.hourly.sea_level_height_msl[i] })).filter((p: TidePoint) => p.height != null);
    const asUtc = pts.map((p) => ({ time: p.time + ':00Z', height: p.height }));
    const ex = findExtremes(pts);
    tides = { source: 'modelled', points: pts, extremes: ex, phaseNow: phaseFromExtremes(ex, now) ?? tidePhaseAt(asUtc, now + ':00Z') };
    sources.push('Tides: Open-Meteo model (approximate)');
  }

  const sunrise = fc.daily?.sunrise?.[0] ?? null, sunset = fc.daily?.sunset?.[0] ?? null;
  const near = (s: string | null) => s != null && Math.abs(asMs(s) - asMs(now)) <= 90 * 60 * 1000;

  return {
    timezone: tz,
    nowLocal: now,
    current: {
      tempC: fc.current?.temperature_2m ?? null,
      windKmh: fc.current?.wind_speed_10m ?? null,
      gustKmh: fc.current?.wind_gusts_10m ?? null,
      windFromDeg: fc.current?.wind_direction_10m ?? null,
      rainMm: fc.current?.precipitation ?? null,
      weatherCode: fc.current?.weather_code ?? null,
      swellM: marine?.current?.swell_wave_height ?? null,
      swellPeriodS: marine?.current?.swell_wave_period ?? null,
      swellFromDeg: marine?.current?.swell_wave_direction ?? null,
    },
    hours,
    sun: { sunrise, sunset },
    tides,
    isLowLight: near(sunrise) || near(sunset),
    sources,
  };
}

function findExtremes(pts: TidePoint[]): TidePoint[] {
  const out: TidePoint[] = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1].height, b = pts[i].height, c = pts[i + 1].height;
    if (b > a && b >= c) out.push({ ...pts[i], type: 'high' });
    else if (b < a && b <= c) out.push({ ...pts[i], type: 'low' });
  }
  return out;
}
