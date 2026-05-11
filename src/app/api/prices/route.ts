import { NextResponse } from 'next/server';
import { fetchPrices } from '@/lib/coingecko';

export async function GET() {
  try {
    const prices = await fetchPrices();
    return NextResponse.json(prices, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ sol: null, usdc: null }, { status: 503 });
  }
}
