import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptSecret } from '@/lib/crypto';
import { Keypair } from '@solana/web3.js';

// Returns the agent's keypair in formats compatible with Phantom, Solflare, and Solana CLI.
// Security note: This exposes the plaintext private key. Only call this deliberately.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const agent = await db.agent.findUnique({
    where: { id },
    select: { agentSecretKey: true, agentPublicKey: true, ownerWallet: true },
  });

  if (!agent?.agentSecretKey) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecretKey(
      Buffer.from(decryptSecret(agent.agentSecretKey), 'base64')
    );
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500 });
  }

  // JSON array format — importable in Phantom > Settings > Import Private Key (select "Byte Array")
  // Also works with: solana-keygen recover or any wallet supporting raw byte arrays
  const byteArray = Array.from(keypair.secretKey);

  return NextResponse.json({
    publicKey: keypair.publicKey.toBase58(),
    // 64-byte JSON array — paste into Phantom "Import Private Key" using Byte Array option
    byteArray,
    // Hex — for CLI use: solana-keygen recover or raw signing
    hex: Buffer.from(keypair.secretKey).toString('hex'),
    warning: 'This is your agent wallet private key. Anyone with this key controls the funds. Do not share it.',
  });
}
