import { db } from './db';
import { fetchPrices } from './coingecko';
import { calculateRSI } from './rsi';
import { getTradeDecision } from './claude';
import { preCheckTrade } from './swig';
import { vanish, buildPrivacyScore } from './vanish';
import { getSwapQuote, getSwapTransaction } from './jupiter';
import { getWalletPortfolio, verifyTradeOnChain } from './goldrush';
import { signWithIka, type IkaSignResult } from './ika';
import { Keypair, Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { decryptSecret } from './crypto';
import type {
  TradeDecision,
  MarketContext,
  AgentLoopResult,
  ActionConfig,
  TradeResponse,
} from '@/types';
import { SOL_MINT, USDC_MAINNET_MINT, USDT_MAINNET_MINT, LAMPORTS_PER_SOL } from '@/types';

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
      orderBy: { timestamp: 'desc' },
      take: 15,
    });
    const solPrices = priceHistory.reverse().map((p) => p.price);
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

    // Step 6: Execute trade — Vanish privacy path first, direct Jupiter fallback
    let vanishTxId: string | undefined;
    let jupiterTxId: string | undefined;
    let privacyScore = buildPrivacyScore('', '0 SOL');
    let ikaResult: IkaSignResult | null = null;

    const agentKeypair = Keypair.fromSecretKey(
      Buffer.from(decryptSecret(agent.agentSecretKey!), 'base64')
    );

    // For BUY: detect which stablecoin the wallet holds (USDT or USDC) to use as input.
    // For SELL: output is always USDC (deepest liquidity).
    let inputMint: string;
    let outputMint: string;
    if (decision.action === 'buy') {
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const conn = new Connection(rpcUrl, 'confirmed');
      const parsed = await conn.getParsedTokenAccountsByOwner(agentKeypair.publicKey, { mint: new PublicKey(USDT_MAINNET_MINT) });
      const usdtBalance = (parsed.value[0]?.account.data as any)?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      inputMint = usdtBalance > 0 ? USDT_MAINNET_MINT : USDC_MAINNET_MINT;
      outputMint = SOL_MINT;
    } else {
      inputMint = SOL_MINT;
      outputMint = USDC_MAINNET_MINT;
      // Cap sell amount to wallet balance minus reserve for fees + USDC token account rent.
      const SOL_RESERVE = 3_000_000; // 0.003 SOL: covers ATA rent + tx fees
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const conn = new Connection(rpcUrl, 'confirmed');
      const solBalance = await conn.getBalance(agentKeypair.publicKey);
      const maxSell = Math.max(0, solBalance - SOL_RESERVE);
      if (decision.amount_lamports > maxSell) {
        decision.amount_lamports = maxSell;
        console.log(`[agent-engine] Capped sell to ${maxSell} lamports (reserve ${SOL_RESERVE})`);
      }
    }

    if (decision.amount_lamports <= 0) {
      return { agentId, decision, outcome: 'hold' };
    }

    try {
      // ── Vanish path (privacy trading with one-time wallet + flash loan) ──
      let executedViaVanish = false;
      try {
        const oneTimeWallet = await vanish.getOneTimeWallet();
        const quote = await getSwapQuote(inputMint, outputMint, decision.amount_lamports.toString());
        const unsignedSwap = await getSwapTransaction(quote, oneTimeWallet);

        // Ika MPC authorization proof (non-blocking — Vanish still executes if Ika fails)
        if (agent.ikaKeyId) {
          ikaResult = await signWithIka(agent.ikaKeyId, unsignedSwap, agentKeypair);
          if (!ikaResult) console.warn(`[agent-engine] Ika signing failed for ${agentId} — no MPC proof`);
        }

        const tradeResult = await vanish.createTrade({
          keypair: agentKeypair,
          sourceMint: inputMint,
          targetMint: outputMint,
          amount: decision.amount_lamports.toString(),
          unsignedSwapBase64: unsignedSwap,
          oneTimeWallet,
        });

        vanishTxId = tradeResult.txId;
        jupiterTxId = tradeResult.txId; // Vanish executes the Jupiter swap
        privacyScore = buildPrivacyScore(oneTimeWallet);
        await vanish.commit(tradeResult.txId);
        executedViaVanish = true;
      } catch (vanishErr) {
        console.warn(`[agent-engine] Vanish failed (${String(vanishErr)}) — falling back to direct Jupiter`);
      }

      // ── Direct Jupiter fallback (agent wallet signs + submits directly) ──
      if (!executedViaVanish) {
        const quote = await getSwapQuote(inputMint, outputMint, decision.amount_lamports.toString());
        const unsignedSwap = await getSwapTransaction(quote, agentKeypair.publicKey.toBase58());
        const tx = VersionedTransaction.deserialize(new Uint8Array(Buffer.from(unsignedSwap, 'base64')));
        tx.sign([agentKeypair]);
        const connection = new Connection(
          process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed'
        );
        jupiterTxId = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
        console.log(`[agent-engine] Direct Jupiter tx: ${jupiterTxId}`);
      }
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
    // For SELL, calculate realized PnL using entry price from the last BUY's PricePoint.
    let pnlDelta = 0;
    if (decision.action === 'sell') {
      const lastBuy = await db.trade.findFirst({
        where: { agentId, action: 'buy', status: 'executed' },
        orderBy: { createdAt: 'desc' },
      });
      if (lastBuy) {
        const entryPoint = await db.pricePoint.findFirst({
          where: { agentId, token: 'SOL', timestamp: { lte: lastBuy.createdAt } },
          orderBy: { timestamp: 'desc' },
        });
        if (entryPoint) {
          const amountSol = Number(decision.amount_lamports) / 1e9;
          pnlDelta = (prices.sol - entryPoint.price) * amountSol;
        }
      }
    }

    const trade = await db.trade.create({
      data: {
        agentId,
        action: decision.action,
        token: decision.token,
        amountLamports: decision.amount_lamports.toString(),
        reason: decision.reason,
        status: 'executed',
        vanishTxId,
        jupiterTxId,
        privacyScore: JSON.stringify(privacyScore),
        ikaApprovalSig: ikaResult?.approvalSig,
        ikaMpcSig: ikaResult?.mpcSig,
        pnlDelta,
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
  ikaApprovalSig: string | null;
  ikaMpcSig: string | null;
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
    ikaApprovalSig: trade.ikaApprovalSig,
    ikaMpcSig: trade.ikaMpcSig,
    createdAt: trade.createdAt.toISOString(),
  };
}
