// Copyright (c) dWallet Labs, Ltd.
// SPDX-License-Identifier: BSD-3-Clause-Clear

// Node.js gRPC client for the Ika dWallet service.
// Source: github.com/dwallet-labs/ika-pre-alpha (chains/solana/clients/typescript/src/grpc.ts)
// Adapted for CommonJS/TypeScript module resolution (removed .js extensions from imports).

import * as grpc from '@grpc/grpc-js';
import { randomBytes } from 'crypto';
import {
  DWalletServiceClient,
} from './generated/grpc/ika_dwallet';
import { defineBcsTypes } from './bcs-types';

const { SignedRequestData, TransactionResponseData, UserSignature, VersionedDWalletDataAttestation, VersionedPresignDataAttestation } =
  defineBcsTypes();

export { defineBcsTypes } from './bcs-types';

export interface DKGResult {
  publicKey: Uint8Array;
  publicOutput: Uint8Array;
  attestationData: Uint8Array;
  networkSignature: Uint8Array;
  networkPubkey: Uint8Array;
}

// Full attestation returned from DKG — passed to presign and sign requests.
export interface NetworkAttestation {
  attestationData: Uint8Array;
  networkSignature: Uint8Array;
  networkPubkey: Uint8Array;
  epoch: bigint;
}

export interface IkaDWalletClient {
  requestDKG(senderPubkey: Uint8Array): Promise<DKGResult>;
  requestPresign(
    senderPubkey: Uint8Array,
    dwalletAddr: Uint8Array,
    attestation?: NetworkAttestation,
  ): Promise<Uint8Array>;
  requestSign(
    senderPubkey: Uint8Array, dwalletAddr: Uint8Array,
    message: Uint8Array, presignId: Uint8Array, txSignature: Uint8Array,
    txSlot: bigint,
    attestation?: NetworkAttestation,
  ): Promise<Uint8Array>;
  close(): void;
}

const GRPC_DEADLINE_MS = 30_000;

export function createIkaClient(grpcUrl?: string): IkaDWalletClient {
  // gRPC-js requires bare host:port — strip https:// or http:// prefix if present
  const raw = grpcUrl ?? '127.0.0.1:50051';
  const url = raw.replace(/^https?:\/\//, '');
  const creds = (url.includes('localhost') || url.match(/127\.0\.0\.1/))
    ? grpc.credentials.createInsecure()
    : grpc.credentials.createSsl();
  const client = new DWalletServiceClient(url, creds);

  function submit(userSig: Uint8Array, signedData: Uint8Array): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const deadline = new Date(Date.now() + GRPC_DEADLINE_MS);
      client.submitTransaction(
        { userSignature: Buffer.from(userSig), signedRequestData: Buffer.from(signedData) },
        new grpc.Metadata(),
        { deadline },
        (err, resp) => {
          if (err) reject(err);
          else resolve(new Uint8Array(resp!.responseData));
        },
      );
    });
  }

  // Pre-alpha mock signer: zero-filled 64-byte signature.
  // The single-validator pre-alpha node does not verify Ed25519 signatures —
  // it accepts any syntactically valid UserSignature.
  function buildSig(pubkey: Uint8Array): Uint8Array {
    return UserSignature.serialize({
      Ed25519: { signature: Array.from(new Uint8Array(64)), public_key: Array.from(pubkey) },
    }).toBytes();
  }

  const ZERO_32 = new Uint8Array(32);
  const ZERO_64 = new Uint8Array(64);

  return {
    async requestDKG(senderPubkey) {
      // Use random 32-byte session preimage for uniqueness per DKG request.
      const sessionPreimage = Array.from(randomBytes(32));

      const data = SignedRequestData.serialize({
        session_identifier_preimage: sessionPreimage,
        epoch: 1n, chain_id: { Solana: true },
        intended_chain_sender: Array.from(senderPubkey),
        request: { DKG: {
          dwallet_network_encryption_public_key: Array.from(ZERO_32),
          curve: { Curve25519: true },
          centralized_public_key_share_and_proof: Array.from(ZERO_32),
          user_secret_key_share: { Encrypted: {
            encrypted_centralized_secret_share_and_proof: Array.from(ZERO_32),
            encryption_key: Array.from(ZERO_32),
            signer_public_key: Array.from(senderPubkey),
          }},
          user_public_output: Array.from(ZERO_32),
          sign_during_dkg_request: null,
        }},
      }).toBytes();

      const respBytes = await submit(buildSig(senderPubkey), data);
      const resp = TransactionResponseData.parse(new Uint8Array(respBytes));
      if (!resp.Attestation) throw new Error(`DKG failed: ${JSON.stringify(resp)}`);
      const att = resp.Attestation;
      const payload = VersionedDWalletDataAttestation.parse(new Uint8Array(att.attestation_data));
      if (!payload.V1) throw new Error(`unexpected DKG payload variant: ${JSON.stringify(payload)}`);
      const created = payload.V1;
      return {
        publicKey: new Uint8Array(created.public_key),
        publicOutput: new Uint8Array(created.public_output),
        attestationData: new Uint8Array(att.attestation_data),
        networkSignature: new Uint8Array(att.network_signature),
        networkPubkey: new Uint8Array(att.network_pubkey),
      };
    },

    async requestPresign(senderPubkey, dwalletAddr, attestation) {
      const attData    = attestation?.attestationData ?? ZERO_32;
      const netSig     = attestation?.networkSignature ?? ZERO_64;
      const netPubkey  = attestation?.networkPubkey    ?? ZERO_32;
      const epoch      = attestation?.epoch             ?? 1n;

      const data = SignedRequestData.serialize({
        session_identifier_preimage: Array.from(dwalletAddr),
        epoch: 1n, chain_id: { Solana: true },
        intended_chain_sender: Array.from(senderPubkey),
        request: { PresignForDWallet: {
          dwallet_network_encryption_public_key: Array.from(ZERO_32),
          dwallet_public_key: Array.from(dwalletAddr),
          dwallet_attestation: {
            attestation_data: Array.from(attData),
            network_signature: Array.from(netSig),
            network_pubkey: Array.from(netPubkey),
            epoch,
          },
          curve: { Curve25519: true }, signature_algorithm: { EdDSA: true },
        }},
      }).toBytes();

      const respBytes = await submit(buildSig(senderPubkey), data);
      const resp = TransactionResponseData.parse(new Uint8Array(respBytes));
      if (!resp.Attestation) throw new Error(`Presign failed: ${JSON.stringify(resp)}`);
      const payload = VersionedPresignDataAttestation.parse(new Uint8Array(resp.Attestation.attestation_data));
      if (!payload.V1) throw new Error(`unexpected presign payload variant: ${JSON.stringify(payload)}`);
      return new Uint8Array(payload.V1.presign_session_identifier);
    },

    async requestSign(senderPubkey, dwalletAddr, message, presignId, txSignature, txSlot, attestation) {
      const attData   = attestation?.attestationData ?? ZERO_32;
      const netSig    = attestation?.networkSignature ?? ZERO_64;
      const netPubkey = attestation?.networkPubkey    ?? ZERO_32;
      const epoch     = attestation?.epoch             ?? 1n;

      const data = SignedRequestData.serialize({
        session_identifier_preimage: Array.from(dwalletAddr),
        epoch: 1n, chain_id: { Solana: true },
        intended_chain_sender: Array.from(senderPubkey),
        request: { Sign: {
          message: Array.from(message), message_metadata: [],
          presign_session_identifier: Array.from(presignId),
          message_centralized_signature: Array.from(ZERO_64),
          dwallet_attestation: {
            attestation_data: Array.from(attData),
            network_signature: Array.from(netSig),
            network_pubkey: Array.from(netPubkey),
            epoch,
          },
          approval_proof: { Solana: { transaction_signature: Array.from(txSignature), slot: txSlot } },
        }},
      }).toBytes();

      const respBytes = await submit(buildSig(senderPubkey), data);
      const resp = TransactionResponseData.parse(new Uint8Array(respBytes));
      if (resp.Signature) return new Uint8Array(resp.Signature.signature);
      if (resp.Error) throw new Error(resp.Error.message);
      throw new Error(`Unexpected sign response: ${JSON.stringify(resp)}`);
    },

    close() { client.close(); },
  };
}
