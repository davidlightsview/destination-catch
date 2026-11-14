import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-foot no-print">
      <div className="wrap site-foot-in">
        <nav aria-label="Site">
          <Link href="/">Find a spot</Link>
          <Link href="/gift">Give a membership</Link>
          <Link href="/redeem">Use a gift code</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <p>© {new Date().getFullYear()} Destination Catch. A guide only: always check conditions and local rules before you fish.</p>
      </div>
    </footer>
  );
}
