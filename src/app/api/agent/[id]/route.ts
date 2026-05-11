import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const agent = await db.agent.update({ where: { id }, data: body, select: { id: true, name: true, strategyText: true, status: true } });
  return NextResponse.json(agent);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await db.trade.deleteMany({ where: { agentId: id } });
  await db.blockEvent.deleteMany({ where: { agentId: id } });
  await db.policyConfig.deleteMany({ where: { agentId: id } });
  await db.agent.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}

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
