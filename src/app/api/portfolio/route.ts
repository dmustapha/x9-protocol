import { NextResponse } from 'next/server';
import { getWalletPortfolio } from '@/lib/goldrush';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  if (!wallet) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
  try {
    const portfolio = await getWalletPortfolio(wallet);
    return NextResponse.json(portfolio);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
