// Likely fishing spots near a point, from a prebuilt OpenStreetMap list (data/osm-au.json).
// The list is rebuilt monthly by .github/workflows/osm-spots.yml. Data © OpenStreetMap contributors, ODbL.
import au from '@/data/osm-au.json';
import { distanceKm } from './score.mjs';
import { zoneFor, speciesFor, howFor, guessState } from './regions.mjs';

export type FoundSpot = {
  id: string; name: string; lat: number; lon: number; water: string; access: 'land' | 'boat';
  species: string[]; how: string; getThere: string; status: 'osm'; distanceKm: number;
};

type Row = [number, number, number, string, number, number?];
const DATA = au as unknown as { types: string[]; states: string[]; s: Row[] };

// Grid of 0.25 degree cells so a search only looks at nearby rows.
const CELL = 0.25;
const key = (lat: number, lon: number) => `${Math.floor(lat / CELL)}:${Math.floor(lon / CELL)}`;
let grid: Map<string, number[]> | null = null;
function index() {
  if (grid) return grid;
  grid = new Map();
  DATA.s.forEach((r, i) => {
    const k = key(r[0], r[1]);
    const a = grid!.get(k);
    if (a) a.push(i); else grid!.set(k, [i]);
  });
  return grid;
}

function near(lat: number, lon: number, radiusKm: number) {
  const g = index();
  const dLat = radiusKm / 111, dLon = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  const out: { i: number; d: number }[] = [];
  for (let a = Math.floor((lat - dLat) / CELL); a <= Math.floor((lat + dLat) / CELL); a++) {
    for (let b = Math.floor((lon - dLon) / CELL); b <= Math.floor((lon + dLon) / CELL); b++) {
      for (const i of g.get(`${a}:${b}`) ?? []) {
        const r = DATA.s[i];
        const d = distanceKm(lat, lon, r[0], r[1]);
        if (d <= radiusKm) out.push({ i, d });
      }
    }
  }
  return out.sort((x, y) => x.d - y.d);
}

const LABEL: Record<string, string> = { fishing: 'Fishing spot', jetty: 'Jetty', rock: 'Rock wall', ramp: 'Boat ramp', beach: 'Beach', river: 'River', lake: 'Lake', lagoon: 'Lagoon' };

// Turn the map feature type into the water types the ratings understand.
function waterFor(type: string, coastal: boolean): { water: string; access: 'land' | 'boat' } {
  if (coastal) {
    switch (type) {
      case 'jetty': return { water: 'jetty', access: 'land' };
      case 'rock': return { water: 'rock', access: 'land' };
      case 'ramp': return { water: 'ramp', access: 'boat' };
      case 'beach': return { water: 'beach', access: 'land' };
      case 'river': return { water: 'river', access: 'land' };
      default: return { water: 'estuary', access: 'land' }; // fishing spot, lake or lagoon by the sea
    }
  }
  if (type === 'river') return { water: 'fresh_river', access: 'land' };
  if (type === 'ramp') return { water: 'lake', access: 'boat' };
  if (type === 'fishing') return { water: 'fresh_river', access: 'land' };
  return { water: 'lake', access: 'land' };
}

// Salt or tidal water: within 4-5 km of the coastline itself, or within 15 km of a beach, jetty or wall that is
// (that catches the lower reaches of rivers like the Swan or the Brisbane, which run well inland from the coast).
const seaCache = new Map<number, boolean>();
function nearSea(lat: number, lon: number) {
  const k = Math.round(lat * 100) * 100000 + Math.round(lon * 100);
  const hit = seaCache.get(k);
  if (hit !== undefined) return hit;
  const v = near(lat, lon, 15).some(({ i, d }) => {
    const r = DATA.s[i];
    if (r[5] !== 1) return false;
    if (d < 0.3) return true; // the spot itself sits on the coast
    return ['beach', 'jetty', 'rock'].includes(DATA.types[r[2]]);
  });
  seaCache.set(k, v);
  return v;
}

export function stateAt(lat: number, lon: number): string {
  const hit = near(lat, lon, 30).find((h) => DATA.s[h.i][4] >= 0);
  return hit ? DATA.states[DATA.s[hit.i][4]] : guessState(lat, lon);
}

export async function findSpots(lat: number, lon: number, radiusKm = 15): Promise<{ spots: FoundSpot[]; state: string; ok: boolean }> {
  const zone = zoneFor(lat, lon);
  const hits = near(lat, lon, radiusKm);
  const state = hits.length && DATA.s[hits[0].i][4] >= 0 ? DATA.states[DATA.s[hits[0].i][4]] : stateAt(lat, lon);

  const raw: FoundSpot[] = hits.map(({ i, d }) => {
    const [la, lo, ti, name] = DATA.s[i];
    const type = DATA.types[ti];
    // Lakes count as salt only when they touch the coast (Gippsland Lakes yes, a suburban park pond no).
    const sea = type === 'lake' ? DATA.s[i][5] === 1 : nearSea(la, lo);
    const w = waterFor(type, sea);
    return {
      id: `osm-${i}`,
      name: name || LABEL[type] || 'Fishing spot',
      lat: la, lon: lo, water: w.water, access: w.access,
      species: speciesFor(zone, w.water, la), how: howFor(w.water),
      getThere: w.access === 'boat'
        ? 'Use the directions button to get to the ramp. Check signs for parking and launch fees.'
        : 'Use the directions button to get there. Check local signs for access and parking.',
      status: 'osm', distanceKm: d,
    };
  });

  // De-duplicate: same name within 3 km (rivers come as many points), or any two spots within 150 m.
  const generic = new Set(Object.values(LABEL));
  const kept: FoundSpot[] = [];
  for (const s of raw) {
    const dup = kept.some((k) => (k.name === s.name && !generic.has(k.name) && distanceKm(k.lat, k.lon, s.lat, s.lon) < 3)
      || distanceKm(k.lat, k.lon, s.lat, s.lon) < 0.15);
    if (!dup) kept.push(s);
  }

  // Keep a spread: up to 2 of each type, closest first, then fill to 10.
  const out: FoundSpot[] = [];
  const perType: Record<string, number> = {};
  for (const s of kept) { if ((perType[s.water] ?? 0) < 2) { out.push(s); perType[s.water] = (perType[s.water] ?? 0) + 1; } if (out.length >= 10) break; }
  for (const s of kept) { if (out.length >= 10) break; if (!out.includes(s)) out.push(s); }
  return { spots: out, state, ok: true };
}
