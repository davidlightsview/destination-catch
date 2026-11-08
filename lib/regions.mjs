// Which fish to expect, by region and type of water. Rough coastal zones, good enough to pick likely species.

export function zoneFor(lat, lon) {
  if (lat < -39.5) return 'tas';
  if (lat > -24) return 'north';
  if (lon >= 149.5 && lat >= -28.2) return 'seqld';
  if (lon >= 149.5 && lat >= -37.5) return 'nsw';
  if (lon >= 140.9 && lat < -33.9) return 'vic';
  if (lon >= 129 && lon < 140.9) return 'sa';
  if (lon < 129 && lat < -31) return 'wa_south';
  if (lon < 129) return 'wa_west';
  return 'nsw';
}

// Water types: surf, beach, estuary, river, entrance, jetty, rock, ramp, lake, fresh_river
const COAST = {
  vic: { surf: ['australian-salmon', 'tailor', 'gummy-shark'], estuary: ['black-bream', 'dusky-flathead', 'estuary-perch', 'yellow-eye-mullet'], jetty: ['king-george-whiting', 'squid', 'australian-salmon', 'yellow-eye-mullet'], rock: ['australian-salmon', 'luderick', 'squid'], ramp: ['snapper', 'king-george-whiting', 'dusky-flathead'] },
  tas: { surf: ['australian-salmon', 'gummy-shark'], estuary: ['black-bream', 'sand-flathead', 'yellow-eye-mullet'], jetty: ['squid', 'australian-salmon', 'sand-flathead'], rock: ['australian-salmon', 'squid'], ramp: ['sand-flathead', 'gummy-shark'] },
  nsw: { surf: ['tailor', 'australian-salmon', 'sand-whiting', 'mulloway'], estuary: ['yellowfin-bream', 'dusky-flathead', 'sand-whiting', 'luderick'], jetty: ['yellowfin-bream', 'luderick', 'trevally', 'squid'], rock: ['luderick', 'trevally', 'australian-salmon'], ramp: ['snapper', 'dusky-flathead', 'mulloway'] },
  seqld: { surf: ['tailor', 'sand-whiting', 'mulloway'], estuary: ['yellowfin-bream', 'dusky-flathead', 'sand-whiting', 'mangrove-jack'], jetty: ['yellowfin-bream', 'trevally', 'squid'], rock: ['tailor', 'trevally', 'luderick'], ramp: ['snapper', 'dusky-flathead', 'mangrove-jack'] },
  north: { surf: ['trevally', 'barramundi'], estuary: ['barramundi', 'mangrove-jack', 'trevally'], jetty: ['trevally', 'mangrove-jack', 'squid'], rock: ['trevally', 'mangrove-jack'], ramp: ['barramundi', 'mangrove-jack', 'trevally'] },
  sa: { surf: ['australian-salmon', 'australian-herring', 'mulloway'], estuary: ['black-bream', 'yellow-eye-mullet', 'mulloway'], jetty: ['king-george-whiting', 'squid', 'australian-herring'], rock: ['australian-salmon', 'squid'], ramp: ['snapper', 'king-george-whiting'] },
  wa_south: { surf: ['australian-salmon', 'australian-herring', 'tailor'], estuary: ['black-bream', 'yellow-eye-mullet'], jetty: ['australian-herring', 'squid', 'king-george-whiting'], rock: ['australian-salmon', 'australian-herring'], ramp: ['snapper', 'king-george-whiting'] },
  wa_west: { surf: ['tailor', 'australian-herring', 'mulloway'], estuary: ['black-bream', 'yellow-eye-mullet'], jetty: ['australian-herring', 'squid', 'tailor'], rock: ['australian-herring', 'tailor'], ramp: ['snapper', 'mulloway'] },
};

export function speciesFor(zone, water, lat) {
  if (water === 'lake' || water === 'fresh_river') {
    if (zone === 'north') return lat > -20 ? ['barramundi'] : ['golden-perch'];
    if (zone === 'wa_south' || zone === 'wa_west') return ['redfin', 'trout'];
    const fresh = ['murray-cod', 'golden-perch', 'redfin'];
    if (zone === 'tas' || (zone === 'vic' && lat < -36.5)) return ['trout', 'redfin'];
    return fresh;
  }
  const z = COAST[zone] ?? COAST.nsw;
  const key = water === 'beach' ? 'surf' : water === 'river' || water === 'entrance' ? 'estuary' : water;
  return z[key] ?? z.estuary;
}

export const AGENCY = {
  Victoria: { name: 'Victorian Fisheries Authority', url: 'https://vfa.vic.gov.au/recreational-fishing' },
  'New South Wales': { name: 'NSW DPI Fisheries', url: 'https://www.dpi.nsw.gov.au/fishing' },
  Queensland: { name: 'Queensland Fisheries', url: 'https://www.qld.gov.au/recreation/activities/boating-fishing/rec-fishing' },
  'South Australia': { name: 'PIRSA Fisheries', url: 'https://pir.sa.gov.au/recreational_fishing' },
  'Western Australia': { name: 'WA Fisheries', url: 'https://www.fish.wa.gov.au' },
  Tasmania: { name: 'Tasmanian Fishing', url: 'https://fishing.tas.gov.au' },
  'Northern Territory': { name: 'NT Fisheries', url: 'https://nt.gov.au/marine/recreational-fishing' },
  'Australian Capital Territory': { name: 'ACT Fishing', url: 'https://www.act.gov.au' },
};

// Fallback when the map service doesn't return a state.
export function guessState(lat, lon) {
  if (lat < -39.5) return 'Tasmania';
  if (lon < 129) return 'Western Australia';
  if (lon < 138 && lat > -26) return 'Northern Territory';
  if (lon < 141) return 'South Australia';
  if (lat > -29 && lon >= 141) return 'Queensland';
  if (lon < 150 && lat < -36) return 'Victoria';
  if (lon < 144 && lat < -34) return 'Victoria';
  return 'New South Wales';
}

const HOW = {
  surf: 'Walk the beach and pick a gutter: darker, deeper water between the sandbank and shore, ideally with a rip running out. Cast just past the first line of breakers.',
  beach: 'Look for deeper water, weed edges or a channel close to shore. Dawn, dusk and a rising tide are usually best.',
  estuary: 'Fish the edges where shallow flats drop into deeper channels, and any snags or weed beds. A moving tide brings the fish on.',
  river: 'Work the bends, snags and undercut banks. The run-in tide and the first of the run-out are usually best near the coast.',
  jetty: 'Fish the pylons and the shadow line under the jetty. A little berley brings fish in. Squid come in around the lights after dark.',
  rock: 'Fish the wash along the wall and the end where the current runs. Only fish rock walls in small seas and never with your back to the water.',
  ramp: 'Launch here and head for nearby drop-offs, channel edges and reefs. Check the bar and the forecast before you go out.',
  lake: 'Work the edges near timber, weed beds and drop-offs. Early morning and evening are best in warmer months.',
  fresh_river: 'Fish slow, deep holes and timber snags. Lures worked close to cover or baits on the bottom both work.',
};
export const howFor = (water) => HOW[water] ?? HOW.estuary;
