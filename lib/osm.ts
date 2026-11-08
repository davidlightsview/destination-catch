// Finds likely fishing spots near a point from OpenStreetMap (Overpass API). Data © OpenStreetMap contributors, ODbL.
import { distanceKm } from './score.mjs';
import { zoneFor, speciesFor, howFor, guessState } from './regions.mjs';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export type FoundSpot = {
  id: string; name: string; lat: number; lon: number; water: string; access: 'land' | 'boat';
  species: string[]; how: string; getThere: string; status: 'osm'; distanceKm: number;
};

function classify(t: Record<string, string>): { water: string; access: 'land' | 'boat'; label: string } | null {
  if (t.leisure === 'fishing') return { water: 'estuary', access: 'land', label: 'Fishing spot' };
  if (t.man_made === 'pier' || t.man_made === 'jetty') return { water: 'jetty', access: 'land', label: 'Jetty' };
  if (t.man_made === 'breakwater' || t.man_made === 'groyne') return { water: 'rock', access: 'land', label: 'Rock wall' };
  if (t.leisure === 'slipway') return { water: 'ramp', access: 'boat', label: 'Boat ramp' };
  if (t.natural === 'beach') return { water: 'beach', access: 'land', label: 'Beach' };
  if (t.waterway === 'river') return { water: 'river', access: 'land', label: 'River' };
  if (t.natural === 'water') {
    if (t.water === 'lagoon') return { water: 'estuary', access: 'land', label: 'Lagoon' };
    if (t.water === 'river') return { water: 'river', access: 'land', label: 'River' };
    return { water: 'lake', access: 'land', label: 'Lake' };
  }
  return null;
}

export async function findSpots(lat: number, lon: number, radiusKm = 25): Promise<{ spots: FoundSpot[]; state: string; ok: boolean }> {
  const la = lat.toFixed(3), lo = lon.toFixed(3), r = Math.round(radiusKm * 1000);
  const around = `(around:${r},${la},${lo})`;
  const q = `[out:json][timeout:20];(
nwr${around}[leisure=fishing];
nwr${around}[man_made~"^(pier|jetty|breakwater|groyne)$"];
nwr${around}[leisure=slipway];
nwr${around}[natural=beach][name];
way${around}[waterway=river][name];
nwr${around}[natural=water][name][water~"^(lake|reservoir|lagoon|river)$"];
);out tags center 400;
is_in(${la},${lo})->.a;area.a["admin_level"="4"]["boundary"="administrative"];out tags;`;

  let data: any = null;
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`${ep}?data=${encodeURIComponent(q)}`, {
        headers: { 'User-Agent': 'DestinationCatch/0.1 (fishing conditions app)' },
        signal: AbortSignal.timeout(12000),
        next: { revalidate: 86400 },
      });
      if (!res.ok) { console.error(`[osm] ${new URL(ep).host} HTTP ${res.status}`); continue; }
      data = await res.json();
      break;
    } catch (e: any) {
      console.error(`[osm] ${new URL(ep).host} failed: ${e?.message ?? e}`);
    }
  }
  if (!data) return { spots: [], state: guessState(lat, lon), ok: false };

  const els: any[] = data.elements ?? [];
  const stateEl = els.find((e) => e.type === 'area' && e.tags?.name);
  const state: string = stateEl?.tags?.['name:en'] ?? stateEl?.tags?.name ?? guessState(lat, lon);
  const zone = zoneFor(lat, lon);

  const raw: FoundSpot[] = [];
  for (const e of els) {
    if (e.type === 'area') continue;
    const t = e.tags ?? {};
    const c = classify(t);
    const p = e.type === 'node' ? { lat: e.lat, lon: e.lon } : e.center;
    if (!c || !p) continue;
    raw.push({
      id: `osm-${e.type[0]}${e.id}`,
      name: t.name ?? c.label,
      lat: p.lat, lon: p.lon,
      water: c.water, access: c.access,
      species: [], how: '', getThere: '', status: 'osm',
      distanceKm: distanceKm(lat, lon, p.lat, p.lon),
    });
  }

  // Is this stretch of coast? Any beach, jetty, rock wall or ramp nearby says yes.
  const coastal = raw.filter((s) => ['beach', 'jetty', 'rock', 'ramp'].includes(s.water));
  for (const s of raw) {
    if (s.water === 'river' || s.water === 'lake') {
      const nearCoast = coastal.some((k) => distanceKm(s.lat, s.lon, k.lat, k.lon) < 6);
      if (!nearCoast) s.water = s.water === 'river' ? 'fresh_river' : 'lake';
      else if (s.water === 'lake') s.water = 'estuary';
    }
    if (s.water === 'estuary' && s.name === 'Fishing spot' && !coastal.length) s.water = 'fresh_river';
    s.species = speciesFor(zone, s.water, s.lat);
    s.how = howFor(s.water);
    s.getThere = s.access === 'boat'
      ? 'Use the directions button to get to the ramp. Check signs for parking and launch fees.'
      : 'Use the directions button to get there. Check local signs for access and parking.';
  }

  // Unnamed jetties and ramps are useful; unnamed beaches and rivers are filtered by the query.
  // De-duplicate: same name within 3 km (rivers are split into many pieces), or any two spots within 150 m.
  raw.sort((a, b) => a.distanceKm - b.distanceKm);
  const kept: FoundSpot[] = [];
  for (const s of raw) {
    const dup = kept.some((k) => (k.name === s.name && k.name !== 'Jetty' && k.name !== 'Boat ramp' && k.name !== 'Rock wall' && distanceKm(k.lat, k.lon, s.lat, s.lon) < 3)
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
