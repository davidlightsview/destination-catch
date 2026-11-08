import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&countryCode=AU`;
  try {
    const r = await fetch(url, { next: { revalidate: 86400 } });
    const j = await r.json();
    const results = (j.results ?? []).map((p: any) => ({
      name: p.name, state: p.admin1 ?? '', lat: p.latitude, lon: p.longitude,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: 'Place search is not available right now.' }, { status: 502 });
  }
}
