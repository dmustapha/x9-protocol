import Anthropic from '@anthropic-ai/sdk';
import type { TradeDecision, ActionConfig, MarketContext } from '@/types';
import { SOL_MINT, USDC_DEVNET_MINT, TOKEN_PROGRAM_ID, JUPITER_PROGRAM_ID } from '@/types';

const API_KEY = process.env.ANTHROPIC_API_KEY?.trim() || '';
const client = new Anthropic({ apiKey: API_KEY || 'no-key', timeout: 8000 });

const TRADE_TOOL: Anthropic.Tool = {
  name: 'execute_trade_decision',
  description: 'Decide whether to buy, sell, or hold based on current market conditions',
  input_schema: {
    type: 'object' as const,
    properties: {
      action: { type: 'string', enum: ['buy', 'sell', 'hold'] },
      token: { type: 'string', description: 'Token mint address to trade' },
      amount_lamports: { type: 'integer', description: 'Amount in lamports or token base units' },
      reason: { type: 'string', maxLength: 200 },
    },
    required: ['action', 'token', 'amount_lamports', 'reason'],
  },
};

export async function getTradeDecision(
  context: MarketContext,
  strategy: string
): Promise<TradeDecision> {
  if (!API_KEY) return { action: 'hold', token: SOL_MINT, amount_lamports: 0, reason: 'Claude API unavailable — holding to preserve capital' };
  const contextStr = [
    `SOL price: $${context.prices.sol}`,
    `USDC price: $${context.prices.usdc}`,
    `SOL RSI(14): ${context.rsiValues.sol?.toFixed(1) ?? 'insufficient data'}`,
    `Portfolio: ${context.portfolio.sol} SOL, ${context.portfolio.usdc} USDC`,
    `Policy usage: ${context.policyUsage.solUsedToday}/${context.policyUsage.solDailyLimit} SOL today`,
    `Recent trades: ${context.recentTrades.slice(0, 5).map(t => `${t.action} ${t.amountLamports} @ ${t.createdAt}`).join('; ')}`,
  ].join('\n');

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      tools: [TRADE_TOOL],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content: `You are a trading agent. Follow this strategy strictly.\n\nStrategy: ${strategy}\n\nCurrent market context:\n${contextStr}\n\nMake a trading decision. Use SOL mint "${SOL_MINT}" or USDC mint "${USDC_DEVNET_MINT}".`,
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return { action: 'hold', token: SOL_MINT, amount_lamports: 0, reason: 'No decision returned — holding' };
    }

    return toolUse.input as TradeDecision;
  } catch {
    return { action: 'hold', token: SOL_MINT, amount_lamports: 0, reason: 'Claude API unavailable — holding to preserve capital' };
  }
}

export async function strategyToPolicy(naturalLanguage: string): Promise<ActionConfig[]> {
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
      },
      required: ['actions'],
    },
  };

  if (!API_KEY) return [
    { type: 'SolLimit', amount: '500000000' },
    { type: 'SolRecurringLimit', recurringAmount: '5000000000', window: '86400' },
    { type: 'Program', programId: TOKEN_PROGRAM_ID },
    { type: 'Program', programId: JUPITER_PROGRAM_ID },
  ];

  const defaultRules: ActionConfig[] = [
    { type: 'SolLimit', amount: '500000000' },
    { type: 'SolRecurringLimit', recurringAmount: '5000000000', window: '86400' },
    { type: 'Program', programId: TOKEN_PROGRAM_ID },
    { type: 'Program', programId: JUPITER_PROGRAM_ID },
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 1024,
      tools: [POLICY_TOOL],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content: `Convert this trading strategy into Swig ActionConfig rules.\n\nStrategy: "${naturalLanguage}"\n\nAvailable ActionConfig types:\n- SolLimit: max SOL per transaction (amount in lamports)\n- SolRecurringLimit: max SOL per time window (recurringAmount in lamports, window in seconds)\n- TokenLimit: max tokens per tx (mint address, amount in smallest unit)\n- TokenRecurringLimit: max tokens per window (mint, recurringAmount, window)\n- Program: whitelist a program (programId)\n\nAlways include:\n1. A per-trade SolLimit\n2. A daily SolRecurringLimit (window: "86400")\n3. Program whitelists for Token Program (${TOKEN_PROGRAM_ID}) and Jupiter (${JUPITER_PROGRAM_ID})\n4. Token limits if specific tokens mentioned\n\nUse SOL mint ${SOL_MINT}, USDC mint ${USDC_DEVNET_MINT}.\nConvert dollar amounts to lamports (1 SOL = 1000000000 lamports, 1 USDC = 1000000 units).`,
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') return defaultRules;
    return (toolUse.input as { actions: ActionConfig[] }).actions;
  } catch {
    // Fallback to conservative defaults when Claude API is unavailable
    return defaultRules;
  }
}
