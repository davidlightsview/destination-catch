import type { Metadata } from 'next';
import Legal from '../components/Legal';
import { CONTACT, SELLER, UPDATED } from '@/lib/site';
import { PRICE_LABEL, VALID_YEARS } from '@/lib/gift';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Terms: Destination Catch', alternates: { canonical: '/terms' } };

export default function Terms() {
  return (
    <Legal title="Terms" updated={UPDATED}>
      <p>Destination Catch is run by {SELLER}. By using the site you agree to these terms.</p>

      <h2>It's a guide</h2>
      <p>The spots, fish, tides, weather and ratings are there to help you plan. They come from public map data, forecast services and our own rules of thumb, and they can be wrong or out of date. A "go" rating is not a promise that conditions are safe or that you'll catch anything.</p>

      <h2>Your safety is your call</h2>
      <p>Conditions on the water change quickly. Check the official forecast and warnings from the Bureau of Meteorology before you go, look at the conditions when you arrive, and don't fish somewhere that looks unsafe because the app rated it well. Never fish rocks or heavy surf alone, and wear a lifejacket in boats and kayaks.</p>

      <h2>Fishing rules</h2>
      <p>Size limits, bag limits, closed seasons, licences and protected areas are set by each state and change from time to time. We show reminders, but you're responsible for checking the current rules with your state fisheries agency. A spot shown in the app may be on private land, closed or restricted: follow local signs.</p>

      <h2>Pro memberships and gifts</h2>
      <p>A Pro membership is one year of Destination Catch Pro for {PRICE_LABEL}, including GST where it applies. It's a single payment and doesn't renew.</p>
      <p>A gift code is valid for {VALID_YEARS} years from the day it's bought. The expiry date is printed on the gift card. The year of Pro starts on the day the code is used. There are no fees after purchase. A code can be used once, by one person, and can't be exchanged for cash.</p>
      <p>Pro features open on 20 December 2026. If you buy before then, your year doesn't start until you use the code.</p>

      <h2>Refunds and your rights</h2>
      <p>Nothing here limits your rights under the Australian Consumer Law. If there's a problem with a membership or a code, contact us and we'll fix it, replace it or refund it as the law requires.</p>

      <h2>Our responsibility</h2>
      <p>As far as the law allows, we aren't liable for loss or injury that comes from relying on the information in the app. Where the law doesn't let us exclude liability, ours is limited to supplying the service again or refunding what you paid.</p>

      <h2>Changes and contact</h2>
      <p>We may update these terms and will change the date at the top when we do. These terms are governed by the laws of Victoria, Australia.{CONTACT ? <> Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> : ' Questions: get in touch through our Facebook page.'}</p>
    </Legal>
  );
}
