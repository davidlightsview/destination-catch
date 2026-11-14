import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PRO_COOKIE, fmtDate, readPro } from '@/lib/gift';

export const dynamic = 'force-dynamic';

export async function GET() {
  const p = readPro(cookies().get(PRO_COOKIE)?.value);
  return NextResponse.json(p ? { pro: true, until: fmtDate(new Date(p.until)) } : { pro: false });
}
