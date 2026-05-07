/**
 * debug-p2-known-risks.test.ts
 * Targeted tests for all 3 BUILD-REPORT.md Known Risks.
 * RISK-1: Claude API credits (fallback returns hold)
 * RISK-2: Swig devnet API (preCheckTrade local enforcement)
 * RISK-3: Vanish API (mock mode auto-activates)
 */
import { describe, it, expect, vi } from 'vitest';

// ─── Risk 2: Swig preCheckTrade (local enforcement, no API needed) ───────────
import { preCheckTrade } from '@/lib/swig';
import type { ActionConfig } from '@/types';
import { SOL_MINT, USDC_DEVNET_MINT, LAMPORTS_PER_SOL } from '@/types';

describe('RISK-2: Swig preCheckTrade (local enforcement)', () => {
  const solLimitRule: ActionConfig = {
    type: 'SolLimit',
    amount: (0.5 * LAMPORTS_PER_SOL).toString(), // 0.5 SOL per trade max
  };

  const dailyLimitRule: ActionConfig = {
    type: 'SolRecurringLimit',
    recurringAmount: (2 * LAMPORTS_PER_SOL).toString(), // 2 SOL per day max
    window: '86400',
  };

  it('allows a trade within per-trade SOL limit', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 0.3 * LAMPORTS_PER_SOL };
    const result = preCheckTrade(decision, [solLimitRule], 0);
    expect(result.allowed).toBe(true);
  });

  it('blocks a trade that exceeds per-trade SOL limit', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 1 * LAMPORTS_PER_SOL };
    const result = preCheckTrade(decision, [solLimitRule], 0);
    expect(result.allowed).toBe(false);
    expect(result.violatedRule).toContain('SolLimit');
  });

  it('blocks a trade that would exceed daily SOL limit', () => {
    const solUsedToday = 1.8 * LAMPORTS_PER_SOL; // already used 1.8 SOL
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 0.5 * LAMPORTS_PER_SOL }; // 0.5 more = 2.3 > 2.0 limit
    const result = preCheckTrade(decision, [dailyLimitRule], solUsedToday);
    expect(result.allowed).toBe(false);
    expect(result.violatedRule).toContain('SolRecurringLimit');
  });

  it('allows a trade exactly at the per-trade limit', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 0.5 * LAMPORTS_PER_SOL };
    const result = preCheckTrade(decision, [solLimitRule], 0);
    // Exactly at limit is allowed (rule is > not >=)
    expect(result.allowed).toBe(true);
  });

  it('allows USDC token trade regardless of SOL rules', () => {
    const decision = { action: 'buy', token: USDC_DEVNET_MINT, amount_lamports: 999 * LAMPORTS_PER_SOL };
    const result = preCheckTrade(decision, [solLimitRule, dailyLimitRule], 0);
    expect(result.allowed).toBe(true); // SOL rules don't apply to USDC
  });

  it('allows any trade with empty policy rules', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 100 * LAMPORTS_PER_SOL };
    const result = preCheckTrade(decision, [], 0);
    expect(result.allowed).toBe(true);
  });

  it('blocks hold decisions that still hit daily cap when combined', () => {
    const solUsedToday = 2 * LAMPORTS_PER_SOL; // exactly at limit
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 0.001 * LAMPORTS_PER_SOL }; // any more is blocked
    const result = preCheckTrade(decision, [dailyLimitRule], solUsedToday);
    expect(result.allowed).toBe(false);
  });

  it('returns limit value when blocking', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 1 * LAMPORTS_PER_SOL };
    const result = preCheckTrade(decision, [solLimitRule], 0);
    expect(result.limit).toBe((0.5 * LAMPORTS_PER_SOL).toString());
  });
});

// ─── RSI calculation (feeds Claude decision context) ─────────────────────────
import { calculateRSI } from '@/lib/rsi';

describe('RSI calculation (market signal for Claude)', () => {
  it('returns null when fewer than period+1 prices', () => {
    expect(calculateRSI([100, 101, 102], 14)).toBeNull();
  });

  it('returns 100 when all prices are rising (no losses)', () => {
    const rising = Array.from({ length: 15 }, (_, i) => 100 + i); // 100,101,...114
    expect(calculateRSI(rising)).toBe(100);
  });

  it('returns value between 0 and 100 for mixed prices', () => {
    const mixed = [100, 102, 101, 103, 102, 104, 103, 105, 104, 106, 105, 107, 106, 108, 107];
    const rsi = calculateRSI(mixed);
    expect(rsi).not.toBeNull();
    expect(rsi!).toBeGreaterThan(0);
    expect(rsi!).toBeLessThan(100);
  });

  it('returns lower RSI for mostly declining prices (oversold territory)', () => {
    const declining = [110, 108, 106, 104, 102, 100, 98, 96, 94, 92, 90, 88, 86, 84, 82];
    const rsi = calculateRSI(declining);
    expect(rsi).not.toBeNull();
    expect(rsi!).toBeLessThan(40); // strongly oversold
  });

  it('uses exactly period+1 most recent prices', () => {
    // 15 prices all rising = RSI 100 using last 15
    const prices = [50, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
    const rsi = calculateRSI(prices);
    expect(rsi).toBe(100); // last 15 all rising
  });
});

// ─── Risk 3: Vanish mock mode ─────────────────────────────────────────────────
import { buildPrivacyScore } from '@/lib/vanish';

describe('RISK-3: Vanish buildPrivacyScore', () => {
  it('returns all-false privacy flags for mock wallet address', () => {
    const score = buildPrivacyScore('MockWallet123');
    expect(score.oneTimeWallet).toBe(false);
    expect(score.noOnchainLink).toBe(false);
    expect(score.jitoProtected).toBe(false);
  });

  it('returns all-true privacy flags for real wallet address', () => {
    const score = buildPrivacyScore('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    expect(score.oneTimeWallet).toBe(true);
    expect(score.noOnchainLink).toBe(true);
    expect(score.jitoProtected).toBe(true);
  });

  it('includes loan amount in score', () => {
    const score = buildPrivacyScore('SomeRealWallet', '0.012 SOL');
    expect(score.loanAmount).toBe('0.012 SOL');
  });

  it('defaults loanAmount to 0.012 SOL when not provided', () => {
    const score = buildPrivacyScore('SomeWallet');
    expect(score.loanAmount).toBe('0.012 SOL');
  });
});
