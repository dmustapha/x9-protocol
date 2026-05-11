import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');
  try {
    const existing = await db.agent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    const authHeader = req.headers.get('authorization');
    const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    if (!isCronCall) {
      if (!wallet || existing.ownerWallet !== wallet) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const agent = await db.agent.update({
      where: { id },
      data: { status: 'stopped' },
    });
    return NextResponse.json({ status: agent.status });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2025') return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
