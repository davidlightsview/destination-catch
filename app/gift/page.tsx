import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '../components/Logo';
import { CardMock } from '../components/GiftPromo';
import GiftForm from './GiftForm';
import { stripeReady } from '@/lib/stripe';
import { PRICE_LABEL, SELLER, VALID_YEARS } from '@/lib/gift';

export const dynamic = 'force-dynamic';
const DESC = `A present for the fisho in the family: a year of Destination Catch Pro for ${PRICE_LABEL}, on a card with a QR code you can print or send.`;
export const metadata: Metadata = {
  title: 'Give the fisho a year of Destination Catch',
  description: DESC,
  alternates: { canonical: '/gift' },
  openGraph: { title: 'Give the fisho a year of Destination Catch', description: DESC, url: '/gift', images: [{ url: '/og-gift.png', width: 1200, height: 630 }] },
};

const FAQ: [string, string][] = [
  ['When does their year start?', 'The day they scan the code, not the day you buy it. Buy it now, hand it over at Christmas, and they get the full year from then.'],
  ['Is it too late to order?', "No. The card shows on screen the moment you pay, so you can print it at home or send it by text or email. Christmas Eve is fine."],
  ['Do they need to download an app?', 'No. Destination Catch runs in the web browser on any phone, tablet or computer. They can add it to their home screen if they like.'],
  ['Does it work where they fish?', 'It covers the whole of Australia: beaches, jetties, rock walls, boat ramps, rivers and lakes, with tides, weather, the fish to target and a go or no-go for the day.'],
  ['Will it charge me again next year?', "No. It's a single payment. Nothing renews and we don't keep your card."],
  ['What if the card gets lost?', 'Keep the link to your card page, or note down the code. If both are gone, get in touch with your payment receipt and we will find it.'],
  ['Can I buy one for myself?', "Yes. Choose \"It's for me\" and you can start your year straight after paying."],
];

export default function GiftPage() {
  const open = stripeReady();
  return (
    <>
      <header className="hero hero-gift">
        <div className="wrap hero-inner gift-hero-in">
          <div className="gift-hero-text">
            <Link href="/" className="logo-link" aria-label="Destination Catch home"><Logo light /></Link>
            <p className="gp-kicker">Christmas, sorted</p>
            <h1>A present for <span>the fisho</span></h1>
            <p className="hero-sub">Give a year of Destination Catch Pro: where to fish, when to go and what to take, anywhere in Australia.</p>
            <div className="gift-hero-cta">
              <a className="btn btn-lure" href="#buy">{open ? `Give a membership: ${PRICE_LABEL}` : `${PRICE_LABEL} · opens 1 December`}</a>
              <span>One payment. No renewal. Ready to print in a minute.</span>
            </div>
          </div>
          <CardMock />
        </div>
      </header>

      <main className="wrap gift-main gift-wide">
        <ul className="trust" aria-label="At a glance">
          <li><b>Instant</b>Card on screen as soon as you pay</li>
          <li><b>Print or send</b>By text, email or on paper</li>
          <li><b>Their year, their start</b>Begins the day they scan it</li>
        </ul>

        <div className="gift-cols">
          <section className="gpanel buy" id="buy">
            <h2>{open ? 'Get the gift card' : 'Opens 1 December'}</h2>
            <GiftForm open={open} price={PRICE_LABEL} />
          </section>

          <div className="gift-side">
            <section className="gpanel">
              <h2>How it works</h2>
              <ol className="steps">
                <li><b>Pay online.</b> It takes about a minute.</li>
                <li><b>Get the card.</b> It shows straight away with their name on it and a QR code.</li>
                <li><b>They scan it.</b> Their year of Pro starts that day.</li>
              </ol>
            </section>
          </div>
        </div>

        <section className="gpanel">
          <h2>What they get</h2>
          <div className="gets">
            <div>
              <h3>The app, free for everyone</h3>
              <ul className="ticks">
                <li>Fishing spots near any town, beach or river in Australia</li>
                <li>What to target there and the gear that works</li>
                <li>Tides, wind, swell and weather for the day</li>
                <li>A straight go or no-go, so they don't waste the drive</li>
                <li>Size and bag limit reminders and closed seasons</li>
              </ul>
            </div>
            <div>
              <h3>Pro, for members</h3>
              <ul className="ticks">
                <li>Plan My Fishing Trip: where to go, when, and what to take</li>
                <li>The best times to fish over the next 7 days</li>
                <li>More detail on local spots</li>
              </ul>
              <p className="small">Pro opens on 20 December, in time for Christmas.</p>
            </div>
          </div>
          <div className="fish-strip" aria-hidden="true">
            <img src="/species/snapper.webp" alt="" loading="lazy" />
            <img src="/species/king-george-whiting.webp" alt="" loading="lazy" />
            <img src="/species/dusky-flathead.webp" alt="" loading="lazy" />
            <img src="/species/murray-cod.webp" alt="" loading="lazy" />
          </div>
        </section>

        <section className="gpanel">
          <h2>Good for</h2>
          <p>The dad who heads to the same jetty every weekend. The mate with a new tinny. The family off to the coast for the holidays who'd like to know where to take the kids for a fish. It's built for people who fish for fun, so there's no jargon and nothing to set up.</p>
          <p><Link href="/">Try the free app first</Link> and see what it shows for your local spot.</p>
        </section>

        <section className="gpanel">
          <h2>Questions</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>

        <section className="gift-last">
          <h2>Sorted in a minute</h2>
          <a className="btn btn-lure" href="#buy">{open ? `Give a membership: ${PRICE_LABEL}` : 'Opens 1 December'}</a>
        </section>

        <section className="gpanel terms">
          <h2>The fine print</h2>
          <p>The gift code is valid for {VALID_YEARS} years from the day it's bought, and the expiry date is printed on the card. The year of Pro starts when the code is used. There are no fees after purchase and it doesn't renew or charge again. Price includes GST where it applies. Sold by {SELLER}. Full details are in the <Link href="/terms">terms</Link>.</p>
        </section>
      </main>
    </>
  );
}
