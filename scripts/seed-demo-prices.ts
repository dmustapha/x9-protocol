#!/usr/bin/env npx tsx
// Fixes the Demo agent's poisoned RSI data and sets a meaningful strategy.
// Run: npx tsx scripts/seed-demo-prices.ts
// Prereq: agent wallet must have at least 0.1 SOL for trading capital.

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const DEMO_AGENT_ID = 'cmp21x47l0008l404xvp92p8i';

// 15 prices producing RSI ≈ 72 (mildly overbought → triggers SELL)
// Gradual uptrend from $146→$148 with realistic pullbacks, spaced 5 min apart.
// Claude will see an uptrend + overbought RSI and decide to SELL some SOL for USDC.
const SEED_PRICES = [
  146.00, 146.30, 146.10, 146.50, 146.80,
  146.60, 147.00, 147.30, 147.10, 147.50,
  147.80, 147.60, 148.00, 148.30, 148.10,
];

async function main() {
  console.log('[1/4] Deleting poisoned price history...');
  const deleted = await db.pricePoint.deleteMany({
    where: { agentId: DEMO_AGENT_ID, token: 'SOL' },
  });
  console.log(`      Deleted ${deleted.count} price points`);

  console.log('[2/4] Seeding 15 realistic price points (RSI ≈ 72)...');
  const now = Date.now();
  for (let i = 0; i < SEED_PRICES.length; i++) {
    const timestamp = new Date(now - (SEED_PRICES.length - 1 - i) * 5 * 60 * 1000);
    await db.pricePoint.create({
      data: { agentId: DEMO_AGENT_ID, token: 'SOL', price: SEED_PRICES[i], timestamp },
    });
  }
  console.log(`      Seeded ${SEED_PRICES.length} prices ($${SEED_PRICES[0]}→$${SEED_PRICES[SEED_PRICES.length - 1]})`);

  console.log('[3/4] Updating strategy to allow meaningful trades...');
  await db.agent.update({
    where: { id: DEMO_AGENT_ID },
    data: {
      strategyText:
        'SOL momentum trader. Max $15 per trade, $50 per day. Sell some SOL when RSI exceeds 65 (overbought). Buy SOL when RSI drops below 35 (oversold). Stop if portfolio drops 20%.',
    },
  });

  console.log('[4/4] Updating Swig policy to allow $15 trades...');
  // 0.1 SOL ≈ $14.80 at $148/SOL — meaningful without being reckless
  const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  const JUPITER_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
  const rules = [
    { type: 'SolLimit', amount: '100000000' },              // 0.1 SOL per trade
    { type: 'SolRecurringLimit', recurringAmount: '500000000', window: '86400' }, // 0.5 SOL/day
    { type: 'Program', programId: TOKEN_PROGRAM_ID },
    { type: 'Program', programId: JUPITER_PROGRAM_ID },
  ];
  await db.policyConfig.upsert({
    where: { agentId: DEMO_AGENT_ID },
    update: { rules: JSON.stringify(rules) },
    create: { agentId: DEMO_AGENT_ID, name: 'Demo Policy', rules: JSON.stringify(rules) },
  });

  console.log('\n✓ Done. Next steps:');
  console.log('  1. Send at least 0.1 SOL to the agent public key (shown on agent detail page)');
  console.log('  2. Wait ~30s for balance to appear');
  console.log('  3. Trigger one cron cycle: curl -X POST https://x9-protocol.vercel.app/api/cron/agent-loop \\');
  console.log('       -H "Authorization: Bearer $CRON_SECRET"');
  console.log('  4. Claude should decide to SELL (RSI 72, uptrend, has SOL)');
}

main().catch(console.error).finally(() => db.$disconnect());
