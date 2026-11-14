import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '../components/Logo';
import RedeemForm from './RedeemForm';
import { cleanCode, showCode } from '@/lib/gift';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Start your Destination Catch membership', robots: { index: false } };

export default function RedeemPage({ searchParams }: { searchParams: { c?: string } }) {
  const c = cleanCode(searchParams.c ?? '');
  return (
    <>
      <header className="hero hero-slim">
        <div className="wrap hero-inner">
          <Link href="/" className="logo-link" aria-label="Destination Catch home"><Logo light /></Link>
          <h1>Start your <span>year</span></h1>
          <p className="hero-sub">Someone's given you a year of Destination Catch Pro. Pop in your email and you're away.</p>
        </div>
      </header>
      <main className="wrap gift-main">
        <section className="gpanel"><RedeemForm initial={c.length === 10 ? showCode(c) : ''} /></section>
      </main>
    </>
  );
}
