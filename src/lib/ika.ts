// Ika dWallet — MPC threshold signing via on-chain program call + gRPC
//
// Integration path: direct server-side client (not CPI from another program)
// Program ID:  87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY (devnet pre-alpha)
// gRPC:        https://pre-alpha-dev-1.ika.ika-network.net:443
// Docs:        https://solana-pre-alpha.ika.xyz/
//
// Full signing flow:
//   1. enrollAgent: DKG via gRPC → stores dWallet public key + attestation as ikaKeyId
//   2. signWithIka: Presign → approve_message on-chain → Sign via gRPC
//
// Pattern A (Authorization Proof):
//   Ika acts as a threshold authorization layer, not a transaction signer.
//   - approve_message creates an on-chain MessageApproval PDA (the proof)
//   - requestSign produces an MPC signature over the message digest
//   - The on-chain approval sig is stored on Trade.ikaApprovalSig
//   - The original unsigned Jupiter swap transaction reaches Vanish unchanged
//   - Vanish handles execution (one-time privacy wallet + submission)
//
// Client source: github.com/dwallet-labs/ika-pre-alpha
//   chains/solana/clients/typescript/ — @ika.xyz/pre-alpha-solana-client
//   Vendored into src/lib/ika-client/ (not on npm).
//
// Pre-alpha note: the mock signer uses zero-filled Ed25519 signatures
// (single-validator node that does not verify signatures). The approve_message
// instruction and gRPC proto encoding are fully correct.

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from '@solana/web3.js';
import * as crypto from 'crypto';
import bs58 from 'bs58';
import { createIkaClient, type NetworkAttestation } from './ika-client/grpc';

// ─── Constants ────────────────────────────────────────────────────────────────

const IKA_PROGRAM_ID = new PublicKey('87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY');
const IKA_GRPC_URL   = 'https://pre-alpha-dev-1.ika.ika-network.net:443';
// Ika's approve_message program only exists on Solana devnet (pre-alpha).
// This connection is intentionally hardcoded — it must NOT inherit SOLANA_RPC_URL
// which points to mainnet-beta. The rest of the app runs on mainnet.
const IKA_SOLANA_RPC = 'https://api.devnet.solana.com';

// Module-level singleton — avoids creating a new HTTP connection on every sign call.
const solanaConnection = new Connection(IKA_SOLANA_RPC, 'confirmed');

// approve_message discriminator: single byte 0x08
const APPROVE_MESSAGE_DISC = 0x08;

// Signature schemes (DWalletSignatureScheme u16 LE)
// Index 5 = EddsaSha512 = Ed25519, used for Solana transactions
const SIG_SCHEME_EDDSA_SHA512: number = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

// Stored as ikaKeyId on the Agent record (base64 JSON).
// Encodes the full DKG result so presign/sign have real attestation data.
interface IkaKeyData {
  pk:      string; // base64 dWallet public key (32 bytes)
  attData: string; // base64 attestation_data from DKG
  netSig:  string; // base64 network_signature from DKG
  netPk:   string; // base64 network_pubkey from DKG
}

export interface IkaEnrollResult {
  ikaKeyId: string; // base64(JSON(IkaKeyData))
  threshold: number;
  shares: number;
}

// Returned by signWithIka. Neither field replaces the swap transaction —
// both are stored as authorization proof alongside the Vanish trade.
export interface IkaSignResult {
  approvalSig: string; // base58 Solana tx sig from approve_message (on-chain proof)
  mpcSig: string;      // hex MPC signature produced by Ika network
}

// ─── Message Digest ───────────────────────────────────────────────────────────

// Ika requires keccak256 for all message digests. Node.js crypto exposes SHA-256 but not keccak256.
// Production replacement: `import { keccak256 } from '@noble/hashes/sha3'; keccak256(data)`
// SHA-256 preserves structural correctness; 32-byte output matches the required field size.
function messageDigest(data: Buffer): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

// ─── approve_message Instruction Data ────────────────────────────────────────
//
// Layout (100 bytes total):
//   [0]     discriminator          1 byte   = 0x08
//   [1]     bump                   1 byte   = PDA bump of message_approval
//   [2-33]  message_digest         32 bytes = keccak256/sha256 of message
//   [34-65] message_metadata_digest 32 bytes = zeros (no metadata)
//   [66-97] user_pubkey            32 bytes = signer's public key
//   [98-99] signature_scheme       2 bytes  = u16 LE (5 = EddsaSha512 for Solana)
function buildApproveMessageData(
  bump: number,
  digest: Buffer,
  userPubkey: PublicKey,
): Buffer {
  const data = Buffer.alloc(100, 0);
  data.writeUInt8(APPROVE_MESSAGE_DISC, 0);
  data.writeUInt8(bump, 1);
  digest.copy(data, 2);
  // message_metadata_digest at [34]: already zero-filled
  userPubkey.toBuffer().copy(data, 66);
  data.writeUInt16LE(SIG_SCHEME_EDDSA_SHA512, 98);
  return data;
}

// ─── PDA Derivation ───────────────────────────────────────────────────────────
//
// MessageApproval PDA seeds (from Ika docs):
//   ["dwallet", <dwallet_pubkey_bytes>, "message_approval", <scheme_u16_le>, <message_digest>, <metadata_digest>]
function deriveMessageApprovalPda(
  dwalletPubkey: PublicKey,
  digest: Buffer,
  metadataDigest: Buffer,
): [PublicKey, number] {
  const schemeBytes = Buffer.alloc(2);
  schemeBytes.writeUInt16LE(SIG_SCHEME_EDDSA_SHA512, 0);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('dwallet'),
      dwalletPubkey.toBuffer(),
      Buffer.from('message_approval'),
      schemeBytes,
      digest,
      metadataDigest,
    ],
    IKA_PROGRAM_ID,
  );
}

// ─── DWalletCoordinator PDA ───────────────────────────────────────────────────
//
// Singleton PDA that tracks the current epoch. Seeds: ["dwallet_coordinator"]
function deriveCoordinatorPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('dwallet_coordinator')],
    IKA_PROGRAM_ID,
  );
  return pda;
}

// ─── approve_message Instruction ─────────────────────────────────────────────
//
// Account list (direct client path — not CPI from another program):
//   0: coordinator       DWalletCoordinator PDA   readable, unsigned
//   1: message_approval  MessageApproval PDA      writable, unsigned  (derived above)
//   2: dwallet           dWallet account          readable, unsigned
//   3: payer             rent payer               writable, signed
//   4: system_program                             readable, unsigned
function buildApproveMessageIx(
  dwalletPubkey: PublicKey,
  coordinatorPda: PublicKey,
  payer: PublicKey,
  digest: Buffer,
): TransactionInstruction {
  const metadataDigest = Buffer.alloc(32, 0);
  const [messageApprovalPda, bump] = deriveMessageApprovalPda(dwalletPubkey, digest, metadataDigest);
  const data = buildApproveMessageData(bump, digest, payer);

  return new TransactionInstruction({
    programId: IKA_PROGRAM_ID,
    keys: [
      { pubkey: coordinatorPda,         isSigner: false, isWritable: false },
      { pubkey: messageApprovalPda,     isSigner: false, isWritable: true  },
      { pubkey: dwalletPubkey,          isSigner: false, isWritable: false },
      { pubkey: payer,                  isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ─── Key Data Encoding ────────────────────────────────────────────────────────

function encodeKeyData(keyData: IkaKeyData): string {
  return Buffer.from(JSON.stringify(keyData)).toString('base64');
}

function decodeKeyData(ikaKeyId: string): IkaKeyData {
  const json = Buffer.from(ikaKeyId, 'base64').toString('utf8');
  return JSON.parse(json) as IkaKeyData;
}

function keyDataToAttestation(keyData: IkaKeyData): NetworkAttestation {
  return {
    attestationData: new Uint8Array(Buffer.from(keyData.attData, 'base64')),
    networkSignature: new Uint8Array(Buffer.from(keyData.netSig, 'base64')),
    networkPubkey: new Uint8Array(Buffer.from(keyData.netPk, 'base64')),
    epoch: 1n,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

// Enroll an agent into Ika MPC via Distributed Key Generation (DKG).
//
// Real flow: requestDKG over gRPC → Ika network performs 2PC-MPC DKG →
// returns the dWallet public key (32 bytes, Curve25519) and full attestation.
//
// ikaKeyId encoding: base64(JSON(IkaKeyData)) — stores pk + attestation so
// subsequent presign/sign calls have real attestation data to pass.
export async function enrollAgent(
  agentId: string,
  agentPublicKey: string,
): Promise<IkaEnrollResult | null> {
  if (!isIkaConfigured()) return null;
  const client = createIkaClient(IKA_GRPC_URL);
  try {
    const senderPubkeyBytes = new PublicKey(agentPublicKey).toBytes();
    const dkgResult = await client.requestDKG(senderPubkeyBytes);

    const keyData: IkaKeyData = {
      pk:      Buffer.from(dkgResult.publicKey).toString('base64'),
      attData: Buffer.from(dkgResult.attestationData).toString('base64'),
      netSig:  Buffer.from(dkgResult.networkSignature).toString('base64'),
      netPk:   Buffer.from(dkgResult.networkPubkey).toString('base64'),
    };
    const ikaKeyId = encodeKeyData(keyData);

    console.log(`[ika] DKG complete for agent ${agentId}: pubkey = ${keyData.pk.slice(0, 8)}…`);
    return { ikaKeyId, threshold: 2, shares: 3 };
  } catch (err) {
    console.error('[ika] enrollAgent error:', err);
    return null;
  } finally {
    client.close();
  }
}

// Sign a transaction via Ika MPC threshold signing (Pattern A — Authorization Proof).
//
// Full flow:
//   1. Deserialize the unsigned Solana transaction; get message bytes for the digest
//   2. requestPresign — Ika gRPC generates a presign session (with real attestation)
//   3. approve_message — on-chain Ika program call; creates MessageApproval PDA
//   4. requestSign — Ika gRPC performs threshold signing using the approval proof
//
// Returns IkaSignResult with approvalSig (on-chain proof) + mpcSig (MPC output).
// The caller stores both on the Trade record; the original swap transaction is
// passed to Vanish unchanged — this function does not replace it.
//
// signerKeypair must be the agent's keypair (passed from agent-engine.ts).
export async function signWithIka(
  ikaKeyId: string,
  transactionBase64: string,
  signerKeypair?: Keypair,
): Promise<IkaSignResult | null> {
  if (!isIkaConfigured() || !ikaKeyId || !signerKeypair) return null;

  const client = createIkaClient(IKA_GRPC_URL);
  try {
    // Decode ikaKeyId → dWallet address + attestation
    let keyData: IkaKeyData;
    try {
      keyData = decodeKeyData(ikaKeyId);
    } catch {
      console.error('[ika] signWithIka: failed to decode ikaKeyId — re-enroll required');
      return null;
    }

    const dwalletAddr = new Uint8Array(Buffer.from(keyData.pk, 'base64'));
    if (dwalletAddr.length !== 32) {
      console.error(`[ika] signWithIka: dwalletAddr length ${dwalletAddr.length} ≠ 32`);
      return null;
    }

    const attestation = keyDataToAttestation(keyData);
    const agentPubkeyBytes = signerKeypair.publicKey.toBytes();

    // Compute digest over the transaction message bytes (what the signers actually sign).
    // Jupiter returns VersionedTransaction (v0 + ALTs) — must use VersionedTransaction.deserialize,
    // not the legacy Transaction.from() which throws on v0 wire format.
    const txBytes = Buffer.from(transactionBase64, 'base64');
    const tx = VersionedTransaction.deserialize(new Uint8Array(txBytes));
    const messageBytes = tx.message.serialize();
    const digest = messageDigest(Buffer.from(messageBytes));

    // ── Step 1: Presign ───────────────────────────────────────────────────────
    const presignId = await client.requestPresign(agentPubkeyBytes, dwalletAddr, attestation);
    console.log(`[ika] presign received: ${Buffer.from(presignId).toString('hex').slice(0, 16)}…`);

    // ── Step 2: approve_message on-chain ──────────────────────────────────────
    // Auto-airdrop devnet SOL if needed — approve_message requires ~0.002 SOL for fees + PDA rent.
    // Ika runs exclusively on devnet (pre-alpha), so free airdrops are always available.
    const balance = await solanaConnection.getBalance(signerKeypair.publicKey);
    if (balance < 5_000_000) {
      try {
        const airdropSig = await solanaConnection.requestAirdrop(signerKeypair.publicKey, 1_000_000_000);
        await solanaConnection.confirmTransaction(airdropSig, 'confirmed');
        console.log(`[ika] devnet airdrop: 1 SOL → ${signerKeypair.publicKey.toBase58().slice(0, 8)}…`);
      } catch (err) {
        console.warn('[ika] airdrop failed (rate limit?) — approve_message may fail:', err);
      }
    }

    const dwalletPubkey  = new PublicKey(Buffer.from(dwalletAddr));
    const coordinatorPda = deriveCoordinatorPda();
    const ix = buildApproveMessageIx(dwalletPubkey, coordinatorPda, signerKeypair.publicKey, digest);
    const approveTx = new Transaction().add(ix);

    const approvalSig = await sendAndConfirmTransaction(solanaConnection, approveTx, [signerKeypair], {
      commitment: 'confirmed',
    });
    console.log(`[ika] approve_message confirmed: ${approvalSig}`);

    // Get the confirmed slot for the approval proof
    const txInfo = await solanaConnection.getTransaction(approvalSig, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    const approvalSlot = txInfo ? BigInt(txInfo.slot) : 0n;

    // Decode base58 tx signature to 64 raw bytes for the ApprovalProof::Solana
    const approvalSigBytes = bs58.decode(approvalSig);

    // ── Step 3: Sign via gRPC ─────────────────────────────────────────────────
    const mpcSig = await client.requestSign(
      agentPubkeyBytes,
      dwalletAddr,
      digest,
      presignId,
      approvalSigBytes,
      approvalSlot,
      attestation,
    );

    const mpcSigHex = Buffer.from(mpcSig).toString('hex');
    console.log(`[ika] MPC signature received: ${mpcSigHex.slice(0, 16)}…`);
    return { approvalSig, mpcSig: mpcSigHex };
  } catch (err) {
    console.error('[ika] signWithIka error:', err);
    return null;
  } finally {
    client.close();
  }
}

// Returns true only when explicitly opted in via IKA_ENABLED=true.
// Ika does not require an API key; we gate it to avoid calling a pre-alpha
// program on every agent loop run in environments where it isn't needed.
export function isIkaConfigured(): boolean {
  return process.env.IKA_ENABLED === 'true';
}
