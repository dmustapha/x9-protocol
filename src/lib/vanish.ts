import * as nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import type { PrivacyScore, VanishCommitStatus } from '@/types';

const VANISH_BASE = process.env.VANISH_BASE_URL || 'http://localhost:3001/mock/vanish';
const VANISH_API_KEY = process.env.VANISH_API_KEY || '';
const USE_MOCK = !process.env.VANISH_API_KEY;

function vanishHeaders() {
  return {
    'x-api-key': VANISH_API_KEY,
    'Content-Type': 'application/json',
  };
}

// ── Real Vanish Implementation ──

// Vanish uses the system program address for native SOL, not the wrapped SOL mint
const SOL_SYSTEM_ADDRESS = '11111111111111111111111111111111';

async function realGetDepositAddress(tokenAddress: string = SOL_SYSTEM_ADDRESS, userAddress?: string): Promise<string> {
  const params = new URLSearchParams({ token_address: tokenAddress });
  if (userAddress) params.set('user_address', userAddress);
  const res = await fetch(`${VANISH_BASE}/deposit_address?${params}`, {
    headers: vanishHeaders(),
  });
  const data = await res.json();
  return data.address;
}

async function realGetOneTimeWallet(): Promise<string> {
  const res = await fetch(`${VANISH_BASE}/trade/one-time-wallet`, {
    headers: vanishHeaders(),
  });
  const data = await res.json();
  return data.address;
}

async function realCreateTrade(params: {
  keypair: Keypair;
  sourceMint: string;
  targetMint: string;
  amount: string;
  unsignedSwapBase64: string;
  oneTimeWallet: string;
}): Promise<{ txId: string }> {
  const timestamp = Date.now().toString(); // MUST be milliseconds
  const loanSol = '5000000'; // 0.005 SOL — covers ATA rent; 12M recommended but requires larger shielded balance
  const jitoTip = '1000000'; // 0.001 SOL

  // Vanish uses system program address for native SOL, not wrapped SOL mint
  const vanishSource = params.sourceMint === 'So11111111111111111111111111111111111111112' ? SOL_SYSTEM_ADDRESS : params.sourceMint;
  const vanishTarget = params.targetMint === 'So11111111111111111111111111111111111111112' ? SOL_SYSTEM_ADDRESS : params.targetMint;

  const message = `By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)\n\nDetails: trade:${vanishSource}:${vanishTarget}:${params.amount}:${loanSol}:${timestamp}:${jitoTip}`;
  const sig = nacl.sign.detached(
    new TextEncoder().encode(message),
    params.keypair.secretKey
  );
  const userSignature = Buffer.from(sig).toString('base64');

  const res = await fetch(`${VANISH_BASE}/trade/create`, {
    method: 'POST',
    headers: vanishHeaders(),
    body: JSON.stringify({
      user_address: params.keypair.publicKey.toBase58(),
      source_token_address: vanishSource,
      target_token_address: vanishTarget,
      amount: params.amount,
      swap_transaction: params.unsignedSwapBase64,
      one_time_wallet: params.oneTimeWallet,
      loan_additional_sol: loanSol,
      jito_tip_amount: jitoTip,
      split_repay: 1,
      timestamp,
      user_signature: userSignature,
    }),
  });

  if (!res.ok) throw new Error(`Vanish trade/create failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { txId: data.tx_id };
}

async function realCommit(txId: string): Promise<VanishCommitStatus> {
  const res = await fetch(`${VANISH_BASE}/commit`, {
    method: 'POST',
    headers: vanishHeaders(),
    body: JSON.stringify({ tx_id: txId }),
  });
  const data = await res.json();
  return data.status as VanishCommitStatus;
}

async function realGetBalances(keypair: Keypair): Promise<{ token: string; amount: string }[]> {
  const timestamp = Date.now().toString();
  const message = `By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)\n\nDetails: read:${timestamp}`;
  const sig = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);
  const signature = Buffer.from(sig).toString('base64');

  const res = await fetch(`${VANISH_BASE}/account/balances`, {
    method: 'POST',
    headers: vanishHeaders(),
    body: JSON.stringify({
      user_address: keypair.publicKey.toBase58(),
      timestamp,
      signature,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.balances || [];
}

// ── Mock Vanish Implementation (Plan B) ──

let mockBalance = 1_000_000_000; // 1 SOL in lamports
let mockTradeCounter = 0;

async function mockGetDepositAddress(): Promise<string> {
  return 'MockVanishDeposit' + Math.random().toString(36).slice(2, 8);
}

async function mockGetOneTimeWallet(): Promise<string> {
  return 'MockOTW' + Math.random().toString(36).slice(2, 10);
}

async function mockCreateTrade(params: {
  keypair: Keypair;
  sourceMint: string;
  targetMint: string;
  amount: string;
  unsignedSwapBase64: string;
  oneTimeWallet: string;
}): Promise<{ txId: string }> {
  mockTradeCounter++;
  const amt = parseInt(params.amount);
  mockBalance -= amt;
  return { txId: `mock-tx-${mockTradeCounter}-${Date.now()}` };
}

async function mockCommit(_txId: string): Promise<VanishCommitStatus> {
  return 'completed';
}

async function mockGetBalances(): Promise<{ token: string; amount: string }[]> {
  return [{ token: 'native', amount: mockBalance.toString() }];
}

// ── Public API (switches between real and mock) ──

export const vanish = {
  getDepositAddress: USE_MOCK ? mockGetDepositAddress : (tokenAddress?: string, userAddress?: string) => realGetDepositAddress(tokenAddress, userAddress),
  getOneTimeWallet: USE_MOCK ? mockGetOneTimeWallet : realGetOneTimeWallet,
  createTrade: USE_MOCK ? mockCreateTrade : realCreateTrade,
  commit: USE_MOCK ? mockCommit : realCommit,
  getBalances: USE_MOCK ? mockGetBalances : realGetBalances,
  isMock: USE_MOCK,
};

export function buildPrivacyScore(_oneTimeWallet: string, loanAmount: string = '0.005 SOL'): PrivacyScore {
  return {
    oneTimeWallet: !USE_MOCK,
    noOnchainLink: !USE_MOCK,
    jitoProtected: !USE_MOCK,
    loanAmount,
  };
}
