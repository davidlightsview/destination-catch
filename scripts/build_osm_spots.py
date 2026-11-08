#!/usr/bin/env python3
"""Build data/osm-au.json: likely fishing spots across Australia from an OpenStreetMap extract.

Input: a filtered .osm.pbf (see .github/workflows/osm-spots.yml). Data © OpenStreetMap contributors, ODbL.
Output: {"v":1,"built":..., "types":[...], "states":[...], "s":[[lat, lon, typeIdx, name, stateIdx], ...]}
"""
import json, math, sys, datetime
import osmium
from shapely.geometry import Point, Polygon, MultiPolygon
from shapely.strtree import STRtree

TYPES = ['fishing', 'jetty', 'rock', 'ramp', 'beach', 'river', 'lake', 'lagoon']
T = {t: i for i, t in enumerate(TYPES)}
LAKE_WORDS = ('lake', 'lagoon', 'reservoir', 'dam', 'weir', 'billabong', 'pond', 'waterhole')


def km(a, b, c, d):
    r = math.pi / 180
    x = (d - b) * r * math.cos((a + c) / 2 * r)
    y = (c - a) * r
    return 6371 * math.hypot(x, y)


class H(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.spots = []        # (lat, lon, type, name)
        self.rivers = {}       # name -> list of (lat, lon)
        self.states = []       # (name, shapely geom)

    def add(self, lat, lon, t, name):
        if -45 < lat < -9 and 112 < lon < 155:
            self.spots.append((round(lat, 4), round(lon, 4), t, name or ''))

    @staticmethod
    def kind(tags, closed_area=False):
        if tags.get('leisure') == 'fishing':
            return 'fishing'
        mm = tags.get('man_made')
        if mm in ('pier', 'jetty'):
            return 'jetty'
        if mm in ('breakwater', 'groyne'):
            return 'rock'
        if tags.get('leisure') == 'slipway':
            return 'ramp'
        return None

    def node(self, n):
        k = self.kind(n.tags)
        if k:
            self.add(n.location.lat, n.location.lon, k, n.tags.get('name'))
        elif n.tags.get('natural') == 'beach' and n.tags.get('name'):
            self.add(n.location.lat, n.location.lon, 'beach', n.tags.get('name'))

    def way(self, w):
        tags = w.tags
        try:
            pts = [(nd.location.lat, nd.location.lon) for nd in w.nodes if nd.location.valid()]
        except osmium.InvalidLocationError:
            return
        if not pts:
            return
        if tags.get('waterway') == 'river' and tags.get('name'):
            self.rivers.setdefault(tags['name'], []).extend(pts[:: max(1, len(pts) // 20)] + [pts[-1]])
            return
        k = self.kind(tags)
        if k:
            # For a jetty or wall use the far end (the water end is usually the last node drawn); else the middle.
            lat = sum(p[0] for p in pts) / len(pts)
            lon = sum(p[1] for p in pts) / len(pts)
            self.add(lat, lon, k, tags.get('name'))

    def area(self, a):
        tags = a.tags
        nat = tags.get('natural')
        boundary = tags.get('boundary') == 'administrative' and tags.get('admin_level') == '4'
        if not (nat in ('beach', 'water') or boundary):
            return
        name = tags.get('name')
        if nat == 'beach' and not name:
            return
        if nat == 'water':
            if not name:
                return
            w = tags.get('water', '')
            if w in ('lagoon',):
                t = 'lagoon'
            elif w in ('lake', 'reservoir', 'oxbow') or any(x in name.lower() for x in LAKE_WORDS):
                t = 'lake'
            elif w == 'river':
                return  # river polygons duplicate the river line
            else:
                return
        else:
            t = 'beach'
        polys = []
        try:
            for outer in a.outer_rings():
                ring = [(n.lon, n.lat) for n in outer if n.location.valid()]
                if len(ring) >= 4:
                    polys.append(Polygon(ring))
        except osmium.InvalidLocationError:
            return
        if not polys:
            return
        if boundary:
            g = MultiPolygon(polys) if len(polys) > 1 else polys[0]
            self.states.append((tags.get('name:en') or name, g.buffer(0)))
            return
        # Use the biggest piece; a point inside the water, else its centre.
        big = max(polys, key=lambda p: p.area)
        if big.area < 1e-6 and t == 'lake':
            return  # very small ponds
        c = big.representative_point() if t != 'beach' else big.centroid
        self.add(c.y, c.x, t, name)


def main(src, out):
    h = H()
    h.apply_file(src, locations=True, idx='flex_mem')

    # Rivers: keep points along each named river at least 4 km apart.
    for name, pts in h.rivers.items():
        kept = []
        for p in pts:
            if all(km(p[0], p[1], q[0], q[1]) > 4 for q in kept[-50:]):
                kept.append(p)
        for p in kept:
            h.add(p[0], p[1], 'river', name)

    # De-duplicate: same type within 120 m.
    seen = set()
    spots = []
    for s in h.spots:
        key = (s[2], round(s[0] / 0.001), round(s[1] / 0.0013))
        if key in seen:
            continue
        seen.add(key)
        spots.append(s)

    # State for every spot (nearest state polygon for points just offshore).
    names = [n for n, _ in h.states]
    geoms = [g for _, g in h.states]
    tree = STRtree(geoms) if geoms else None
    out_rows = []
    for lat, lon, t, name in spots:
        si = -1
        if tree is not None:
            p = Point(lon, lat)
            hit = tree.query(p, predicate='intersects')
            if len(hit):
                si = int(hit[0])
            else:
                si = int(tree.nearest(p))
        out_rows.append([lat, lon, T[t], name, si])

    doc = {
        'v': 1,
        'built': datetime.date.today().isoformat(),
        'source': 'OpenStreetMap contributors, ODbL',
        'types': TYPES,
        'states': names,
        's': out_rows,
    }
    with open(out, 'w') as f:
        json.dump(doc, f, separators=(',', ':'), ensure_ascii=False)
    counts = {}
    for r in out_rows:
        counts[TYPES[r[2]]] = counts.get(TYPES[r[2]], 0) + 1
    print('spots', len(out_rows), counts, 'states', names)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
