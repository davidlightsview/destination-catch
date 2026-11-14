'use client';
import { useState } from 'react';

export default function GiftForm({ open, price }: { open: boolean; price: string }) {
  const [kind, setKind] = useState<'gift' | 'self'>('gift');
  const [to, setTo] = useState('');
  const [from, setFrom] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    let src = '';
    try { src = localStorage.getItem('dc_src') ?? ''; } catch {}
    try {
      const r = await fetch('/api/gift/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, to, from, src }) });
      const j = await r.json();
      if (j.url) { location.href = j.url; return; }
      setErr(j.error ?? 'Could not start the payment. Try again.');
    } catch { setErr('Could not start the payment. Check your connection and try again.'); }
    setBusy(false);
  }

  return (
    <form className="gift-form" onSubmit={go}>
      <div className="seg" role="radiogroup" aria-label="Who is it for?">
        <button type="button" role="radio" aria-checked={kind === 'gift'} className={kind === 'gift' ? 'on' : ''} onClick={() => setKind('gift')}>It's a gift</button>
        <button type="button" role="radio" aria-checked={kind === 'self'} className={kind === 'self' ? 'on' : ''} onClick={() => setKind('self')}>It's for me</button>
      </div>
      {kind === 'gift' && (
        <div className="gift-names">
          <label>To <span>(optional, printed on the card)</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} maxLength={40} placeholder="Dad" autoComplete="off" />
          </label>
          <label>From <span>(optional)</span>
            <input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={40} placeholder="The kids" autoComplete="off" />
          </label>
        </div>
      )}
      <button className="btn btn-lure gift-buy" type="submit" disabled={busy || !open}>
        {!open ? 'Opens 1 December' : busy ? 'One moment…' : kind === 'gift' ? `Buy the gift: ${price}` : `Join as a Founder: ${price}`}
      </button>
      {err && <p className="form-err" role="alert">{err}</p>}
      <p className="small">Secure card payment by Stripe. One payment, no renewal.</p>
    </form>
  );
}
