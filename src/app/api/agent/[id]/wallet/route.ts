import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWalletPortfolio } from '@/lib/goldrush';
import { vanish } from '@/lib/vanish';
import { Keypair } from '@solana/web3.js';
import { decryptSecret } from '@/lib/crypto';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent || !agent.agentPublicKey) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const portfolio = await getWalletPortfolio(agent.agentPublicKey);

  let shieldedSol = 0;
  if (agent.agentSecretKey) {
    try {
      const keypair = Keypair.fromSecretKey(
        Buffer.from(decryptSecret(agent.agentSecretKey), 'base64')
      );
      const balances = await vanish.getBalances(keypair);
      const native = balances.find(b => b.token === 'native');
      shieldedSol = native ? parseInt(native.amount) / 1e9 : 0;
    } catch {
      // Non-blocking — return 0 if Vanish unavailable
    }
  }

  return NextResponse.json({
    agentPublicKey: agent.agentPublicKey,
    vanishDepositAddr: agent.vanishDepositAddr,
    sol: portfolio.sol,
    usdc: portfolio.usdc,
    totalUsdValue: portfolio.totalUsdValue,
    shieldedSol,
    source: portfolio.source,
  });
}
