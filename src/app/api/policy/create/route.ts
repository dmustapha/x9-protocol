import { NextResponse } from 'next/server';
import { strategyToPolicy } from '@/lib/claude';

export async function POST(req: Request) {
  let body: { strategyText?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { strategyText } = body;
  if (!strategyText || typeof strategyText !== 'string') {
    return NextResponse.json({ error: 'Missing strategyText' }, { status: 400 });
  }

  try {
    const { rules, tradeableTokens, interpretation } = await strategyToPolicy(strategyText);
    return NextResponse.json({ rules, tradeableTokens, interpretation });
  } catch (err) {
    return NextResponse.json({ error: 'Policy generation failed', detail: String(err) }, { status: 500 });
  }
}
