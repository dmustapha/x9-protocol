import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const trades = await db.trade.findMany({
      where: { agentId: id, status: 'executed' },
      orderBy: { createdAt: 'asc' },
    });

    let cumulative = 0;
    const pnlData = trades.map((t) => {
      cumulative += t.pnlDelta || 0;
      return {
        timestamp: t.createdAt.toISOString(),
        cumulativePnl: cumulative,
        tradeCount: 1,
      };
    });

    return NextResponse.json({ pnlData, totalPnl: cumulative });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
