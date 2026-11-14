import { NextResponse } from 'next/server';
import { stripe, stripeReady } from '@/lib/stripe';
import { PRO_COOKIE, PRO_DAYS, cleanCode, emailHash, expiryFrom, findGift, fmtDate, signPro } from '@/lib/gift';

export const dynamic = 'force-dynamic';
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!stripeReady()) return bad('Memberships open on 1 December.', 503);
  const b = await req.json().catch(() => ({}));
  const code = cleanCode(String(b.code ?? ''));
  const email = String(b.email ?? '').trim();
  if (code.length !== 10) return bad('That code doesn\'t look right. It\'s 10 letters and numbers.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('Enter your email so you can get back in on another phone.');
  try {
    const g = await findGift(code);
    if (!g) return bad('We can\'t find that code. If it was bought in the last minute or two, try again shortly.', 404);
    if (g.refunded) return bad('This gift was refunded, so the code no longer works.', 410);
    const hash = emailHash(email);
    let until: number;
    if (g.meta.redeemed_at) {
      // Already started: the same email can sign back in on another device.
      if (g.meta.redeemed_by !== hash) return bad('This code has already been used with a different email.', 409);
      until = Number(g.meta.pro_until);
      if (!(until > Date.now())) return bad('This membership year has finished.', 410);
    } else {
      if (expiryFrom(g.created).getTime() < Date.now()) return bad('This gift code has expired.', 410);
      until = Date.now() + PRO_DAYS * 864e5;
      await stripe('POST', `/payment_intents/${g.id}`, { metadata: { redeemed_at: new Date().toISOString(), redeemed_by: hash, pro_until: until } });
    }
    const res = NextResponse.json({ ok: true, until: fmtDate(new Date(until)) });
    res.cookies.set(PRO_COOKIE, signPro(code, until), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires: new Date(until) });
    return res;
  } catch (e: any) {
    return bad(e.message ?? 'Something went wrong. Try again.', 502);
  }
}
