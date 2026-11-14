'use client';
import { useState } from 'react';

export default function CardActions({ link, self }: { link: string; self: boolean }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const text = "Here's a year of Destination Catch Pro. Tap the link to start it:";
    try {
      if (navigator.share) { await navigator.share({ title: 'Your Destination Catch gift', text, url: link }); return; }
      await navigator.clipboard.writeText(`${text} ${link}`);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch {}
  }
  return (
    <div className="card-actions no-print">
      {self
        ? <a className="btn btn-lure" href={link}>Start my year now</a>
        : <>
            <button className="btn btn-lure" type="button" onClick={() => window.print()}>Print the card</button>
            <button className="btn btn-dark" type="button" onClick={share}>{copied ? 'Link copied' : 'Send it by text or email'}</button>
          </>}
    </div>
  );
}
