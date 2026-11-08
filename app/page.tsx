'use client';
import { useEffect, useState } from 'react';
import { Logo } from './components/Logo';
import { TideChart } from './components/TideChart';

type Place = { name: string; state: string; lat: number; lon: number };

const WEATHER: Record<number, string> = { 0: 'Clear skies', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorms', 96: 'Thunderstorms', 99: 'Thunderstorms' };
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const dir = (d: number | null | undefined) => (d == null ? '' : COMPASS[Math.round(d / 45) % 8]);
const n = (v: number | null | undefined, dp = 0) => (v == null ? '–' : v.toFixed(dp));
const hhmm = (s: string | null | undefined) => (s ? s.slice(11, 16) : '–');
const VERDICT: Record<string, { label: string; line: string }> = {
  go: { label: 'Good to go', line: 'Conditions are on your side.' },
  marginal: { label: 'Worth a crack', line: 'Fishable, but not perfect.' },
  no: { label: 'Give it a miss', line: 'Not worth the trip right now.' },
};
const WATER: Record<string, string> = { estuary: 'Estuary', surf: 'Surf beach', beach: 'Beach', river: 'River', entrance: 'River mouth', jetty: 'Jetty', rock: 'Rock wall', ramp: 'Boat ramp', lake: 'Lake', fresh_river: 'River' };
const ART = new Set(['king-george-whiting', 'snapper', 'sand-whiting', 'australian-salmon', 'tailor', 'gummy-shark', 'black-bream', 'dusky-flathead', 'estuary-perch', 'luderick', 'yellow-eye-mullet']);

function FishPic({ id, name }: { id: string; name: string }) {
  if (ART.has(id)) return <img src={`/species/${id}.webp`} alt={name} loading="lazy" />;
  return (
    <svg className="fish-outline" viewBox="0 0 120 50" role="img" aria-label={name}>
      <path d="M8 25c14-15 40-19 62-12 8 2 16 6 22 11l18-12-5 13 5 13-18-12c-6 5-14 9-22 11-22 7-48 3-62-12z" fill="#9cc4c0" />
      <circle cx="22" cy="23" r="2.6" fill="#0b2f3c" />
    </svg>
  );
}
const MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const QUICK: Place[] = [
  { name: 'Marlo', state: 'Victoria', lat: -37.7985, lon: 148.5335 },
  { name: 'Lakes Entrance', state: 'Victoria', lat: -37.8668, lon: 148.0016 },
  { name: 'Portland', state: 'Victoria', lat: -38.3423, lon: 141.6046 },
];
const SHOWCASE = [
  ['australian-salmon', 'Australian salmon'], ['dusky-flathead', 'Dusky flathead'], ['black-bream', 'Black bream'], ['tailor', 'Tailor'],
  ['estuary-perch', 'Estuary perch'], ['gummy-shark', 'Gummy shark'], ['luderick', 'Luderick'], ['yellow-eye-mullet', 'Yellow-eye mullet'],
];

function Arrow({ from }: { from: number | null | undefined }) {
  if (from == null) return null;
  // Wind "from" a bearing blows toward the opposite side.
  return (
    <svg className="arrow" viewBox="0 0 24 24" style={{ transform: `rotate(${(from + 180) % 360}deg)` }} aria-hidden="true">
      <path d="M12 2l6 10h-4v10h-4V12H6z" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [q, setQ] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [where, setWhere] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [searching, setSearching] = useState(false);
  const [noMatch, setNoMatch] = useState('');
  const [picked, setPicked] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  async function geocode(text: string): Promise<Place[]> {
    const r = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
    if (!r.ok) throw new Error('Place search is down right now. Try again in a minute.');
    const j = await r.json();
    return j.results ?? [];
  }

  useEffect(() => {
    setNoMatch('');
    if (picked || q.trim().length < 3) { setPlaces([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { const res = await geocode(q); setPlaces(res); if (!res.length) setNoMatch(q.trim()); }
      catch { setPlaces([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [q, picked]);

  async function load(lat: number, lon: number, label: string) {
    setBusy(true); setErr(''); setPlaces([]); setWhere(label); setMapFailed(false);
    try {
      const r = await fetch(`/api/plan?lat=${lat}&lon=${lon}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Something went wrong. Try again.');
      setPlan(j);
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e: any) { setErr(e.message); setPlan(null); }
    finally { setBusy(false); }
  }

  function choose(p: Place) {
    const label = `${p.name}, ${p.state}`;
    setPicked(true); setQ(label); setPlaces([]);
    load(p.lat, p.lon, label);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = q.trim();
    if (text.length < 2) { setErr('Type a town, beach or river first.'); return; }
    if (places.length) { choose(places[0]); return; }
    setSearching(true); setErr('');
    try { const res = await geocode(text); if (res.length) choose(res[0]); else setNoMatch(text); }
    catch (e: any) { setErr(e.message); }
    finally { setSearching(false); }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setErr("Your phone isn't sharing location. Type a place instead."); return; }
    setBusy(true); setErr('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPicked(true); setQ('My location'); load(p.coords.latitude, p.coords.longitude, 'Your location'); },
      () => { setBusy(false); setErr('Location is turned off for this site. Type a place instead.'); },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  const c = plan?.conditions;
  const best = plan?.spots?.[0];
  const loc = plan?.location;
  const mapUrl = MAPBOX && plan
    ? plan.spots.length
      ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${plan.spots.map((s: any, i: number) => `pin-l-${i + 1}+e8571e(${s.lon.toFixed(5)},${s.lat.toFixed(5)})`).join(',')}/auto/900x500@2x?padding=70&access_token=${MAPBOX}`
      : `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-l+e8571e(${loc.lon.toFixed(5)},${loc.lat.toFixed(5)})/${loc.lon.toFixed(5)},${loc.lat.toFixed(5)},11/900x500@2x?access_token=${MAPBOX}`
    : null;

  return (
    <>
      <header className="hero">
        <div className="wrap hero-inner">
          <Logo light />
          <h1>Where are they <span>biting?</span></h1>
          <p className="hero-sub">Tell us where you're fishing. We'll show you the best spots right now, what you'll catch, what to rig up with, and whether it's worth heading out.</p>

          <form className="search" onSubmit={onSubmit} role="search">
            <label htmlFor="place" className="sr-only">Town, beach or river</label>
            <input id="place" type="search" enterKeyHint="search" value={q}
              onChange={(e) => { setPicked(false); setQ(e.target.value); }}
              placeholder="Town, beach or river" autoComplete="off" />
            <button className="btn btn-lure" type="submit" disabled={busy || searching}>{busy ? 'Checking…' : 'Find spots'}</button>
            {places.length > 0 && (
              <div className="suggest" role="listbox" aria-label="Matching places">
                {places.map((p) => (
                  <button key={`${p.lat},${p.lon}`} type="button" role="option" aria-selected="false" onClick={() => choose(p)}>
                    <b>{p.name}</b> <span>{p.state}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
          <div className="hero-actions">
            <button className="btn btn-ghost" type="button" onClick={useMyLocation} disabled={busy}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" /></svg>
              Use where I am
            </button>
            <span className="try">Try: {QUICK.map((p, i) => (
              <button key={p.name} type="button" className="link" onClick={() => choose(p)}>{p.name}{i < QUICK.length - 1 ? ',' : ''}</button>
            ))}</span>
          </div>
          {searching && <p className="hero-note">Looking up places…</p>}
          {noMatch && !searching && !places.length && <p className="hero-note warn-text">Couldn't find "{noMatch}". Try the nearest town.</p>}
          {err && <p className="hero-note warn-text">{err}</p>}
        </div>
        <div className="hero-fish" aria-hidden="true">
          <img src="/species/australian-salmon.webp" alt="" className="f1" />
          <img src="/species/dusky-flathead.webp" alt="" className="f2" />
          <img src="/species/tailor.webp" alt="" className="f3" />
        </div>
        <svg className="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30c120-24 240-24 360 0s240 24 360 0 240-24 360 0 240 24 360 0v30H0z" fill="var(--paper)" /></svg>
      </header>

      <main className="wrap">
        {!plan && !busy && (
          <section className="intro">
            <h2>What's swimming around here</h2>
            <p className="lead">From the surf to the snags. Each spot tells you what's on, the gear that works, and the legal size so you keep the right ones.</p>
            <div className="showcase">
              {SHOWCASE.map(([id, name]) => (
                <figure key={id}><img src={`/species/${id}.webp`} alt={name} loading="lazy" /><figcaption>{name}</figcaption></figure>
              ))}
            </div>
          </section>
        )}

        {busy && !plan && <div className="loading"><img src="/species/australian-salmon.webp" alt="" className="swim" /><p>Checking the wind, swell and tides…</p></div>}

        {plan && c && (
          <div id="results" className="results">
            {best ? (
              <section className={`verdict v-${best.rating}`}>
                <div>
                  <span className="kicker">Best bet near {where.split(',')[0]} right now</span>
                  <h2>{best.name}</h2>
                  <p>{VERDICT[best.rating].line}</p>
                </div>
                <span className="verdict-badge">{VERDICT[best.rating].label}</span>
              </section>
            ) : (
              <section className="verdict v-none">
                <div>
                  <span className="kicker">{where}</span>
                  <h2>No fishing spots found nearby</h2>
                  <p>{plan.coverageNote}</p>
                </div>
              </section>
            )}

            <section className="panel conditions">
              <div className="panel-head"><h2>On the water now</h2><span className="when">{where} · {hhmm(c.nowLocal)}</span></div>
              <div className="tiles">
                <div className="tile"><span className="t-label">Wind</span><span className="t-big"><Arrow from={c.current.windFromDeg} />{n(c.current.windKmh)}<small>km/h</small></span><span className="t-sub">From the {dir(c.current.windFromDeg)}, gusts {n(c.current.gustKmh)}</span></div>
                <div className="tile"><span className="t-label">Swell</span><span className="t-big">{n(c.current.swellM, 1)}<small>m</small></span><span className="t-sub">{c.current.swellPeriodS ? `${n(c.current.swellPeriodS)} sec from the ${dir(c.current.swellFromDeg)}` : 'No swell reading'}</span></div>
                <div className="tile"><span className="t-label">Weather</span><span className="t-big">{n(c.current.tempC)}°</span><span className="t-sub">{WEATHER[c.current.weatherCode] ?? ''}</span></div>
                <div className="tile"><span className="t-label">Sun</span><span className="t-big t-mid">{hhmm(c.sun.sunrise)}<small>–</small>{hhmm(c.sun.sunset)}</span><span className="t-sub">First and last light bite best</span></div>
              </div>
              <div className="tide">
                <div className="tide-head">
                  <span className="t-label">Tide</span>
                  <b>{c.tides.phaseNow === 'rising' ? 'Coming in' : c.tides.phaseNow === 'falling' ? 'Going out' : c.tides.phaseNow === 'slack' ? 'Turning (slack)' : 'Unknown'}</b>
                  {c.tides.source === 'willyweather' && c.tides.stationName && <span className="t-sub">Times for {c.tides.stationName}</span>}
                  {c.tides.source === 'modelled' && <span className="t-sub warn-text">Rough estimate only. No tide station nearby.</span>}
                </div>
                <TideChart extremes={c.tides.extremes} now={c.nowLocal} />
              </div>
              <div className="hours" aria-label="Next 24 hours">
                {c.hours.filter((_: any, i: number) => i % 2 === 0).map((h: any) => (
                  <div className="hour" key={h.time}>
                    <span className="h-time">{h.time.slice(11, 16)}</span>
                    <span className="h-wind"><Arrow from={h.windFromDeg} />{n(h.windKmh)}</span>
                    <span className="h-swell">{n(h.swellM, 1)} m</span>
                    <span className="h-rain">{n(h.rainChance)}% rain</span>
                  </div>
                ))}
              </div>
            </section>

            {mapUrl && !mapFailed && (
              <section className="map-wrap">
                <img className="map" src={mapUrl} alt={plan.spots.length ? 'Satellite map with the numbered spots' : `Satellite map of ${where}`} width={900} height={500} onError={() => setMapFailed(true)} />
                {plan.spots.length > 0 && <span className="map-key">Numbers match the spots below</span>}
              </section>
            )}

            {plan.spots.length > 0 && (
              <section className="spots">
                <h2 className="section-title">Spots, best first</h2>
                {plan.spots.map((s: any, i: number) => (
                  <article className={`spot r-${s.rating}`} key={s.id}>
                    <div className="spot-top">
                      <span className="pin-no">{i + 1}</span>
                      <div className="spot-name">
                        <h3>{s.name}</h3>
                        <span className="spot-meta">{WATER[s.water] ?? s.water} · {s.access === 'boat' ? 'Boat or kayak' : 'From the shore'} · {s.distanceKm < 0.1 ? 'Right here' : `${s.distanceKm.toFixed(s.distanceKm < 10 ? 1 : 0)} km away`}</span>
                      </div>
                      <span className={`rating rating-${s.rating}`}>{VERDICT[s.rating].label}</span>
                    </div>
                    <ul className="why">{s.reasons.map((r: string) => <li key={r}>{r}</li>)}</ul>

                    <div className="catch">
                      {s.targets.map((t: any) => (
                        <figure key={t.id} className={t.inSeason ? '' : 'quiet'}>
                          <FishPic id={t.id} name={t.name} />
                          <figcaption>{t.name}{t.closed ? <small className="closed">Closed season</small> : !t.inSeason && <small>Quieter this month</small>}</figcaption>
                        </figure>
                      ))}
                    </div>

                    <div className="how"><h4>How to fish it</h4><p>{s.how}</p><p className="getting">{s.getThere}</p></div>

                    <details className="rig">
                      <summary>Gear, bait and legal sizes</summary>
                      {s.targets.map((t: any) => (
                        <div className="rig-row" key={t.id}>
                          <FishPic id={t.id} name="" />
                          <div>
                            <h5>{t.name}</h5>
                            {t.closedNote && <p className="closed-note">{t.closedNote}</p>}
                            <p>{t.gear}</p>
                            <p className="bait"><b>Bait and lures:</b> {t.bait}</p>
                            {t.minSize ? <p className="legal"><span>Keep from {t.minSize}</span><span>Bag {t.bag}</span></p>
                              : plan.agency ? <p className="legal-link">Size and bag limits: <a href={plan.agency.url} target="_blank" rel="noopener">check {plan.agency.name}</a></p> : null}
                          </div>
                        </div>
                      ))}
                    </details>

                    <div className="spot-foot">
                      <a className="btn btn-dark" href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`} target="_blank" rel="noopener">Take me there</a>
                      {s.status === 'osm' && <span className="unverified">Found on the map. Not yet checked by us.</span>}
                      {s.status === 'imagery' && <span className="unverified">Spot location not yet checked on site</span>}
                    </div>
                  </article>
                ))}
              </section>
            )}

            <footer className="foot">
              <p><b>Stay safe.</b> Conditions change fast on the coast. Never fish rocks or big surf alone, and wear a lifejacket in boats and kayaks.</p>
              <p>Bag and size limits: {plan.rulesSource ? `${plan.rulesSource} ` : ''}{plan.agency ? <>Always check current rules with <a href={plan.agency.url} target="_blank" rel="noopener">{plan.agency.name}</a>.</> : 'Always check current rules with your state fisheries agency.'}</p>
              {plan.attribution && <p className="small">{plan.attribution}</p>}
              <p className="small">{c.sources.join(' · ')}</p>
            </footer>
          </div>
        )}
      </main>
    </>
  );
}
