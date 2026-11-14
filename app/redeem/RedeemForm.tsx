'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function RedeemForm({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [until, setUntil] = useState('');

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/gift/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, email }) });
      const j = await r.json();
      if (j.ok) setUntil(j.until); else setErr(j.error ?? 'Something went wrong. Try again.');
    } catch { setErr('Something went wrong. Check your connection and try again.'); }
    setBusy(false);
  }

  if (until) return (
    <div className="redeem-done" role="status">
      <h2>You're in</h2>
      <p>Your year of Pro runs until <b>{until}</b> on this phone. To use it on another phone or computer, come back to this page and enter the same code and email.</p>
      <Link className="btn btn-lure" href="/">Find somewhere to fish</Link>
    </div>
  );

  return (
    <form className="gift-form" onSubmit={go}>
      <label>Gift code
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCDE-12345" autoCapitalize="characters" autoComplete="off" required />
      </label>
      <label>Your email <span>(so you can get back in on another phone)</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
      </label>
      <button className="btn btn-lure gift-buy" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Start my year'}</button>
      {err && <p className="form-err" role="alert">{err}</p>}
      <p className="small">We won't email you. Your address is only used to check it's you next time.</p>
    </form>
  );
}
