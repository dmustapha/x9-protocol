import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity } from '@metaplex-foundation/umi';
import { mintAndSubmitAgent, mplAgentIdentity } from '@metaplex-foundation/mpl-agent-registry';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function registerAgent(
  agentSecretKey: Uint8Array,
  agentName: string
): Promise<{ nftAddress: string; txSignature: string }> {
  const umi = createUmi(RPC_URL).use(mplAgentIdentity());
  const keypair = umi.eddsa.createKeypairFromSecretKey(agentSecretKey);
  umi.use(keypairIdentity(keypair));

  const result = await mintAndSubmitAgent(
    umi,
    {},
    {
      wallet: umi.identity.publicKey,
      name: agentName,
      uri: `${APP_URL}/agent-metadata.json`,
      agentMetadata: {
        type: 'agent',
        name: `x9 protocol — ${agentName}`,
        description: 'Autonomous AI trading agent with Swig policy guardrails',
        services: [
          { name: 'trading', endpoint: `${APP_URL}/api/agent/trade` },
        ],
        registrations: [],
        supportedTrust: [],
      },
      network: 'solana-devnet',
    }
  );

  return {
    nftAddress: result.assetAddress?.toString() || '',
    txSignature: result.signature?.toString() || '',
  };
}
