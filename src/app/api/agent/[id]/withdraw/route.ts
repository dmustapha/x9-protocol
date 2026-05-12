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

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const FEE_RESERVE = 10_000; // lamports kept for tx fee

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

  try {
    new PublicKey(destination);
  } catch {
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
  const balance = await connection.getBalance(keypair.publicKey);

  if (balance <= FEE_RESERVE) {
    return NextResponse.json({
      error: 'Insufficient balance',
      balance: balance / LAMPORTS_PER_SOL,
    }, { status: 400 });
  }

  const lamports = balance - FEE_RESERVE;
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(destination),
      lamports,
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = keypair.publicKey;
  tx.sign(keypair);

  const txId = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(txId, 'confirmed');

  return NextResponse.json({
    txId,
    amount: lamports / LAMPORTS_PER_SOL,
    destination,
    explorer: `https://solscan.io/tx/${txId}`,
  });
}
