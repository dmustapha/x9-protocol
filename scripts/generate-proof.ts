import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const db = new PrismaClient();

async function generateProof() {
  const agent = await db.agent.findFirst({ include: { policyConfig: true } });
  if (!agent) throw new Error('No agent found — run seed-demo.ts first');

  const trades = await db.trade.findMany({
    where: { agentId: agent.id, status: 'executed' },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const blockEvents = await db.blockEvent.findMany({
    where: { agentId: agent.id },
    take: 3,
  });

  const proof = `# x9 protocol — Integration Proof

## Swig Policy Engine
- Policy ID: ${agent.swigPolicyId || 'N/A'}
- Wallet Address: ${agent.swigWalletAddress || 'N/A'}
- Policy Rules: ${agent.policyConfig?.rules || 'N/A'}
- Block Events: ${blockEvents.length} recorded

## Vanish Core API
- Deposit Address: ${agent.vanishDepositAddr || 'N/A'}
- Trades via Vanish: ${trades.filter(t => t.vanishTxId).length}
- Sample tx_id: ${trades[0]?.vanishTxId || 'N/A'}

## Metaplex 014
- Agent NFT Address: ${agent.metaplexNftAddress || 'N/A'}
- Explorer: https://core.metaplex.com/explorer/${agent.metaplexNftAddress}?env=devnet

## Claude AI
- Model: claude-haiku-4-5-20251001 (decision loop)
- Model: claude-sonnet-4-6-20250514 (NL → policy)
- Sample reasoning: "${trades[0]?.reason || 'N/A'}"

## Phantom Connect
- App ID: 6673da67-257d-4538-b82c-d3e69928c46e
- Policy deploy tx: ${agent.policyConfig?.deployTxSignature || 'pending'}

## Trade Evidence
${trades.map(t => `- ${t.action} ${t.amountLamports} lamports | reason: "${t.reason}" | vanish: ${t.vanishTxId || 'N/A'}`).join('\n')}

## Block Evidence
${blockEvents.map(e => `- BLOCKED ${e.attemptedAmount} lamports | rule: ${e.ruleTriggered} | reason: "${e.claudeReasoning}"`).join('\n')}
`;

  fs.mkdirSync('submission', { recursive: true });
  fs.writeFileSync('submission/proof.md', proof);
  console.log('Proof written to submission/proof.md');
}

generateProof()
  .then(() => db.$disconnect())
  .catch((e) => { console.error(e); db.$disconnect(); process.exit(1); });
