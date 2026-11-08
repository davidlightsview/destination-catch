// Smooth tide curve for the next 24 hours, built from high and low times.
type Ex = { time: string; height: number; type?: 'high' | 'low' };
const ms = (s: string) => Date.parse(s.slice(0, 16) + ':00Z');

export function TideChart({ extremes, now }: { extremes: Ex[]; now: string }) {
  const t0 = ms(now) - 2 * 3600e3;
  const t1 = t0 + 24 * 3600e3;
  const ex = extremes.filter((e) => Number.isFinite(e.height)).sort((a, b) => ms(a.time) - ms(b.time));
  if (ex.length < 2) return null;

  // Cosine interpolation between each high and low.
  const heightAt = (t: number) => {
    const i = ex.findIndex((e) => ms(e.time) > t);
    if (i <= 0) return null;
    const a = ex[i - 1], b = ex[i];
    const f = (t - ms(a.time)) / (ms(b.time) - ms(a.time));
    return a.height + (b.height - a.height) * (1 - Math.cos(Math.PI * f)) / 2;
  };

  const W = 640, H = 150, padT = 26, padB = 26;
  const pts: [number, number][] = [];
  for (let t = t0; t <= t1; t += 15 * 60e3) { const h = heightAt(t); if (h != null) pts.push([t, h]); }
  if (pts.length < 4) return null;
  const hs = ex.map((e) => e.height);
  const lo = Math.min(...hs), hi = Math.max(...hs), span = hi - lo || 1;
  const x = (t: number) => ((t - t0) / (t1 - t0)) * W;
  const y = (h: number) => padT + (1 - (h - lo) / span) * (H - padT - padB);
  const line = pts.map(([t, h], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(h).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts[pts.length - 1][0]).toFixed(1)},${H} L${x(pts[0][0]).toFixed(1)},${H} Z`;
  const nowX = x(ms(now));
  const nowH = heightAt(ms(now));
  const marks = ex.filter((e) => ms(e.time) >= t0 && ms(e.time) <= t1);

  return (
    <svg className="tide-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tide height over the next 24 hours">
      <defs>
        <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fb3b3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#5fb3b3" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#tideFill)" />
      <path d={line} fill="none" stroke="#5fb3b3" strokeWidth="3" strokeLinecap="round" />
      {marks.map((e) => (
        <g key={e.time} transform={`translate(${x(ms(e.time)).toFixed(1)},${y(e.height).toFixed(1)})`}>
          <circle r="4" fill="#f5efe1" />
          <text y={e.type === 'high' ? -10 : 18} textAnchor="middle" className="tide-label">
            {e.type === 'high' ? 'High' : 'Low'} {e.time.slice(11, 16)}
          </text>
        </g>
      ))}
      {nowX >= 0 && nowX <= W && (
        <g>
          <line x1={nowX} x2={nowX} y1={8} y2={H} stroke="#e8571e" strokeWidth="2" strokeDasharray="4 4" />
          {nowH != null && <circle cx={nowX} cy={y(nowH)} r="6" fill="#e8571e" stroke="#0b2f3c" strokeWidth="2" />}
          <text x={Math.min(Math.max(nowX, 24), W - 24)} y={12} textAnchor="middle" className="tide-now">Now</text>
        </g>
      )}
    </svg>
  );
}
