'use client';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';

// Visit counts (Vercel Analytics, no cookies) and, when a pixel ID is set, the Meta pixel for measuring ads.
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function track(event: string, data?: Record<string, unknown>) {
  try { (window as any).fbq?.('track', event, data); } catch {}
}

export default function Tracking() {
  return (
    <>
      <Analytics />
      {PIXEL && /^\d+$/.test(PIXEL) && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');`}</Script>
      )}
    </>
  );
}
