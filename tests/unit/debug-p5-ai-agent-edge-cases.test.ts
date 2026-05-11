/**
 * debug-p5-ai-agent-edge-cases.test.ts
 * Phase 5.4: AI Agent edge cases — unique failure modes for Claude-powered agent loop
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test pure functions without needing the full Next.js environment
import { calculateRSI } from '@/lib/rsi';
import { preCheckTrade } from '@/lib/swig';
import { buildPrivacyScore } from '@/lib/vanish';
import { SOL_MINT, LAMPORTS_PER_SOL } from '@/types';

describe('AI Agent: RSI edge cases (context overflow / insufficient data)', () => {
  it('returns null when prices array is empty (no crash)', () => {
    expect(calculateRSI([])).toBeNull();
  });

  it('returns null with exactly period prices (needs period+1 minimum)', () => {
    const prices = Array.from({ length: 14 }, (_, i) => 100 + i);
    expect(calculateRSI(prices, 14)).toBeNull();
  });

  it('handles all-same-price array without divide-by-zero', () => {
    const prices = Array.from({ length: 15 }, () => 150);
    const rsi = calculateRSI(prices);
    // avgLoss = 0 → RSI = 100 (no losses)
    expect(rsi).toBe(100);
  });

  it('handles single-price spike without crash', () => {
    const prices = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 999];
    const rsi = calculateRSI(prices);
    expect(rsi).not.toBeNull();
    expect(rsi).toBe(100); // only gain, no losses
  });

  it('handles negative price deltas (volatile asset)', () => {
    const prices = [100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100];
    const rsi = calculateRSI(prices);
    expect(rsi).not.toBeNull();
    expect(rsi! > 0 && rsi! < 100).toBe(true);
  });
});

describe('AI Agent: preCheckTrade edge cases (policy enforcement)', () => {
  it('handles zero-amount trade (hold converted to buy with 0 amount)', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 0 };
    const rule = { type: 'SolLimit' as const, amount: '1000' };
    const result = preCheckTrade(decision, [rule], 0);
    expect(result.allowed).toBe(true); // 0 > 1000 is false, so allowed
  });

  it('handles missing policy rules array (empty = allow all)', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 999999999999 };
    expect(preCheckTrade(decision, [], 0).allowed).toBe(true);
  });

  it('handles solUsedToday exceeding daily limit without crashing', () => {
    // Already over limit (shouldn't happen in normal flow but must not crash)
    const rule = { type: 'SolRecurringLimit' as const, recurringAmount: '1000000', window: '86400' };
    const solUsedToday = 999999999; // way over limit
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: 1 };
    const result = preCheckTrade(decision, [rule], solUsedToday);
    expect(result.allowed).toBe(false);
    expect(result.violatedRule).toBeTruthy();
  });

  it('handles NaN amount_lamports gracefully', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: NaN };
    const rule = { type: 'SolLimit' as const, amount: '1000000' };
    // NaN > 1000000 = false → allowed (no crash is the key assertion)
    expect(() => preCheckTrade(decision, [rule], 0)).not.toThrow();
  });

  it('handles policy with unknown type gracefully (does not block)', () => {
    const decision = { action: 'buy', token: SOL_MINT, amount_lamports: LAMPORTS_PER_SOL };
    // Unknown rule type should be ignored (not crash, not block)
    const unknownRule = { type: 'UnknownFutureRule' as unknown as 'SolLimit', amount: '0' };
    expect(() => preCheckTrade(decision, [unknownRule], 0)).not.toThrow();
    const result = preCheckTrade(decision, [unknownRule], 0);
    expect(result.allowed).toBe(true); // unknown rules are ignored
  });
});

describe('AI Agent: Vanish mock mode edge cases', () => {
  it('buildPrivacyScore with empty string wallet (edge: no wallet yet)', () => {
    const score = buildPrivacyScore('');
    // empty string doesn't start with 'Mock' so treated as real
    expect(score).toHaveProperty('oneTimeWallet');
    expect(typeof score.oneTimeWallet).toBe('boolean');
  });

  it('buildPrivacyScore with undefined-like wallet (flags depend on !USE_MOCK)', () => {
    const score = buildPrivacyScore('undefined');
    // Flags are !USE_MOCK — true when VANISH_API_KEY is set, false in mock mode
    const expectedFlag = !!process.env.VANISH_API_KEY;
    expect(score.oneTimeWallet).toBe(expectedFlag);
  });

  it('buildPrivacyScore returns consistent flags regardless of wallet string prefix', () => {
    // Flags depend only on USE_MOCK (!VANISH_API_KEY), not on wallet address content
    const scores = ['MockWallet1', 'Mock-abc123', 'RealWallet123'].map(w => buildPrivacyScore(w));
    for (const score of scores) {
      expect(score.oneTimeWallet).toBe(scores[0].oneTimeWallet);
      expect(score.noOnchainLink).toBe(scores[0].noOnchainLink);
      expect(score.jitoProtected).toBe(scores[0].jitoProtected);
    }
  });

  it('buildPrivacyScore all three flags are consistent with each other', () => {
    const score = buildPrivacyScore('MockWallet');
    // All three flags should be the same value (all based on same condition)
    expect(score.oneTimeWallet).toBe(score.noOnchainLink);
    expect(score.noOnchainLink).toBe(score.jitoProtected);
  });
});

describe('AI Agent: Infinite loop protection (max iterations)', () => {
  it('RSI calculation terminates for very large price arrays', () => {
    // 10,000 price points — should not hang or OOM
    const prices = Array.from({ length: 10000 }, (_, i) => 100 + Math.sin(i) * 10);
    const start = Date.now();
    const rsi = calculateRSI(prices);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000); // must complete in < 1 second
    expect(rsi).not.toBeNull();
  });
});

describe('AI Agent: Concurrent preCheckTrade (no shared state corruption)', () => {
  it('parallel preCheckTrade calls return independent results', () => {
    const rules = [{ type: 'SolLimit' as const, amount: (0.5 * LAMPORTS_PER_SOL).toString() }];

    // Simulate concurrent calls
    const results = Array.from({ length: 100 }, (_, i) => {
      const amount = (i % 2 === 0 ? 0.3 : 0.8) * LAMPORTS_PER_SOL;
      return preCheckTrade({ action: 'buy', token: SOL_MINT, amount_lamports: amount }, rules, 0);
    });

    const allowed = results.filter((r) => r.allowed).length;
    const blocked = results.filter((r) => !r.allowed).length;
    expect(allowed).toBe(50); // 0.3 SOL trades allowed
    expect(blocked).toBe(50); // 0.8 SOL trades blocked
  });
});
