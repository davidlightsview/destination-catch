import './globals.css';
import type { Metadata, Viewport } from 'next';
import SrcTag from './components/SrcTag';
import Tracking from './components/Tracking';
import SiteFooter from './components/SiteFooter';

export const metadata: Metadata = {
  metadataBase: new URL('https://destinationcatch.com.au'),
  title: 'Destination Catch: where are they biting?',
  description: 'Where to fish, what to use and whether to go, for spots around Australia.',
  openGraph: { siteName: 'Destination Catch', type: 'website', locale: 'en_AU', images: [{ url: '/og.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Catch', statusBarStyle: 'default' },
};
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: '#0f4c5c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" />
      </head>
      <body><SrcTag />{children}<SiteFooter /><Tracking /></body>
    </html>
  );
}
