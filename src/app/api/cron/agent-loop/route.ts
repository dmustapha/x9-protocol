import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAgentLoop } from '@/lib/agent-engine';

export async function POST(req: Request) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const activeAgents = await db.agent.findMany({
      where: { status: 'active' },
    });

    const results = [];
    for (const agent of activeAgents) {
      const result = await runAgentLoop(agent.id);
      results.push({ ...result, snsDomain: agent.snsDomain });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    return NextResponse.json({ error: 'Cron loop failed', detail: String(err) }, { status: 500 });
  }
}

// Also support GET for Vercel Cron
export async function GET(req: Request) {
  return POST(req);
}
