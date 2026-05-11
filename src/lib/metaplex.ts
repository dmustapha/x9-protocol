// Metaplex Core — mint each agent as a Core Asset (NFT) on devnet.
// Uses @metaplex-foundation/mpl-core (installed) — NOT the nonexistent mpl-agent-registry.
//
// Core Assets are lighter than Metaplex Token Metadata NFTs: no separate mint/token
// account, fewer accounts per instruction, lower fees.
//
// NOTE: NFT minting runs on devnet (auto-airdrop covers fees). The rest of the app runs
// on mainnet (Jupiter swaps, Vanish, GoldRush). Devnet is intentional — pre-alpha agents.
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, generateSigner } from '@metaplex-foundation/umi';
import { create, mplCore } from '@metaplex-foundation/mpl-core';
import { Connection, Keypair } from '@solana/web3.js';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function registerAgent(
  agentSecretKey: Uint8Array,
  agentName: string
): Promise<{ nftAddress: string; txSignature: string }> {
  // Auto-airdrop devnet SOL if needed — Core Asset mint costs ~0.003 SOL in fees + rent.
  const solKeypair = Keypair.fromSecretKey(agentSecretKey);
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const balance = await connection.getBalance(solKeypair.publicKey);
  if (balance < 5_000_000) {
    try {
      const airdropSig = await connection.requestAirdrop(solKeypair.publicKey, 1_000_000_000);
      await connection.confirmTransaction(airdropSig, 'confirmed');
      console.log(`[metaplex] devnet airdrop: 1 SOL → ${solKeypair.publicKey.toBase58().slice(0, 8)}…`);
    } catch (err) {
      console.warn('[metaplex] airdrop failed (rate limit?) — mint may fail:', err);
    }
  }

  const umi = createUmi(DEVNET_RPC).use(mplCore());
  const keypair = umi.eddsa.createKeypairFromSecretKey(agentSecretKey);
  umi.use(keypairIdentity(keypair));

  // Each Core Asset is a unique signer — its public key becomes the NFT address.
  const asset = generateSigner(umi);

  const result = await create(umi, {
    asset,
    name: `x9: ${agentName}`,
    uri: `${APP_URL}/agent-metadata.json`,
  }).sendAndConfirm(umi);

  return {
    nftAddress: asset.publicKey.toString(),
    txSignature: Buffer.from(result.signature).toString('base64'),
  };
}
