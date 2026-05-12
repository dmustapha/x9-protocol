import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  try {
    const agents = await db.agent.findMany({
      where: wallet ? { ownerWallet: wallet } : {},
      select: {
        id: true,
        name: true,
        status: true,
        strategyText: true,
        snsDomain: true,
        agentPublicKey: true,
        metaplexNftAddress: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      agents: agents.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
