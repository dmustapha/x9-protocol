import { db } from './db';
import { fetchPrices } from './coingecko';
import { calculateRSI } from './rsi';
import { getTradeDecision } from './claude';
import { preCheckTrade } from './swig';
import { vanish, buildPrivacyScore } from './vanish';
import { getSwapQuote, getSwapTransaction } from './jupiter';
import { getWalletPortfolio, verifyTradeOnChain } from './goldrush';
import { signWithIka } from './ika';
import { Keypair } from '@solana/web3.js';
import type {
  TradeDecision,
  MarketContext,
  AgentLoopResult,
  ActionConfig,
  TradeResponse,
} from '@/types';
import { SOL_MINT, USDC_DEVNET_MINT, LAMPORTS_PER_SOL } from '@/types';

export async function runAgentLoop(agentId: string): Promise<AgentLoopResult> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { policyConfig: true },
  });

  if (!agent || agent.status !== 'active') {
    return { agentId, decision: { action: 'hold', token: SOL_MINT, amount_lamports: 0, reason: 'Agent not active' }, outcome: 'hold' };
  }

  try {
    // Step 1: Fetch prices
    const prices = await fetchPrices();

    // Step 2: Store price + calculate RSI
    await db.pricePoint.create({
      data: { agentId, token: 'SOL', price: prices.sol },
    });

    const priceHistory = await db.pricePoint.findMany({
      where: { agentId, token: 'SOL' },
      orderBy: { timestamp: 'asc' },
      take: 15,
    });
    const solPrices = priceHistory.map((p) => p.price);
    const solRsi = calculateRSI(solPrices);

    // Step 3: Build market context
    const recentTrades = await db.trade.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTrades = await db.trade.findMany({
      where: { agentId, status: 'executed', createdAt: { gte: todayStart }, token: SOL_MINT },
    });
    const solUsedToday = todayTrades.reduce((sum, t) => sum + parseInt(t.amountLamports), 0);

    const policyRules: ActionConfig[] = agent.policyConfig
      ? JSON.parse(agent.policyConfig.rules)
      : [];
    const dailyLimit = policyRules.find((r) => r.type === 'SolRecurringLimit');
    const solDailyLimit = dailyLimit && 'recurringAmount' in dailyLimit
      ? parseInt(dailyLimit.recurringAmount)
      : 5 * LAMPORTS_PER_SOL;

    // Fetch live portfolio from GoldRush (falls back to mock for devnet)
    const portfolioData = await getWalletPortfolio(agent.agentPublicKey ?? '');

    const context: MarketContext = {
      prices,
      rsiValues: { sol: solRsi ?? 50 },
      portfolio: { sol: portfolioData.sol, usdc: portfolioData.usdc },
      recentTrades: recentTrades.map(tradeToResponse),
      policyUsage: { solUsedToday, solDailyLimit },
    };

    // Step 4: Claude decision
    const decision = await getTradeDecision(context, agent.strategyText);

    // If hold, just log and return
    if (decision.action === 'hold') {
      await db.trade.create({
        data: {
          agentId,
          action: 'hold',
          token: decision.token,
          amountLamports: '0',
          reason: decision.reason,
          status: 'executed',
        },
      });
      return { agentId, decision, outcome: 'hold' };
    }

    // Step 5: Pre-check against Swig policy
    const policyCheck = preCheckTrade(decision, policyRules, solUsedToday);

    if (!policyCheck.allowed) {
      const trade = await db.trade.create({
        data: {
          agentId,
          action: 'blocked',
          token: decision.token,
          amountLamports: decision.amount_lamports.toString(),
          reason: decision.reason,
          status: 'blocked',
          policyRule: policyCheck.violatedRule,
        },
      });

      await db.blockEvent.create({
        data: {
          agentId,
          tradeId: trade.id,
          claudeReasoning: decision.reason,
          ruleTriggered: policyCheck.violatedRule || 'unknown',
          attemptedAmount: decision.amount_lamports.toString(),
          limitAmount: policyCheck.limit || '0',
        },
      });

      await db.agent.update({
        where: { id: agentId },
        data: { status: 'blocked' },
      });

      return { agentId, decision, outcome: 'blocked', tradeId: trade.id };
    }

    // Step 6: Execute trade via Jupiter + Vanish
    let vanishTxId: string | undefined;
    let privacyScore = buildPrivacyScore('', '0 SOL');

    try {
      const inputMint = decision.action === 'buy' ? USDC_DEVNET_MINT : SOL_MINT;
      const outputMint = decision.action === 'buy' ? SOL_MINT : USDC_DEVNET_MINT;

      const oneTimeWallet = await vanish.getOneTimeWallet();
      const quote = await getSwapQuote(inputMint, outputMint, decision.amount_lamports.toString());
      const unsignedSwap = await getSwapTransaction(quote, oneTimeWallet);

      // Use Ika MPC signing if agent is enrolled, otherwise fall back to Keypair
      let ikaSignedTx: string | null = null;
      if (agent.ikaKeyId) {
        ikaSignedTx = await signWithIka(agent.ikaKeyId, unsignedSwap);
      }

      const agentKeypair = Keypair.fromSecretKey(
        Buffer.from(agent.agentSecretKey!, 'base64')
      );

      const tradeResult = await vanish.createTrade({
        keypair: agentKeypair,
        sourceMint: inputMint,
        targetMint: outputMint,
        amount: decision.amount_lamports.toString(),
        unsignedSwapBase64: ikaSignedTx ?? unsignedSwap,
        oneTimeWallet,
      });

      vanishTxId = tradeResult.txId;
      privacyScore = buildPrivacyScore(oneTimeWallet);

      // ALWAYS commit
      await vanish.commit(tradeResult.txId);
    } catch (err) {
      const trade = await db.trade.create({
        data: {
          agentId,
          action: decision.action,
          token: decision.token,
          amountLamports: decision.amount_lamports.toString(),
          reason: decision.reason,
          status: 'failed',
        },
      });
      return { agentId, decision, outcome: 'error', tradeId: trade.id, error: String(err) };
    }

    // Step 7: Record successful trade
    const trade = await db.trade.create({
      data: {
        agentId,
        action: decision.action,
        token: decision.token,
        amountLamports: decision.amount_lamports.toString(),
        reason: decision.reason,
        status: 'executed',
        vanishTxId,
        privacyScore: JSON.stringify(privacyScore),
        pnlDelta: 0,
      },
    });

    // Verify on-chain via GoldRush (async, non-blocking)
    if (vanishTxId && agent.agentPublicKey) {
      verifyTradeOnChain(agent.agentPublicKey, vanishTxId).then((verified) => {
        if (verified) {
          db.trade.update({ where: { id: trade.id }, data: { onChainVerified: true } }).catch(() => {});
        }
      }).catch(() => {});
    }

    return { agentId, decision, outcome: 'executed', tradeId: trade.id, vanishTxId };
  } catch (err) {
    return {
      agentId,
      decision: { action: 'hold', token: SOL_MINT, amount_lamports: 0, reason: 'Engine error' },
      outcome: 'error',
      error: String(err),
    };
  }
}

function tradeToResponse(trade: {
  id: string;
  agentId: string;
  action: string;
  token: string;
  amountLamports: string;
  reason: string;
  status: string;
  policyRule: string | null;
  vanishTxId: string | null;
  privacyScore: string | null;
  pnlDelta: number | null;
  createdAt: Date;
}): TradeResponse {
  return {
    id: trade.id,
    agentId: trade.agentId,
    action: trade.action as TradeResponse['action'],
    token: trade.token,
    amountLamports: trade.amountLamports,
    reason: trade.reason,
    status: trade.status as TradeResponse['status'],
    policyRule: trade.policyRule,
    vanishTxId: trade.vanishTxId,
    privacyScore: trade.privacyScore ? JSON.parse(trade.privacyScore) : null,
    pnlDelta: trade.pnlDelta,
    createdAt: trade.createdAt.toISOString(),
  };
}
