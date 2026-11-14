// Minimal Stripe client over fetch: no SDK, and the key never leaves the server.
const API = 'https://api.stripe.com/v1';

export const stripeReady = () => !!process.env.STRIPE_SECRET_KEY;

function form(obj: Record<string, any>, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out); else out.append(key, String(v));
  }
  return out;
}

export async function stripe(method: 'GET' | 'POST', path: string, params?: Record<string, any>) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Payments are not set up yet.');
  const body = params ? form(params) : undefined;
  const url = method === 'GET' && body ? `${API}${path}?${body}` : `${API}${path}`;
  const r = await fetch(url, {
    method, cache: 'no-store',
    headers: { Authorization: `Bearer ${key}`, ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: method === 'POST' ? body : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message ?? 'Payment service error.');
  return j;
}
