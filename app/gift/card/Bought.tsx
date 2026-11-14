'use client';
import { useEffect } from 'react';
import { track } from '../../components/Tracking';

// Tells the ad pixel about a sale, once per purchase.
export default function Bought({ id, value }: { id: string; value: number }) {
  useEffect(() => {
    try {
      const k = `dc_bought_${id}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
      const t = setTimeout(() => track('Purchase', { value, currency: 'AUD' }), 1500);
      return () => clearTimeout(t);
    } catch {}
  }, [id, value]);
  return null;
}
