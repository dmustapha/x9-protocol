import { NextResponse } from 'next/server';
import { getAgentAnalytics } from '@/lib/dune';

export async function GET(_req: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  try {
    const analytics = await getAgentAnalytics(agentId);
    return NextResponse.json(analytics);
  } catch {
    // Unknown agent or DB constraint — return empty fallback
    return NextResponse.json({
      tradeVolume: { queryId: 'tradeVolume', rows: [], source: 'derived' },
      buySellRatio: { queryId: 'buySellRatio', rows: [], source: 'derived' },
      pnlCurve: { queryId: 'pnlCurve', rows: [], source: 'derived' },
      txHistory: { queryId: 'txHistory', rows: [], source: 'derived' },
    });
  }
}
