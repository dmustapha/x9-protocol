import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');

  try {
    // Wallet-isolated: filter by ownerWallet when provided
    const agentWhere = wallet ? { ownerWallet: wallet } : {};

    const agents = await db.agent.findMany({ where: agentWhere });
    const agentIds = agents.map((a) => a.id);

    const recentTrades = await db.trade.findMany({
      where: agentIds.length > 0 ? { agentId: { in: agentIds } } : {},
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const blockEvents = await db.blockEvent.findMany({
      where: agentIds.length > 0 ? { agentId: { in: agentIds } } : {},
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalPnl = await db.trade.aggregate({
      _sum: { pnlDelta: true },
      where: {
        status: 'executed',
        ...(agentIds.length > 0 ? { agentId: { in: agentIds } } : {}),
      },
    });

    return NextResponse.json({
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === 'active').length,
      totalTrades: recentTrades.length,
      totalPnl: totalPnl._sum.pnlDelta || 0,
      recentTrades: recentTrades.map((t) => ({
        ...t,
        privacyScore: t.privacyScore ? JSON.parse(t.privacyScore) : null,
        createdAt: t.createdAt.toISOString(),
      })),
      blockEvents: blockEvents.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch {
    // Return mock data when DB is unavailable (e.g. production without SQLite)
    return NextResponse.json({
      totalAgents: 0,
      activeAgents: 0,
      totalTrades: 0,
      totalPnl: 0,
      recentTrades: [],
      blockEvents: [],
      _source: 'fallback',
    });
  }
}
