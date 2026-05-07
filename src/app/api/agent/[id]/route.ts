import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  try {
    const agent = await db.agent.findUnique({
      where: { id },
      include: { policyConfig: true },
    });

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    if (wallet && agent.ownerWallet !== wallet) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      ...agent,
      agentSecretKey: undefined, // Never expose
      policyRules: agent.policyConfig ? JSON.parse(agent.policyConfig.rules) : [],
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
