import Anthropic from '@anthropic-ai/sdk';
import type { TradeDecision, ActionConfig, MarketContext, TradeableToken } from '@/types';
import { SOL_MINT, USDC_MAINNET_MINT, TOKEN_PROGRAM_ID, JUPITER_PROGRAM_ID } from '@/types';
import { getTokenByMint, TOKEN_REGISTRY } from './token-registry';

const API_KEY = process.env.ANTHROPIC_API_KEY?.trim() || '';
const client = new Anthropic({ apiKey: API_KEY || 'no-key', timeout: 15000 });

const TRADE_TOOL: Anthropic.Tool = {
  name: 'execute_trade_decision',
  description: 'Decide whether to buy, sell, or hold based on current market conditions',
  input_schema: {
    type: 'object' as const,
    properties: {
      action: { type: 'string', enum: ['buy', 'sell', 'hold'] },
      token: { type: 'string', description: 'Token mint address to trade' },
      amount_usd: { type: 'number', description: 'Dollar value to trade (e.g. 50 = $50). Must be positive.' },
      reason: { type: 'string', maxLength: 200 },
    },
    required: ['action', 'token', 'amount_usd', 'reason'],
  },
};

export async function getTradeDecision(
  context: MarketContext,
  strategy: string
): Promise<TradeDecision> {
  if (!API_KEY) return { action: 'hold', token: SOL_MINT, amount_usd: 0, reason: 'Claude API unavailable — holding to preserve capital' };

  // Build per-token RSI lines
  const rsiLines = context.tradeableTokens.map((t) => {
    const rsi = context.tokenRsiValues[t.mint];
    const rsiStr = rsi !== null && rsi !== undefined
      ? rsi.toFixed(1)
      : 'insufficient data (need 15+ price samples)';
    return `  ${t.symbol} RSI(14): ${rsiStr}`;
  }).join('\n');

  // Build per-token price + balance lines
  const tokenLines = context.tradeableTokens.map((t) => {
    const price = context.tokenPrices[t.mint];
    const balance = context.tokenBalances[t.mint] ?? 0;
    const priceStr = price !== undefined ? `$${price.toFixed(4)}` : 'price unavailable';
    return `  ${t.symbol} (${t.mint.slice(0, 8)}…): price=${priceStr}, balance=${balance.toFixed(4)}`;
  }).join('\n');

  // BTC price for macro context (from SOL price as proxy — add to prices if available)
  const btcLine = context.prices.btc ? `BTC price: $${context.prices.btc.toFixed(0)}` : '';

  const contextStr = [
    `SOL price: $${context.prices.sol}`,
    btcLine,
    `Portfolio: ${context.portfolio.sol.toFixed(4)} SOL, ${context.portfolio.usdc.toFixed(2)} USDC`,
    `Policy usage: ${context.policyUsage.solUsedToday} / ${context.policyUsage.solDailyLimit} SOL lamports today`,
    '',
    'Tradeable tokens (you may only trade these mints):',
    tokenLines,
    '',
    'RSI values:',
    rsiLines,
    '',
    `Recent trades: ${context.recentTrades.slice(0, 5).map(t => `${t.action} ${t.token.slice(0, 8)} @ ${t.createdAt}`).join('; ')}`,
  ].filter(Boolean).join('\n');

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      tools: [TRADE_TOOL],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content: `You are a trading agent executing exactly ONE decision per cycle. Follow this strategy strictly.\n\nStrategy: ${strategy}\n\nCurrent market context:\n${contextStr}\n\nYou may only trade the mints listed above. Output amount_usd as a dollar value (e.g. 50 for $50). Return hold with amount_usd=0 if no action is warranted.`,
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return { action: 'hold', token: SOL_MINT, amount_usd: 0, reason: 'No decision returned — holding' };
    }

    const input = toolUse.input as Record<string, unknown>;
    const validActions = ['buy', 'sell', 'hold'] as const;
    if (!validActions.includes(input.action as typeof validActions[number])) {
      return { action: 'hold', token: SOL_MINT, amount_usd: 0, reason: 'Invalid action from Claude — holding' };
    }
    return {
      action: input.action as TradeDecision['action'],
      token: typeof input.token === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.token) ? input.token : SOL_MINT,
      amount_usd: typeof input.amount_usd === 'number' ? Math.max(0, input.amount_usd) : 0,
      reason: typeof input.reason === 'string' ? input.reason.slice(0, 200) : 'No reason provided',
    };
  } catch {
    return { action: 'hold', token: SOL_MINT, amount_usd: 0, reason: 'Claude API unavailable — holding to preserve capital' };
  }
}

export interface PolicyGenerationResult {
  rules: ActionConfig[];
  tradeableTokens: TradeableToken[];
  interpretation: string;
}

export async function strategyToPolicy(naturalLanguage: string): Promise<PolicyGenerationResult> {
  const POLICY_TOOL: Anthropic.Tool = {
    name: 'generate_policy',
    description: 'Convert a natural language trading strategy into Swig ActionConfig rules',
    input_schema: {
      type: 'object' as const,
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              amount: { type: 'string' },
              recurringAmount: { type: 'string' },
              window: { type: 'string' },
              mint: { type: 'string' },
              programId: { type: 'string' },
            },
            required: ['type'],
          },
        },
        tradeableTokens: {
          type: 'array',
          description: 'List of tokens to trade. For each token, provide the Solana mint address. Use known mainnet mints.',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              mint: { type: 'string', description: 'Solana mainnet mint address (base58)' },
            },
            required: ['symbol', 'mint'],
          },
        },
        interpretation: {
          type: 'string',
          description: 'Plain-English summary of what you understood the strategy to mean and how the rules enforce it. 2-3 sentences max.',
        },
      },
      required: ['actions', 'tradeableTokens', 'interpretation'],
    },
  };

  const defaultResult: PolicyGenerationResult = {
    rules: [
      { type: 'SolLimit', amount: '500000000' },
      { type: 'SolRecurringLimit', recurringAmount: '5000000000', window: '86400' },
      { type: 'Program', programId: TOKEN_PROGRAM_ID },
      { type: 'Program', programId: JUPITER_PROGRAM_ID },
    ],
    tradeableTokens: [
      { symbol: 'SOL', mint: SOL_MINT, decimals: 9, tier: 'blue_chip' },
    ],
    interpretation: 'Default conservative policy: max 0.5 SOL per trade, 5 SOL per day. SOL only.',
  };

  if (!API_KEY) return defaultResult;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools: [POLICY_TOOL],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content: `Convert this trading strategy into Swig ActionConfig rules, identify the tokens to trade, and summarize your interpretation.\n\nStrategy: "${naturalLanguage}"\n\nAvailable ActionConfig types:\n- SolLimit: max SOL per transaction (amount in lamports)\n- SolRecurringLimit: max SOL per time window (recurringAmount in lamports, window in seconds)\n- TokenLimit: max tokens per tx (mint address, amount in smallest unit)\n- TokenRecurringLimit: max tokens per window (mint, recurringAmount, window)\n- Program: whitelist a program (programId)\n\nAlways include:\n1. A per-trade SolLimit\n2. A daily SolRecurringLimit (window: "86400")\n3. Program whitelists for Token Program (${TOKEN_PROGRAM_ID}) and Jupiter (${JUPITER_PROGRAM_ID})\n4. TokenRecurringLimit entries for any SPL tokens mentioned\n\nConvert dollar amounts to lamports (1 SOL = 1000000000). For SPL tokens use the decimals listed below.\n\nKnown token mint addresses — use EXACTLY these in both actions AND tradeableTokens:\n${TOKEN_REGISTRY.map(t => `${t.symbol}: ${t.mint} (decimals: ${t.decimals})`).join('\n')}\n\nFor tradeableTokens: include SOL and any other tokens the strategy mentions.`,
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') return defaultResult;

    const raw = toolUse.input as {
      actions: ActionConfig[];
      tradeableTokens?: { symbol: string; mint: string }[];
      interpretation?: string;
    };

    // Resolve tradeableTokens: prefer registry entry, fall back to Sonnet's mint
    const tradeableTokens: TradeableToken[] = (raw.tradeableTokens ?? []).map((t) => {
      const fromRegistry = getTokenByMint(t.mint);
      if (fromRegistry) return fromRegistry;
      // Sonnet supplied a mint not in our registry — use it with conservative defaults
      return { symbol: t.symbol, mint: t.mint, decimals: 9, tier: 'mid' as const };
    });

    // Always ensure SOL is in the list
    if (!tradeableTokens.some(t => t.mint === SOL_MINT)) {
      tradeableTokens.unshift({ symbol: 'SOL', mint: SOL_MINT, decimals: 9, tier: 'blue_chip' });
    }

    return {
      rules: raw.actions ?? defaultResult.rules,
      tradeableTokens,
      interpretation: raw.interpretation ?? 'Policy generated from your strategy.',
    };
  } catch {
    return defaultResult;
  }
}
