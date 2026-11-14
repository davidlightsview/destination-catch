import Link from 'next/link';
import { Logo } from './Logo';

export default function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <header className="hero hero-slim"><div className="wrap hero-inner">
        <Link href="/" className="logo-link" aria-label="Destination Catch home"><Logo light /></Link>
        <h1>{title}</h1>
      </div></header>
      <main className="wrap legal"><p className="small">Last updated {updated}</p>{children}</main>
    </>
  );
}
