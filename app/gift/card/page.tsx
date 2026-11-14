import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { LogoMark } from '../../components/Logo';
import CardActions from './CardActions';
import Bought from './Bought';
import { stripe, stripeReady } from '@/lib/stripe';
import { APP_TAG, expiryFrom, fmtDate, showCode } from '@/lib/gift';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your Destination Catch gift card', robots: { index: false } };

function Problem({ text }: { text: string }) {
  return <main className="wrap gift-main"><section className="gpanel"><h2>We couldn't show the card</h2><p>{text}</p><p><Link href="/gift">Back to gift memberships</Link></p></section></main>;
}

export default async function CardPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const id = searchParams.session_id ?? '';
  if (!stripeReady() || !/^cs_[A-Za-z0-9_]+$/.test(id)) return <Problem text="This link isn't a valid gift card link." />;
  let s: any;
  try { s = await stripe('GET', `/checkout/sessions/${id}`); } catch { return <Problem text="We couldn't find that purchase. Check the link and try again." />; }
  if (s.metadata?.app !== APP_TAG) return <Problem text="This link isn't a valid gift card link." />;
  if (s.payment_status !== 'paid') return <Problem text="The payment didn't go through, so no card was made. You haven't been charged." />;

  const m = s.metadata as Record<string, string>;
  const h = headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
  const link = `${origin}/redeem?c=${m.gift_code}`;
  const qr = await QRCode.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b2f3c', light: '#ffffff' } });
  const expiry = fmtDate(expiryFrom(new Date(s.created * 1000)));
  const self = m.kind === 'self';

  return (
    <main className="wrap gift-main card-main">
      <div className="no-print card-intro">
        <h1>{self ? "You're a Founder" : 'Your gift card is ready'}</h1>
        <p>{self ? 'Thanks for backing us early. Tap the button to start your year of Pro.' : 'Paid, thanks. Print this card or send the link now, and keep this page bookmarked until the gift has been given.'}</p>
      </div>

      <article className="gift-card">
        <div className="gc-top">
          <LogoMark size={52} />
          <div><p className="gc-brand">Destination Catch</p><p className="gc-what">A year of Pro</p></div>
        </div>
        {(m.gift_to || m.gift_from) && !self && (
          <p className="gc-names">{m.gift_to && <>To <b>{m.gift_to}</b></>}{m.gift_to && m.gift_from && <br />}{m.gift_from && <>From <b>{m.gift_from}</b></>}</p>
        )}
        <div className="gc-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="gc-scan">Scan with your phone camera to start your year</p>
        <p className="gc-code">Code <b>{showCode(m.gift_code)}</b></p>
        <p className="gc-small">Or go to {origin.replace(/^https?:\/\//, '')}/redeem and type in the code. Use it by {expiry}. Your year of Pro starts the day you scan. No fees, no renewal.</p>
      </article>

      <CardActions link={link} self={self} />
      <Bought id={s.id} value={(s.amount_total ?? 3999) / 100} />
    </main>
  );
}
