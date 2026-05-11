// Shared types for x9 protocol
// Order: enums → data structures → API shapes → state shapes → component props

// ── Enums ──

export type AgentStatus = 'active' | 'paused' | 'blocked' | 'stopped' | 'creating';

export type TradeAction = 'buy' | 'sell' | 'hold';

export type TradeStatus = 'executed' | 'blocked' | 'failed' | 'pending';

export type VanishCommitStatus = 'completed' | 'pending' | 'failed' | 'expired' | 'rejected';

// ── Core Data Structures ──

export interface TradeableToken {
  symbol: string;
  mint: string;
  decimals: number;
  tier: 'blue_chip' | 'mid' | 'degen';
}

export interface TradeDecision {
  action: TradeAction;
  token: string;
  amount_usd: number;
  reason: string;
}

export interface PrivacyScore {
  oneTimeWallet: boolean;
  noOnchainLink: boolean;
  jitoProtected: boolean;
  loanAmount: string;
}

export interface PolicyRule {
  type: string;
  amount?: string;
  recurringAmount?: string;
  window?: string;
  mint?: string;
  destination?: string;
  programId?: string;
}

export interface AgentPolicy {
  name: string;
  description: string;
  authority: { type: 'ED25519'; publicKey: string };
  actions: PolicyRule[];
}

// ── API Response Shapes ──

export interface AgentResponse {
  id: string;
  ownerWallet: string;
  name: string;
  status: AgentStatus;
  strategyText: string;
  policyId: string | null;
  swigWalletAddress: string | null;
  metaplexNftAddress: string | null;
  createdAt: string;
  agentPublicKey?: string | null;
  vanishDepositAddr?: string | null;
}

export interface TradeResponse {
  id: string;
  agentId: string;
  action: TradeAction | 'blocked';
  token: string;
  amountLamports: string;
  reason: string;
  status: TradeStatus;
  policyRule: string | null;
  vanishTxId: string | null;
  privacyScore: PrivacyScore | null;
  pnlDelta: number | null;
  ikaApprovalSig: string | null;
  ikaMpcSig: string | null;
  createdAt: string;
}

export interface BlockEventResponse {
  id: string;
  agentId: string;
  claudeReasoning: string;
  ruleTriggered: string;
  attemptedAmount: string;
  limitAmount: string;
  createdAt: string;
}

export interface PnLData {
  timestamp: string;
  cumulativePnl: number;
  tradeCount: number;
}

export interface DashboardOverview {
  totalAgents: number;
  activeAgents: number;
  totalTrades: number;
  totalPnl: number;
  recentTrades: TradeResponse[];
  blockEvents: BlockEventResponse[];
}

// ── Agent Engine Types ──

export interface MarketContext {
  prices: Record<string, number>;
  rsiValues: Record<string, number>;
  portfolio: { sol: number; usdc: number };
  recentTrades: TradeResponse[];
  policyUsage: { solUsedToday: number; solDailyLimit: number };
  tradeableTokens: TradeableToken[];
  tokenPrices: Record<string, number>;
  tokenBalances: Record<string, number>;
  tokenRsiValues: Record<string, number | null>;
}

export interface AgentLoopResult {
  agentId: string;
  decision: TradeDecision;
  outcome: 'executed' | 'blocked' | 'error' | 'hold';
  tradeId?: string;
  vanishTxId?: string;
  error?: string;
}

// ── Swig ActionConfig (from FORGE-INPUT Part 12.3) ──

export type ActionConfig =
  | { type: 'All' }
  | { type: 'AllButManageAuthority' }
  | { type: 'SolLimit'; amount: string }
  | { type: 'SolRecurringLimit'; recurringAmount: string; window: string }
  | { type: 'SolDestinationLimit'; amount: string; destination: string }
  | { type: 'TokenLimit'; mint: string; amount: string }
  | { type: 'TokenRecurringLimit'; mint: string; recurringAmount: string; window: string }
  | { type: 'TokenDestinationLimit'; mint: string; amount: string; destination: string }
  | { type: 'Program'; programId: string }
  | { type: 'ProgramAll' }
  | { type: 'ProgramCurated' }
  | { type: 'StakeLimit'; amount: string }
  | { type: 'StakeRecurringLimit'; recurringAmount: string; window: string }
  | { type: 'StakeAll' }
  | { type: 'SubAccount' };

// ── Constants ──

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
// Jupiter API is mainnet-only — no functional devnet equivalent exists (no real liquidity).
// Swap quotes use mainnet USDC; on-chain balance queries (GoldRush) use USDC_DEVNET_MINT.
export const USDC_MAINNET_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDT_MAINNET_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const JUPITER_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
export const LAMPORTS_PER_SOL = 1_000_000_000;
