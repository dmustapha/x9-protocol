import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptSecret } from '@/lib/crypto';
import {
  Keypair,
  Connection,
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
// Reserve enough for: 1 SOL tx fee + up to 20 ATA creation fees (0.002 SOL each)
const FEE_RESERVE = 10_000 + 20 * 2_039_280;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent || !agent.agentSecretKey || !agent.agentPublicKey) {
    return NextResponse.json({ error: 'Agent not found or missing keys' }, { status: 404 });
  }

  // Destination: explicit body param → agent ownerWallet (always the creator)
  let destination: string = agent.ownerWallet;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.destination) destination = body.destination;
  } catch { /* use ownerWallet */ }

  const destPubkey = (() => {
    try { return new PublicKey(destination); } catch { return null; }
  })();
  if (!destPubkey) {
    return NextResponse.json({ error: 'Invalid destination address' }, { status: 400 });
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecretKey(
      Buffer.from(decryptSecret(agent.agentSecretKey), 'base64')
    );
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt agent key' }, { status: 500 });
  }

  const connection = new Connection(RPC_URL, 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash();

  // ── 1. Collect all SPL token accounts with a non-zero balance ──
  const tokenAccounts = await connection.getTokenAccountsByOwner(keypair.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  type SweptToken = { mint: string; amount: string; txId: string };
  const sweptTokens: SweptToken[] = [];

  for (const { pubkey: srcAta, account } of tokenAccounts.value) {
    const decoded = AccountLayout.decode(account.data);
    const amount = decoded.amount; // BigInt
    if (amount === BigInt(0)) continue;

    const mint = new PublicKey(decoded.mint);
    const destAta = getAssociatedTokenAddressSync(mint, destPubkey);

    // Build tx: idempotently create dest ATA if needed, then transfer full balance
    const tx = new Transaction();
    tx.add(createAssociatedTokenAccountIdempotentInstruction(keypair.publicKey, destAta, destPubkey, mint));
    tx.add(createTransferInstruction(srcAta, destAta, keypair.publicKey, amount));
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;
    tx.sign(keypair);

    try {
      const txId = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
      await connection.confirmTransaction(txId, 'confirmed');
      sweptTokens.push({ mint: mint.toBase58(), amount: amount.toString(), txId });
    } catch (err) {
      // Non-blocking — log and continue sweeping other tokens
      console.warn(`[withdraw] SPL sweep failed for mint ${mint.toBase58()}: ${String(err)}`);
    }
  }

  // ── 2. Sweep SOL last (after SPL fees are paid) ──
  const balance = await connection.getBalance(keypair.publicKey);
  const lamports = balance - 10_000; // keep only the base tx fee
  if (lamports <= 0) {
    return NextResponse.json({
      sweptTokens,
      sol: { amount: 0, txId: null },
      destination,
      note: 'SOL balance too low to sweep after SPL transfers',
    });
  }

  const solTx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: keypair.publicKey, toPubkey: destPubkey, lamports })
  );
  const { blockhash: freshBlockhash } = await connection.getLatestBlockhash();
  solTx.recentBlockhash = freshBlockhash;
  solTx.feePayer = keypair.publicKey;
  solTx.sign(keypair);

  const solTxId = await connection.sendRawTransaction(solTx.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(solTxId, 'confirmed');

  return NextResponse.json({
    sweptTokens,
    sol: {
      amount: lamports / LAMPORTS_PER_SOL,
      txId: solTxId,
      explorer: `https://solscan.io/tx/${solTxId}`,
    },
    // Legacy fields for frontend compatibility
    txId: solTxId,
    amount: lamports / LAMPORTS_PER_SOL,
    destination,
    explorer: `https://solscan.io/tx/${solTxId}`,
  });
}
