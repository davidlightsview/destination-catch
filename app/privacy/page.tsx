import type { Metadata } from 'next';
import Legal from '../components/Legal';
import { CONTACT, PIXEL_ON, SELLER, UPDATED } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Privacy: Destination Catch', alternates: { canonical: '/privacy' } };

export default function Privacy() {
  return (
    <Legal title="Privacy" updated={UPDATED}>
      <p>Destination Catch is run by {SELLER}. This page says what information the site handles and why. We collect as little as we can.</p>

      <h2>Using the app</h2>
      <p>You don't need an account to use the free app. When you search for a place, or tap "Use where I am", that location is sent to our server so we can look up spots, tides and weather for it. We don't store it against your name or build a history of where you've searched.</p>

      <h2>Buying a membership or gift</h2>
      <p>Payments are handled by Stripe. Your card details go straight to Stripe and we never see or store them. Stripe gives us a record of the payment, including the email address you enter at checkout, so we can find your purchase if you need help. If you add names for the gift card, they are stored with the payment so the card can be shown again.</p>

      <h2>Starting a membership</h2>
      <p>When a gift code is used, we ask for an email address. We keep only a scrambled check value made from it, which lets the same person sign back in on another device. We can't read the address back from that value and we don't send marketing email to it.</p>

      <h2>Cookies and measurement</h2>
      <p>We set one cookie to remember that you have a membership on this device. We count visits with Vercel Web Analytics, which doesn't use cookies or identify you. If you arrive from one of our links, we note which link it was so we know which groups and ads are working.</p>
      {PIXEL_ON && <p>We also use the Meta pixel to measure how our Facebook and Instagram ads perform. It tells Meta that a page was viewed or a purchase was made. You can manage how Meta uses this in your Facebook ad settings.</p>}

      <h2>Who else is involved</h2>
      <p>To run the site we use Vercel (hosting), Stripe (payments), Open-Meteo and WillyWeather (weather and tides), Mapbox (maps) and OpenStreetMap data (fishing spots). They receive only what they need to do that job, such as the location you searched. We don't sell personal information.</p>

      <h2>Your choices</h2>
      <p>You can ask what we hold about you, or ask us to correct or delete it.{CONTACT ? <> Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> : ' Get in touch through our Facebook page.'} If you're not happy with how we respond, you can contact the Office of the Australian Information Commissioner.</p>
    </Legal>
  );
}
