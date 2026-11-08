import { NextResponse } from 'next/server';
import curated from '@/data/spots.json';
import species from '@/data/species.json';
import { getConditions } from '@/lib/conditions';
import { findSpots } from '@/lib/osm';
import { distanceKm, rateSpot, inSeason } from '@/lib/score.mjs';
import { AGENCY, guessState } from '@/lib/regions.mjs';

export const maxDuration = 30;
const CURATED_KM = 40;
const SEARCH_KM = 15;
const WIDE_KM = 50;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get('lat')), lon = Number(sp.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'A valid location is needed.' }, { status: 400 });
  }

  const checked = curated
    .map((s) => ({ ...s, distanceKm: distanceKm(lat, lon, s.lat, s.lon) }))
    .filter((s) => s.distanceKm <= CURATED_KM);

  const [condRes, found] = await Promise.all([
    getConditions(lat, lon).then((c) => ({ ok: true as const, c }), (e) => ({ ok: false as const, e })),
    findSpots(lat, lon, SEARCH_KM)
      .then((f) => (f.spots.length >= 3 ? f : findSpots(lat, lon, WIDE_KM)))
      .catch(() => ({ spots: [], state: guessState(lat, lon), ok: false })),
  ]);
  if (!condRes.ok) {
    return NextResponse.json({ error: 'Conditions are not available right now. Try again shortly.' }, { status: 502 });
  }
  const conditions = condRes.c;

  // Drop map spots that sit on top of a checked spot.
  const extra = found.spots.filter((f) => !checked.some((c) => distanceKm(c.lat, c.lon, f.lat, f.lon) < 0.4));
  const all: any[] = [...checked, ...extra];

  const state: string = found.state || guessState(lat, lon);
  const month = Number(conditions.nowLocal.slice(5, 7));
  const c = conditions.current;
  const cond = { windKmh: c.windKmh, gustKmh: c.gustKmh, windFromDeg: c.windFromDeg, swellM: c.swellM, swellPeriodS: c.swellPeriodS, tidePhase: conditions.tides.phaseNow, isLowLight: conditions.isLowLight };
  const sp2 = species as Record<string, any>;

  const rated = all.map((s) => {
    const r = rateSpot(s, cond);
    // Checked spots get a small nudge so they list ahead of map finds in the same conditions.
    const score = s.status === 'osm' ? r.score : r.score + 3;
    return {
      ...s, ...r, score,
      targets: s.species.filter((id: string) => sp2[id]).map((id: string) => {
        const f = sp2[id];
        const limitsHere = f.limitsState && f.limitsState === state;
        return { id, name: f.name, sci: f.sci, gear: f.gear, bait: f.bait, inSeason: inSeason(f, month), minSize: limitsHere ? f.minSize : null, bag: limitsHere ? f.bag : null };
      }),
    };
  }).sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm).slice(0, 10);

  const agency = (AGENCY as any)[state] ?? null;
  let coverageNote: string | null = null;
  if (!rated.length) coverageNote = found.ok
    ? `We couldn't find fishing water within ${WIDE_KM} km of here. Try a nearby coastal town, river or lake.`
    : 'Spots could not be loaded just now. Conditions are below.';

  return NextResponse.json({
    location: { lat, lon },
    state,
    agency,
    spots: rated,
    conditions,
    rulesSource: state === 'Victoria' ? sp2._source : null,
    coverageNote,
    attribution: extra.length ? 'Spots found from OpenStreetMap data © OpenStreetMap contributors' : null,
  }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } });
}
