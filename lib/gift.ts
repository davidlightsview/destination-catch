// Gift memberships. Stripe is the record: the gift code and its redemption live in the payment's metadata,
// so there is no database to run. Gift card rules (ACCC): valid at least 3 years, expiry shown, no fees.
import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto';
import { stripe } from './stripe';

export const PRICE_CENTS = 3999;
export const PRICE_LABEL = 'A$39.99';
export const PRODUCT = "Destination Catch Founder's membership: 1 year of Pro";
export const APP_TAG = 'destination-catch';
export const VALID_YEARS = 3;
export const PRO_DAYS = 365;
export { SELLER } from './site';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I
export function newCode() {
  let s = '';
  for (let i = 0; i < 10; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}
export const showCode = (c: string) => `${c.slice(0, 5)}-${c.slice(5)}`;
export const cleanCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
export const clip = (s: unknown, n = 40) => String(s ?? '').replace(/[<>\n\r]/g, ' ').trim().slice(0, n);
export const emailHash = (e: string) => createHash('sha256').update(e.trim().toLowerCase()).digest('hex');
export const fmtDate = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne' });

export function expiryFrom(created: Date) {
  const d = new Date(created); d.setFullYear(d.getFullYear() + VALID_YEARS); return d;
}

// Find a paid gift by its code.
export async function findGift(code: string) {
  const res = await stripe('GET', '/payment_intents/search', {
    query: `metadata['gift_code']:'${code}' AND metadata['app']:'${APP_TAG}' AND status:'succeeded'`,
    limit: 1, 'expand[]': 'data.latest_charge',
  });
  const pi = res.data?.[0];
  if (!pi) return null;
  const refunded = !!pi.latest_charge && (pi.latest_charge.refunded || pi.latest_charge.amount_refunded > 0);
  return { id: pi.id as string, meta: (pi.metadata ?? {}) as Record<string, string>, created: new Date(pi.created * 1000), refunded };
}

// Signed "Pro" cookie. The signing key is derived from the Stripe key so there is one secret to manage.
export const PRO_COOKIE = 'dc_pro';
function sigKey() {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error('Not set up.');
  return createHmac('sha256', k).update('dc-pro-cookie-v1').digest();
}
export function signPro(code: string, until: number) {
  const body = Buffer.from(JSON.stringify({ c: code, u: until })).toString('base64url');
  return `${body}.${createHmac('sha256', sigKey()).update(body).digest('base64url')}`;
}
export function readPro(token?: string): { code: string; until: number } | null {
  if (!token || !process.env.STRIPE_SECRET_KEY) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const want = createHmac('sha256', sigKey()).update(body).digest();
  const got = Buffer.from(sig, 'base64url');
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const { c, u } = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof u === 'number' && u > Date.now() ? { code: c, until: u } : null;
  } catch { return null; }
}
