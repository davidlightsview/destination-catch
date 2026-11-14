import Link from 'next/link';
import { LogoMark } from './Logo';

// A picture of the gift card, used in the promo on the home page and the gift page.
export function CardMock({ to = 'Dad', from = 'The kids' }: { to?: string; from?: string }) {
  return (
    <div className="card-mock" aria-hidden="true">
      <div className="gc-top"><LogoMark size={40} /><div><p className="gc-brand">Destination Catch</p><p className="gc-what">A year of Pro</p></div></div>
      <p className="cm-names">To <b>{to}</b> · From <b>{from}</b></p>
      <img src="/gift-qr.svg" alt="" width={120} height={120} />
      <p className="cm-scan">Scan to start your year</p>
    </div>
  );
}

export default function GiftPromo({ slim = false }: { slim?: boolean }) {
  return (
    <section className={`gift-promo ${slim ? 'gift-promo-slim' : ''}`} aria-label="Gift memberships">
      <div className="gp-text">
        <span className="gp-kicker">Christmas, sorted</span>
        <h2>Give the fisho a year of Pro</h2>
        <p>A Founder's membership for A$39.99. You get a card with a QR code to print or send. They scan it and their year starts, even on Christmas morning.</p>
        <div className="gp-actions">
          <Link className="btn btn-lure" href="/gift">Give a membership</Link>
          <span className="gp-note">One payment. No renewal.</span>
        </div>
      </div>
      {!slim && <CardMock />}
    </section>
  );
}
