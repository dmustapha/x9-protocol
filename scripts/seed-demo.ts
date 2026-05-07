import { PrismaClient } from '@prisma/client';
import { Keypair } from '@solana/web3.js';

const db = new PrismaClient();

async function seed() {
  console.log('Seeding demo data...');

  // Clean existing data
  await db.blockEvent.deleteMany();
  await db.trade.deleteMany();
  await db.pricePoint.deleteMany();
  await db.policyConfig.deleteMany();
  await db.agent.deleteMany();

  // Create agent keypair
  const agentKeypair = Keypair.generate();

  // Create demo agent
  const agent = await db.agent.create({
    data: {
      ownerWallet: 'DemoWallet1111111111111111111111111111111111',
      name: 'Conservative RSI Trader',
      status: 'active',
      strategyText: 'Trade SOL and USDC. Be conservative. Max $100 a day, stop if I\'m down 15%.',
      swigPolicyId: 'demo-policy-001',
      swigWalletAddress: 'DemoSwigWallet1111111111111111111111111111',
      metaplexNftAddress: 'DemoNFT11111111111111111111111111111111111',
      agentPublicKey: agentKeypair.publicKey.toBase58(),
      agentSecretKey: Buffer.from(agentKeypair.secretKey).toString('base64'),
      vanishDepositAddr: 'DemoVanishDeposit11111111111111111111111111',
    },
  });

  // Create policy config
  await db.policyConfig.create({
    data: {
      agentId: agent.id,
      name: 'x9-demo-policy',
      rules: JSON.stringify([
        { type: 'SolLimit', amount: '500000000' },
        { type: 'SolRecurringLimit', recurringAmount: '5000000000', window: '86400' },
        { type: 'TokenLimit', mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', amount: '500000000' },
        { type: 'Program', programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { type: 'Program', programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' },
      ]),
      swigPolicyId: 'demo-policy-001',
    },
  });

  // Seed 14 price points (showing SOL dip for RSI signal)
  const basePrices = [152, 150, 148, 145, 142, 140, 138, 136, 135, 137, 134, 132, 130, 128];
  const now = Date.now();
  for (let i = 0; i < basePrices.length; i++) {
    await db.pricePoint.create({
      data: {
        agentId: agent.id,
        token: 'SOL',
        price: basePrices[i] + Math.random() * 2 - 1,
        timestamp: new Date(now - (14 - i) * 5 * 60 * 1000),
      },
    });
  }

  // Seed 20 trades over 48h
  const tradeData = [
    { action: 'buy', amount: '400000000', reason: 'RSI at 32 — SOL approaching oversold', hours: 48 },
    { action: 'sell', amount: '200000000', reason: 'RSI at 68 — taking partial profit', hours: 46 },
    { action: 'hold', amount: '0', reason: 'RSI at 52 — no clear signal', hours: 44 },
    { action: 'buy', amount: '300000000', reason: 'RSI at 35 — buying the dip', hours: 42 },
    { action: 'hold', amount: '0', reason: 'RSI at 48 — neutral zone', hours: 40 },
    { action: 'buy', amount: '250000000', reason: 'RSI at 30 — strong oversold signal', hours: 38 },
    { action: 'sell', amount: '350000000', reason: 'RSI at 72 — overbought, selling', hours: 36 },
    { action: 'hold', amount: '0', reason: 'RSI at 55 — no action warranted', hours: 34 },
    { action: 'buy', amount: '200000000', reason: 'RSI at 38 — moderate buy signal', hours: 30 },
    { action: 'sell', amount: '150000000', reason: 'RSI at 65 — trimming position', hours: 28 },
    { action: 'blocked', amount: '1200000000', reason: 'Market moving fast. Buying 1.2 SOL.', hours: 26, policyRule: 'SolLimit (0.5 SOL max per trade)' },
    { action: 'hold', amount: '0', reason: 'Agent paused after block — awaiting restart', hours: 24 },
    { action: 'buy', amount: '450000000', reason: 'RSI at 28 — deeply oversold after correction', hours: 20 },
    { action: 'hold', amount: '0', reason: 'RSI at 42 — waiting for clearer signal', hours: 18 },
    { action: 'buy', amount: '300000000', reason: 'RSI at 33 — accumulating at support', hours: 14 },
    { action: 'sell', amount: '400000000', reason: 'RSI at 71 — hitting resistance, taking profit', hours: 10 },
    { action: 'hold', amount: '0', reason: 'RSI at 50 — perfectly neutral', hours: 8 },
    { action: 'buy', amount: '350000000', reason: 'RSI at 29 — strong buy zone', hours: 4 },
    { action: 'hold', amount: '0', reason: 'RSI at 45 — no clear signal', hours: 2 },
    { action: 'buy', amount: '400000000', reason: 'RSI at 28 — SOL oversold. Buying 0.4 SOL.', hours: 0.03 },
  ];

  let cumulativePnl = 0;
  for (const t of tradeData) {
    const pnlDelta = t.action === 'sell' ? Math.random() * 0.05 : t.action === 'buy' ? -Math.random() * 0.01 : 0;
    cumulativePnl += pnlDelta;

    const trade = await db.trade.create({
      data: {
        agentId: agent.id,
        action: t.action,
        token: 'So11111111111111111111111111111111',
        amountLamports: t.amount,
        reason: t.reason,
        status: t.action === 'blocked' ? 'blocked' : 'executed',
        policyRule: t.policyRule || null,
        vanishTxId: t.action !== 'hold' && t.action !== 'blocked' ? `mock-tx-${Date.now()}-${Math.random().toString(36).slice(2)}` : null,
        privacyScore: t.action !== 'hold' && t.action !== 'blocked' ? JSON.stringify({
          oneTimeWallet: true,
          noOnchainLink: true,
          jitoProtected: true,
          loanAmount: '0.012 SOL',
        }) : null,
        pnlDelta,
        createdAt: new Date(now - t.hours * 60 * 60 * 1000),
      },
    });

    // Create block event for the blocked trade
    if (t.action === 'blocked') {
      await db.blockEvent.create({
        data: {
          agentId: agent.id,
          tradeId: trade.id,
          claudeReasoning: t.reason,
          ruleTriggered: t.policyRule!,
          attemptedAmount: t.amount,
          limitAmount: '500000000',
          createdAt: new Date(now - t.hours * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log(`Seeded: 1 agent, 20 trades, 14 price points, 1 block event`);
  console.log(`Cumulative P&L: ${cumulativePnl.toFixed(4)} SOL`);
}

seed()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
  });
