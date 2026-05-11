import { db } from './db';
import { fetchPrices, fetchTokenPrices } from './coingecko';
import { calculateRSI } from './rsi';
import { getTradeDecision } from './claude';
import { preCheckTrade } from './swig';
import { vanish } from './vanish';
import { getSwapQuote, getSwapTransaction } from './jupiter';
import { getWalletPortfolio, verifyTradeOnChain } from './goldrush';
import { signWithIka, type IkaSignResult } from './ika';
import { getTokenByMint } from './token-registry';
import {
  Keypair,
  Connection,
  VersionedTransaction,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { decryptSecret } from './crypto';
import type {
  TradeDecision,
  MarketContext,
  AgentLoopResult,
  ActionConfig,
  TradeResponse,
  TradeableToken,
} from '@/types';
import { SOL_MINT, USDC_MAINNET_MINT, USDT_MAINNET_MINT, LAMPORTS_PER_SOL } from '@/types';

const MIN_SOL_BALANCE = 5_000_000;   // 0.005 SOL
const VANISH_TOP_UP = 3_000_000;     // 0.003 SOL top-up to Vanish pool
const SOL_SELL_RESERVE = 3_000_000;  // 0.003 SOL kept for fees

export async function runAgentLoop(agentId: string): Promise<AgentLoopResult> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { policyConfig: true },
  });

  if (!agent || agent.status !== 'active') {
    return { agentId, decision: { action: 'hold', token: SOL_MINT, amount_usd: 0, reason: 'Agent not active' }, outcome: 'hold' };
  }

  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // ── Balance check: skip cycle if agent wallet too low ──
    const agentPubkey = new PublicKey(agent.agentPublicKey!);
    const solBalance = await connection.getBalance(agentPubkey);
    if (solBalance < MIN_SOL_BALANCE) {
      await db.trade.create({
        data: {
          agentId,
          action: 'hold',
          token: SOL_MINT,
          amountLamports: '0',
          reason: `Insufficient SOL — fund ${agent.agentPublicKey} with at least 0.01 SOL to resume trading`,
          status: 'executed',
        },
      });
      return {
        agentId,
        decision: { action: 'hold', token: SOL_MINT, amount_usd: 0, reason: 'Insufficient SOL' },
        outcome: 'hold',
      };
    }

    // Decode agent keypair (needed for Vanish top-up and trade signing)
    const agentKeypair = Keypair.fromSecretKey(
      Buffer.from(decryptSecret(agent.agentSecretKey!), 'base64')
    );

    // ── Vanish auto top-up (non-blocking) ──
    if (agent.vanishDepositAddr && agent.vanishDepositAddr !== 'vanish-pending') {
      try {
        const vanishBalances = await vanish.getBalances(agentKeypair);
        const nativeEntry = vanishBalances.find((b) => b.token === 'native');
        const shieldedLamports = nativeEntry ? parseInt(nativeEntry.amount) : 0;
        if (shieldedLamports < VANISH_TOP_UP && solBalance > MIN_SOL_BALANCE + VANISH_TOP_UP) {
          const topUpTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: agentKeypair.publicKey,
              toPubkey: new PublicKey(agent.vanishDepositAddr),
              lamports: VANISH_TOP_UP,
            })
          );
          await sendAndConfirmTransaction(connection, topUpTx, [agentKeypair]);
          console.log(`[agent-engine] Topped up Vanish pool: ${VANISH_TOP_UP} lamports`);
        }
      } catch (e) {
        console.warn('[agent-engine] Vanish top-up failed (non-blocking):', String(e));
      }
    }

    // ── Extract tradeable tokens from policy rules ──
    const policyRules: ActionConfig[] = agent.policyConfig
      ? JSON.parse(agent.policyConfig.rules)
      : [];
    const tradeableMints = new Set<string>([SOL_MINT]);
    for (const rule of policyRules) {
      if ((rule.type === 'TokenRecurringLimit' || rule.type === 'TokenLimit') && 'mint' in rule) {
        tradeableMints.add(rule.mint);
      }
    }
    const tradeableTokens: TradeableToken[] = Array.from(tradeableMints).map((mint) => {
      const entry = getTokenByMint(mint);
      return entry ?? { symbol: mint.slice(0, 6), mint, decimals: 9, tier: 'mid' as const };
    });

    // ── Fetch prices ──
    const prices = await fetchPrices();
    const splMints = Array.from(tradeableMints).filter(m => m !== SOL_MINT);
    const tokenPrices: Record<string, number> = {
      [SOL_MINT]: prices.sol,
      [USDC_MAINNET_MINT]: 1,
    };
    if (splMints.length > 0) {
      const jupPrices = await fetchTokenPrices(splMints);
      Object.assign(tokenPrices, jupPrices);
    }

    // ── Store price points + calculate RSI per token ──
    await db.pricePoint.create({ data: { agentId, token: 'SOL', price: prices.sol } });
    const tokenRsiValues: Record<string, number | null> = {};

    const solHistory = await db.pricePoint.findMany({
      where: { agentId, token: 'SOL' },
      orderBy: { timestamp: 'desc' },
      take: 15,
    });
    tokenRsiValues[SOL_MINT] = calculateRSI(solHistory.reverse().map(p => p.price));

    for (const mint of splMints) {
      const entry = getTokenByMint(mint);
      const symbol = entry?.symbol ?? mint.slice(0, 6);
      const price = tokenPrices[mint];
      if (price) {
        await db.pricePoint.create({ data: { agentId, token: symbol, price } });
        const history = await db.pricePoint.findMany({
          where: { agentId, token: symbol },
          orderBy: { timestamp: 'desc' },
          take: 15,
        });
        tokenRsiValues[mint] = calculateRSI(history.reverse().map(p => p.price));
      } else {
        tokenRsiValues[mint] = null;
      }
    }

    // ── Build market context ──
    const recentTrades = await db.trade.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const solTodayTrades = await db.trade.findMany({
      where: { agentId, status: 'executed', createdAt: { gte: todayStart }, token: SOL_MINT },
    });
    const solUsedToday = solTodayTrades.reduce((sum, t) => sum + parseInt(t.amountLamports), 0);

    const dailyLimitRule = policyRules.find(r => r.type === 'SolRecurringLimit');
    const solDailyLimit = dailyLimitRule && 'recurringAmount' in dailyLimitRule
      ? parseInt(dailyLimitRule.recurringAmount)
      : 5 * LAMPORTS_PER_SOL;

    // Build tokenUsedToday map for TokenRecurringLimit enforcement
    const tokenUsedToday = new Map<string, number>();
    for (const mint of splMints) {
      const tokenTrades = await db.trade.findMany({
        where: { agentId, status: 'executed', createdAt: { gte: todayStart }, token: mint },
      });
      tokenUsedToday.set(mint, tokenTrades.reduce((sum, t) => sum + parseInt(t.amountLamports), 0));
    }

    // Token balances matched by contract_address (not symbol)
    const portfolioData = await getWalletPortfolio(agent.agentPublicKey ?? '');
    const tokenBalances: Record<string, number> = {
      [SOL_MINT]: portfolioData.sol,
      [USDC_MAINNET_MINT]: portfolioData.usdc,
    };
    for (const item of portfolioData.items) {
      if (item.contractAddress) {
        tokenBalances[item.contractAddress] = item.balance;
      }
    }

    const context: MarketContext = {
      prices,
      rsiValues: { sol: tokenRsiValues[SOL_MINT] ?? 50 },
      portfolio: { sol: portfolioData.sol, usdc: portfolioData.usdc },
      recentTrades: recentTrades.map(tradeToResponse),
      policyUsage: { solUsedToday, solDailyLimit },
      tradeableTokens,
      tokenPrices,
      tokenBalances,
      tokenRsiValues,
    };

    // ── Claude decision ──
    const decision = await getTradeDecision(context, agent.strategyText);

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

    // Validate decision.token is in tradeable mints
    if (!tradeableMints.has(decision.token)) {
      const hold: TradeDecision = {
        action: 'hold',
        token: SOL_MINT,
        amount_usd: 0,
        reason: `Token ${decision.token.slice(0, 8)}… not in allowed mints — overriding to hold`,
      };
      await db.trade.create({
        data: { agentId, action: 'hold', token: hold.token, amountLamports: '0', reason: hold.reason, status: 'executed' },
      });
      return { agentId, decision: hold, outcome: 'hold' };
    }

    // ── Compute token units and slippage ──
    const isSolTrade = decision.token === SOL_MINT;
    const tokenEntry = getTokenByMint(decision.token);
    const tokenDecimals = tokenEntry?.decimals ?? 9;
    const tokenTier = tokenEntry?.tier ?? 'mid';
    const slippageBps = tokenTier === 'blue_chip' ? 50 : tokenTier === 'degen' ? 500 : 200;
    const tokenPriceUsd = tokenPrices[decision.token] ?? 0;

    // ── Pre-check against Swig policy ──
    // For SOL rules: convert amount_usd to SOL lamports for comparison
    // For token rules: convert amount_usd to token base units
    const solEquivalentLamports = prices.sol > 0
      ? Math.floor(decision.amount_usd / prices.sol * LAMPORTS_PER_SOL)
      : 0;
    const tokenBaseUnits = tokenPriceUsd > 0
      ? Math.floor(decision.amount_usd / tokenPriceUsd * Math.pow(10, tokenDecimals))
      : 0;

    const preCheckDecision = {
      action: decision.action,
      token: decision.token,
      amount_lamports: isSolTrade ? solEquivalentLamports : tokenBaseUnits,
    };

    const policyCheck = preCheckTrade(preCheckDecision, policyRules, solUsedToday, tokenUsedToday);

    if (!policyCheck.allowed) {
      const amountForDb = isSolTrade ? solEquivalentLamports : tokenBaseUnits;
      const trade = await db.trade.create({
        data: {
          agentId,
          action: 'blocked',
          token: decision.token,
          amountLamports: amountForDb.toString(),
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
          attemptedAmount: amountForDb.toString(),
          limitAmount: policyCheck.limit || '0',
        },
      });
      await db.agent.update({ where: { id: agentId }, data: { status: 'blocked' } });
      return { agentId, decision, outcome: 'blocked', tradeId: trade.id };
    }

    // ── Determine inputMint, outputMint, swapAmount ──
    let inputMint: string;
    let outputMint: string;
    let swapAmount: string;

    if (decision.action === 'buy') {
      // Check for USDT (prefer if available, else USDC)
      const usdtAccounts = await connection.getParsedTokenAccountsByOwner(
        agentKeypair.publicKey, { mint: new PublicKey(USDT_MAINNET_MINT) }
      );
      const usdtBalance = (usdtAccounts.value[0]?.account.data as { parsed?: { info?: { tokenAmount?: { uiAmount?: number } } } })?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      inputMint = usdtBalance > 0 ? USDT_MAINNET_MINT : USDC_MAINNET_MINT;
      outputMint = decision.token;
      // amount_usd → stablecoin micro-units (USDC/USDT both 6 decimals)
      swapAmount = Math.floor(decision.amount_usd * 1_000_000).toString();
    } else {
      // Sell: input is the token, output is USDC
      inputMint = decision.token;
      outputMint = USDC_MAINNET_MINT;
      if (isSolTrade) {
        // SOL sell: cap to wallet balance minus reserve
        const desired = Math.floor(decision.amount_usd / prices.sol * LAMPORTS_PER_SOL);
        const maxSell = Math.max(0, solBalance - SOL_SELL_RESERVE);
        swapAmount = Math.min(desired, maxSell).toString();
      } else {
        // SPL token sell: cap to token account balance
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          agentKeypair.publicKey, { mint: new PublicKey(decision.token) }
        );
        const rawBalance = (tokenAccounts.value[0]?.account.data as { parsed?: { info?: { tokenAmount?: { amount?: string } } } })?.parsed?.info?.tokenAmount?.amount ?? '0';
        const maxTokenUnits = parseInt(rawBalance);
        const desired = Math.floor(decision.amount_usd / tokenPriceUsd * Math.pow(10, tokenDecimals));
        swapAmount = Math.min(desired, maxTokenUnits).toString();
      }
    }

    if (parseInt(swapAmount) <= 0) {
      return { agentId, decision, outcome: 'hold' };
    }

    // ── Execute trade: Vanish first, Jupiter direct fallback ──
    let vanishTxId: string | undefined;
    let jupiterTxId: string | undefined;
    let privacyScore = { oneTimeWallet: false, noOnchainLink: false, jitoProtected: false, loanAmount: '0 SOL' };
    let ikaResult: IkaSignResult | null = null;
    let executedViaVanish = false;

    try {
      try {
        const oneTimeWallet = await vanish.getOneTimeWallet();
        const quote = await getSwapQuote(inputMint, outputMint, swapAmount, slippageBps);
        const unsignedSwap = await getSwapTransaction(quote, oneTimeWallet);

        if (agent.ikaKeyId) {
          ikaResult = await signWithIka(agent.ikaKeyId, unsignedSwap, agentKeypair);
          if (!ikaResult) console.warn(`[agent-engine] Ika signing failed for ${agentId}`);
        }

        const tradeResult = await vanish.createTrade({
          keypair: agentKeypair,
          sourceMint: inputMint,
          targetMint: outputMint,
          amount: swapAmount,
          unsignedSwapBase64: unsignedSwap,
          oneTimeWallet,
        });

        vanishTxId = tradeResult.txId;
        jupiterTxId = tradeResult.txId;
        // Only set privacy score to true after confirmed Vanish execution
        privacyScore = { oneTimeWallet: true, noOnchainLink: true, jitoProtected: true, loanAmount: '0.005 SOL' };
        await vanish.commit(tradeResult.txId);
        executedViaVanish = true;
      } catch (vanishErr) {
        console.warn(`[agent-engine] Vanish failed (${String(vanishErr)}) — falling back to direct Jupiter`);
      }

      if (!executedViaVanish) {
        const quote = await getSwapQuote(inputMint, outputMint, swapAmount, slippageBps);
        const unsignedSwap = await getSwapTransaction(quote, agentKeypair.publicKey.toBase58());
        const tx = VersionedTransaction.deserialize(new Uint8Array(Buffer.from(unsignedSwap, 'base64')));
        tx.sign([agentKeypair]);
        jupiterTxId = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
        console.log(`[agent-engine] Direct Jupiter tx: ${jupiterTxId}`);
      }
    } catch (err) {
      const amountForDb = isSolTrade ? solEquivalentLamports : tokenBaseUnits;
      const trade = await db.trade.create({
        data: {
          agentId,
          action: decision.action,
          token: decision.token,
          amountLamports: amountForDb.toString(),
          reason: decision.reason,
          status: 'failed',
        },
      });
      return { agentId, decision, outcome: 'error', tradeId: trade.id, error: String(err) };
    }

    // ── Record trade + PnL ──
    let pnlDelta = 0;
    if (decision.action === 'sell' && tokenPriceUsd > 0) {
      const lastBuy = await db.trade.findFirst({
        where: { agentId, action: 'buy', status: 'executed', token: decision.token },
        orderBy: { createdAt: 'desc' },
      });
      if (lastBuy) {
        const symbol = isSolTrade ? 'SOL' : (getTokenByMint(decision.token)?.symbol ?? decision.token.slice(0, 6));
        const entryPoint = await db.pricePoint.findFirst({
          where: { agentId, token: symbol, timestamp: { lte: lastBuy.createdAt } },
          orderBy: { timestamp: 'desc' },
        });
        if (entryPoint) {
          const amountNatural = parseInt(swapAmount) / Math.pow(10, tokenDecimals);
          pnlDelta = (tokenPriceUsd - entryPoint.price) * amountNatural;
        }
      }
    }

    // Store canonical amount: SOL lamports for SOL trades, token base units for SPL
    // (not swapAmount which is USDC micro-units for buys — wrong denomination for policy tracking)
    const amountForDb = isSolTrade ? solEquivalentLamports : tokenBaseUnits;
    const trade = await db.trade.create({
      data: {
        agentId,
        action: decision.action,
        token: decision.token,
        amountLamports: amountForDb.toString(),
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
      decision: { action: 'hold', token: SOL_MINT, amount_usd: 0, reason: 'Engine error' },
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
