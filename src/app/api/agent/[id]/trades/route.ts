import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const agent = await db.agent.findUnique({ where: { id } });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const trades = await db.trade.findMany({
      where: { agentId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(
      trades.map((t) => ({
        ...t,
        amountLamports: t.amountLamports,
        privacyScore: t.privacyScore ? JSON.parse(t.privacyScore) : null,
        createdAt: t.createdAt.toISOString(),
      }))
    );
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
