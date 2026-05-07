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

async function realGetDepositAddress(tokenAddress: string = 'native'): Promise<string> {
  const res = await fetch(`${VANISH_BASE}/deposit_address?token_address=${tokenAddress}`, {
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
  const loanSol = '12000000'; // 0.012 SOL
  const jitoTip = '1000000'; // 0.001 SOL

  const message = `By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)\n\nDetails: trade:${params.sourceMint}:${params.targetMint}:${params.amount}:${loanSol}:${timestamp}:${jitoTip}`;
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
      source_token_address: params.sourceMint,
      target_token_address: params.targetMint,
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

async function realGetBalances(_keypair: Keypair): Promise<{ token: string; amount: string }[]> {
  const res = await fetch(`${VANISH_BASE}/account/balances`, {
    headers: vanishHeaders(),
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
  getDepositAddress: USE_MOCK ? mockGetDepositAddress : realGetDepositAddress,
  getOneTimeWallet: USE_MOCK ? mockGetOneTimeWallet : realGetOneTimeWallet,
  createTrade: USE_MOCK ? mockCreateTrade : realCreateTrade,
  commit: USE_MOCK ? mockCommit : realCommit,
  getBalances: USE_MOCK ? mockGetBalances : realGetBalances,
  isMock: USE_MOCK,
};

export function buildPrivacyScore(oneTimeWallet: string, loanAmount: string = '0.012 SOL'): PrivacyScore {
  return {
    oneTimeWallet: !oneTimeWallet.startsWith('Mock'),
    noOnchainLink: !oneTimeWallet.startsWith('Mock'),
    jitoProtected: !oneTimeWallet.startsWith('Mock'),
    loanAmount,
  };
}
