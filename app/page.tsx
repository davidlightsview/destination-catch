'use client';
import { useEffect, useState } from 'react';

type Place = { name: string; state: string; lat: number; lon: number };

const WEATHER: Record<number, string> = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' };
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const dir = (d: number | null) => (d == null ? '' : COMPASS[Math.round(d / 45) % 8]);
const n = (v: number | null | undefined, dp = 0) => (v == null ? '–' : v.toFixed(dp));
const hhmm = (s: string | null | undefined) => (s ? s.slice(11, 16) : '–');
const LABEL: Record<string, string> = { go: 'Worth going', marginal: 'Marginal', no: "Don't bother" };
const MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Home() {
  const [q, setQ] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [where, setWhere] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (q.trim().length < 2) { setPlaces([]); return; }
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`); const j = await r.json(); setPlaces(j.results ?? []); } catch { setPlaces([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  async function load(lat: number, lon: number, label: string) {
    setBusy(true); setErr(''); setPlaces([]); setWhere(label);
    try {
      const r = await fetch(`/api/plan?lat=${lat}&lon=${lon}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Something went wrong.');
      setPlan(j);
    } catch (e: any) { setErr(e.message); setPlan(null); }
    finally { setBusy(false); }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setErr('Your browser does not share location. Search for a place instead.'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => load(p.coords.latitude, p.coords.longitude, 'Your location'),
      () => { setBusy(false); setErr('Location was blocked. Search for a place instead.'); },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  const c = plan?.conditions;
  const mapUrl = MAPBOX && plan?.spots?.length
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${plan.spots.map((s: any, i: number) => `pin-s-${i + 1}+d9541e(${s.lon},${s.lat})`).join(',')}/auto/800x450@2x?padding=60&access_token=${MAPBOX}`
    : null;

  return (
    <main>
      <header style={{ display: 'grid', gap: 6 }}>
        <span className="eyebrow">Destination Catch · Preview</span>
        <h1>Where should I fish?</h1>
        <p className="muted">Pick a place or use your location. You'll get spots ranked for right now, what to target, what to use and the conditions.</p>
      </header>

      <section className="card" aria-label="Choose a location">
        <div className="search">
          <label htmlFor="place" className="eyebrow" style={{ flexBasis: '100%' }}>Town, beach or river</label>
          <input id="place" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Marlo, Lakes Entrance, Port Phillip" autoComplete="off" />
          <button className="btn" type="button" onClick={useMyLocation} disabled={busy}>Use my location</button>
        </div>
        {places.length > 0 && (
          <div className="results" role="listbox">
            {places.map((p) => (
              <button key={`${p.lat},${p.lon}`} type="button" onClick={() => { setQ(`${p.name}, ${p.state}`); load(p.lat, p.lon, `${p.name}, ${p.state}`); }}>
                {p.name} <span className="muted">{p.state}</span>
              </button>
            ))}
          </div>
        )}
        {busy && <p className="muted">Checking conditions…</p>}
        {err && <p className="error">{err}</p>}
      </section>

      {plan && c && (
        <>
          <section className="card" aria-label="Conditions">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>Conditions</h2><span className="eyebrow">{where} · {c.nowLocal.slice(11, 16)}</span>
            </div>
            <div className="stats">
              <div className="stat"><b>{n(c.current.tempC)}°</b><span>{WEATHER[c.current.weatherCode] ?? 'Weather'}</span></div>
              <div className="stat"><b>{n(c.current.windKmh)} km/h</b><span>Wind {dir(c.current.windFromDeg)}, gusts {n(c.current.gustKmh)}</span></div>
              <div className="stat"><b>{n(c.current.swellM, 1)} m</b><span>Swell {dir(c.current.swellFromDeg)} {c.current.swellPeriodS ? `${n(c.current.swellPeriodS)} s` : ''}</span></div>
              <div className="stat"><b>{c.tides.phaseNow ? c.tides.phaseNow[0].toUpperCase() + c.tides.phaseNow.slice(1) : '–'}</b><span>Tide now</span></div>
              <div className="stat"><b>{hhmm(c.sun.sunrise)} / {hhmm(c.sun.sunset)}</b><span>Sunrise / sunset</span></div>
            </div>
            {c.tides.extremes.length > 0 && (
              <div className="tides">
                {c.tides.extremes.filter((e: any) => e.time >= c.nowLocal.slice(0, 13)).slice(0, 4).map((e: any) => (
                  <span key={e.time}><b>{e.type === 'high' ? 'High' : 'Low'}</b> <span className="mono">{e.time.slice(11, 16)}</span> {e.time.slice(0, 10) !== c.nowLocal.slice(0, 10) ? 'tmrw ' : ''}<span className="muted">{n(e.height, 1)} m</span></span>
                ))}
              </div>
            )}
            {c.tides.source === 'modelled' && <p className="warn">Tide times are modelled and can be well out near estuaries. Proper tide tables arrive once the WillyWeather key is set.</p>}
            {c.tides.source === 'none' && <p className="warn">No tide data for this spot yet.</p>}
            <details>
              <summary>Next 24 hours</summary>
              <div className="hours"><table>
                <thead><tr><th>Time</th><th>Wind</th><th>Gusts</th><th>Swell</th><th>Rain</th><th>Temp</th></tr></thead>
                <tbody>{c.hours.filter((_: any, i: number) => i % 2 === 0).map((h: any) => (
                  <tr key={h.time}><td className="mono">{h.time.slice(11, 16)}</td><td>{n(h.windKmh)} {dir(h.windFromDeg)}</td><td>{n(h.gustKmh)}</td><td>{n(h.swellM, 1)} m</td><td>{n(h.rainChance)}%</td><td>{n(h.tempC)}°</td></tr>
                ))}</tbody>
              </table></div>
            </details>
          </section>

          {plan.coverageNote && <p className="warn">{plan.coverageNote} We're adding spots region by region.</p>}

          {plan.spots.length > 0 && (
            <section style={{ display: 'grid', gap: 12 }} aria-label="Spots">
              <h2>Best spots right now</h2>
              {mapUrl && <img className="map" src={mapUrl} alt="Satellite map with the numbered spots" width={800} height={450} />}
              {plan.spots.map((s: any, i: number) => (
                <article className="card" key={s.id}>
                  <div className="spot-head">
                    <div style={{ display: 'grid', gap: 4 }}>
                      <h3>{i + 1}. {s.name}</h3>
                      <span className="eyebrow">{s.water} · {s.access === 'boat' ? 'boat or kayak' : 'land-based'} · {s.distanceKm < 0.1 ? "right here" : `${s.distanceKm.toFixed(s.distanceKm < 10 ? 1 : 0)} km`}</span>
                    </div>
                    <span className={`badge ${s.rating}`}>{LABEL[s.rating]}</span>
                  </div>
                  <ul className="reasons">{s.reasons.map((r: string) => <li key={r}>{r}</li>)}</ul>
                  <p>{s.how}</p>
                  <p className="muted" style={{ fontSize: 14 }}>{s.getThere}</p>
                  <div className="row">{s.targets.map((t: any) => <span key={t.id} className={`chip ${t.inSeason ? '' : 'off'}`}>{t.name}</span>)}</div>
                  <details>
                    <summary>Gear and rules for these fish</summary>
                    <div className="fish">{s.targets.map((t: any) => (
                      <div className="fish-row" key={t.id}>
                        <b>{t.name} <i className="muted" style={{ fontWeight: 400 }}>{t.sci}</i>{!t.inSeason && <span className="muted"> · quieter this month</span>}</b>
                        <span>{t.gear}</span>
                        <span className="muted">Bait/lures: {t.bait}</span>
                        <span className="mono" style={{ fontSize: 13 }}>Min {t.minSize} · Bag {t.bag}</span>
                      </div>
                    ))}</div>
                  </details>
                  <div className="row" style={{ fontSize: 14 }}>
                    <span className="mono">{s.lat.toFixed(5)}, {s.lon.toFixed(5)}</span>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`} target="_blank" rel="noopener">Directions</a>
                    {s.status !== 'verified' && <span className="muted">· position from imagery, not yet checked on site</span>}
                  </div>
                </article>
              ))}
            </section>
          )}

          <footer>
            <span>{c.sources.join(' · ')}</span>
            <span>Rules: {plan.rulesSource} Always check the current rules with your state fisheries agency.</span>
            <span>Conditions change fast on the coast. Never fish alone off rocks or in big surf, and wear a lifejacket on boats.</span>
          </footer>
        </>
      )}
    </main>
  );
}
