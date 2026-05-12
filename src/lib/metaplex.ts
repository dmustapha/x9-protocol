// Metaplex Core — mint each agent as a Core Asset (NFT) on devnet.
// Uses @metaplex-foundation/mpl-core (installed) — NOT the nonexistent mpl-agent-registry.
//
// Core Assets are lighter than Metaplex Token Metadata NFTs: no separate mint/token
// account, fewer accounts per instruction, lower fees.
//
// Fee-payer strategy:
//   If DEVNET_RESERVOIR_KEY is set (base64-encoded Uint8Array), the reservoir wallet
//   pays all fees. This removes the airdrop dependency entirely — the reservoir is
//   pre-funded once and serves all agent mints.
//   If not set, we fall back to requesting a devnet airdrop to the agent keypair.
//
// To generate a reservoir keypair and fund it:
//   node -e "const {Keypair}=require('@solana/web3.js'); const kp=Keypair.generate(); console.log('pub:', kp.publicKey.toBase58()); console.log('key:', Buffer.from(kp.secretKey).toString('base64'));"
//   Then: solana airdrop 2 <pubkey> --url devnet
//   Set DEVNET_RESERVOIR_KEY=<base64> in Vercel env vars.
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, keypairPayer, generateSigner, createSignerFromKeypair } from '@metaplex-foundation/umi';
import { create, mplCore } from '@metaplex-foundation/mpl-core';
import { Connection, Keypair } from '@solana/web3.js';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://x9-protocol.vercel.app';

function getReservoirKeypair(): Keypair | null {
  const raw = process.env.DEVNET_RESERVOIR_KEY;
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(Buffer.from(raw, 'base64'));
  } catch {
    console.warn('[metaplex] DEVNET_RESERVOIR_KEY is set but invalid — falling back to airdrop');
    return null;
  }
}

export async function registerAgent(
  agentSecretKey: Uint8Array,
  agentName: string
): Promise<{ nftAddress: string; txSignature: string }> {
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const reservoir = getReservoirKeypair();

  if (reservoir) {
    // Reservoir pays — no airdrop needed. Agent keypair is the NFT identity only.
    const bal = await connection.getBalance(reservoir.publicKey);
    if (bal < 5_000_000) {
      console.warn(`[metaplex] Reservoir low (${bal} lamports) — mint may fail. Top up: ${reservoir.publicKey.toBase58()}`);
    }
  } else {
    // No reservoir — airdrop to agent keypair as fallback
    const solKeypair = Keypair.fromSecretKey(agentSecretKey);
    const balance = await connection.getBalance(solKeypair.publicKey);
    if (balance < 5_000_000) {
      try {
        const sig = await connection.requestAirdrop(solKeypair.publicKey, 1_000_000_000);
        await connection.confirmTransaction(sig, 'confirmed');
        console.log(`[metaplex] devnet airdrop: 1 SOL → ${solKeypair.publicKey.toBase58().slice(0, 8)}…`);
      } catch (err) {
        console.warn('[metaplex] airdrop failed — set DEVNET_RESERVOIR_KEY to avoid this:', err);
      }
    }
  }

  const umi = createUmi(DEVNET_RPC).use(mplCore());
  const agentUmiKeypair = umi.eddsa.createKeypairFromSecretKey(agentSecretKey);

  // Agent is always the NFT identity (owner/authority)
  umi.use(keypairIdentity(agentUmiKeypair));

  // If reservoir exists, override the payer so fees come from the reservoir, not the agent
  if (reservoir) {
    const reservoirUmiKeypair = umi.eddsa.createKeypairFromSecretKey(reservoir.secretKey);
    umi.use(keypairPayer(reservoirUmiKeypair));
  }

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
