import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '../components/Logo';
import GiftForm from './GiftForm';
import { stripeReady } from '@/lib/stripe';
import { PRICE_LABEL, SELLER, VALID_YEARS } from '@/lib/gift';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Give a year of Destination Catch: Founder's membership",
  description: `A Christmas present for the fisho in the family. ${PRICE_LABEL} for a year of Destination Catch Pro, on a card with a QR code.`,
};

export default function GiftPage() {
  return (
    <>
      <header className="hero hero-slim">
        <div className="wrap hero-inner">
          <Link href="/" className="logo-link" aria-label="Destination Catch home"><Logo light /></Link>
          <h1>A present for <span>the fisho</span></h1>
          <p className="hero-sub">A Founder's membership: a year of Destination Catch Pro for {PRICE_LABEL}. You get a card with a QR code to print or send. They scan it and their year starts.</p>
        </div>
      </header>
      <main className="wrap gift-main">
        <section className="gpanel">
          <GiftForm open={stripeReady()} price={PRICE_LABEL} />
        </section>

        <section className="gpanel">
          <h2>How it works</h2>
          <ol className="steps">
            <li><b>Pay online.</b> It takes about a minute.</li>
            <li><b>Get the card.</b> It shows straight away, ready to print at home or forward by text or email. Fine for a last-minute present.</li>
            <li><b>They scan the QR code.</b> Their year of Pro starts the day they scan it, so Christmas morning works.</li>
          </ol>
        </section>

        <section className="gpanel">
          <h2>What a Founder gets</h2>
          <ul className="ticks">
            <li>Plan My Fishing Trip: where to go, when, and what to take</li>
            <li>The best times to fish for the next 7 days</li>
            <li>More detail on local spots</li>
          </ul>
          <p className="small">Pro opens on 20 December. The free app works now: spots, species, tides, weather and a go or no-go for anywhere in Australia.</p>
        </section>

        <section className="gpanel terms">
          <h2>The fine print</h2>
          <p>The gift code is valid for {VALID_YEARS} years from the day it's bought, and the expiry date is printed on the card. The year of Pro starts when the code is used. There are no fees after purchase and it doesn't renew or charge again. Price includes GST where it applies. Sold by {SELLER}. If something goes wrong with a code, contact us and we'll sort it out.</p>
        </section>
      </main>
    </>
  );
}
