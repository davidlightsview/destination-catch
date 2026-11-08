import { NextResponse } from 'next/server';
import spots from '@/data/spots.json';
import species from '@/data/species.json';
import { getConditions } from '@/lib/conditions';
import { distanceKm, rateSpot, inSeason } from '@/lib/score.mjs';

const RADIUS_KM = 150;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get('lat')), lon = Number(sp.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'A valid location is needed.' }, { status: 400 });
  }

  const nearby = spots
    .map((s) => ({ ...s, distanceKm: distanceKm(lat, lon, s.lat, s.lon) }))
    .filter((s) => s.distanceKm <= RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // One conditions call per region keeps us well inside the free API allowances.
  const anchor = nearby[0] ?? { lat, lon };
  let conditions;
  try {
    conditions = await getConditions(anchor.lat, anchor.lon);
  } catch (e: any) {
    return NextResponse.json({ error: 'Conditions are not available right now. Try again shortly.', detail: String(e?.message ?? e) }, { status: 502 });
  }

  const month = Number(conditions.nowLocal.slice(5, 7));
  const c = conditions.current;
  const cond = { windKmh: c.windKmh, gustKmh: c.gustKmh, windFromDeg: c.windFromDeg, swellM: c.swellM, swellPeriodS: c.swellPeriodS, tidePhase: conditions.tides.phaseNow, isLowLight: conditions.isLowLight };
  const sp2 = species as Record<string, any>;
  const rated = nearby.map((s) => ({
    ...s,
    ...rateSpot(s, cond),
    targets: s.species.map((id) => ({ id, ...sp2[id], inSeason: inSeason(sp2[id], month) })),
  })).sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);

  return NextResponse.json({
    location: { lat, lon },
    spots: rated,
    conditions,
    rulesSource: sp2._source,
    coverageNote: nearby.length ? null : `No checked spots within ${RADIUS_KM} km yet. Conditions below are for your location.`,
  }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } });
}
