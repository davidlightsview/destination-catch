import { NextResponse } from 'next/server';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
const EPS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
async function time(ep: string, q: string) {
  const t = Date.now();
  try {
    const r = await fetch(`${ep}?data=${encodeURIComponent(q)}`, { headers: { 'User-Agent': 'DestinationCatch/0.1' }, signal: AbortSignal.timeout(25000), cache: 'no-store' });
    const txt = await r.text();
    return { host: new URL(ep).host, status: r.status, ms: Date.now() - t, bytes: txt.length, head: txt.slice(0, 120) };
  } catch (e: any) { return { host: new URL(ep).host, error: String(e?.message ?? e), ms: Date.now() - t }; }
}
export async function GET() {
  const tiny = '[out:json][timeout:10];node(1);out;';
  const bb = '(-38.0,147.83,-37.73,148.17)';
  const small = `[out:json][timeout:20];(nwr[man_made~"^(pier|jetty)$"]${bb};nwr[leisure=slipway]${bb};);out tags center 50;`;
  const res = await Promise.all(EPS.flatMap((ep) => [time(ep, tiny), time(ep, small)]));
  return NextResponse.json(res);
}
