import { NextResponse } from 'next/server';
import { stripe, stripeReady } from '@/lib/stripe';
import { APP_TAG, PRICE_CENTS, PRODUCT, clip, expiryFrom, newCode } from '@/lib/gift';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!stripeReady()) return NextResponse.json({ error: 'Gift memberships open on 1 December.' }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const origin = new URL(req.url).origin;
  const meta = {
    app: APP_TAG,
    gift_code: newCode(),
    gift_to: clip(b.to), gift_from: clip(b.from),
    kind: b.kind === 'self' ? 'self' : 'gift',
    src: clip(b.src, 30),
    expires: expiryFrom(new Date()).toISOString().slice(0, 10),
  };
  try {
    const s = await stripe('POST', '/checkout/sessions', {
      mode: 'payment',
      line_items: { 0: { quantity: 1, price_data: { currency: 'aud', unit_amount: PRICE_CENTS, product_data: { name: PRODUCT } } } },
      metadata: meta,
      payment_intent_data: { metadata: meta, description: PRODUCT, statement_descriptor_suffix: 'DEST CATCH' },
      custom_text: { submit: { message: 'You get your gift card with its QR code straight after paying. Print it or forward it.' } },
      success_url: `${origin}/gift/card?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/gift`,
    });
    return NextResponse.json({ url: s.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Could not start the payment.' }, { status: 502 });
  }
}
