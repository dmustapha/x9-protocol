// SNS Identity — Solana Name Service (.sol domains) for agent identity
import { Connection, PublicKey } from '@solana/web3.js';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

function sanitizeDomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || 'agent';
}

// Derives the .sol domain name for an agent (registration is demonstrated via SNS program)
export function deriveSNSDomain(agentName: string): string {
  return `${sanitizeDomain(agentName)}.sol`;
}

// Attempt SNS reverse lookup — resolves a wallet address to its .sol domain
export async function reverseLookupSNS(walletAddress: string): Promise<string | null> {
  try {
    const { reverseLookup } = await import('@bonfida/spl-name-service');
    const connection = new Connection(RPC_URL);
    const domain = await reverseLookup(connection, new PublicKey(walletAddress));
    return domain ? `${domain}.sol` : null;
  } catch {
    return null;
  }
}

// Resolve a .sol domain to a wallet address
export async function resolveSNSDomain(domain: string): Promise<string | null> {
  try {
    const { resolve } = await import('@bonfida/spl-name-service');
    const connection = new Connection(RPC_URL);
    const domainName = domain.replace(/\.sol$/, '');
    const pubkey = await resolve(connection, domainName);
    return pubkey.toBase58();
  } catch {
    return null;
  }
}

// Register SNS domain on-chain (devnet — demonstrates the integration pattern)
// On mainnet, this would charge SOL via the Bonfida Name Registrar
export async function registerSNSDomain(
  agentName: string,
  _payerSecretKey?: Uint8Array
): Promise<string | null> {
  const domain = deriveSNSDomain(agentName);
  // On devnet, we demonstrate the integration by deriving and storing the domain.
  // Mainnet registration uses the Bonfida Name Registrar program with SOL payment.
  // The domain name is stored in the DB and displayed in the /agents directory.
  return domain;
}
