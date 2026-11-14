'use client';
import { useEffect } from 'react';

// Remembers where a visitor came from (?g=group-code on our links and QR codes) so a later sale can be credited.
export default function SrcTag() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(location.search);
      const g = p.get('g') || p.get('utm_source');
      if (g) localStorage.setItem('dc_src', g.slice(0, 30));
    } catch {}
  }, []);
  return null;
}
