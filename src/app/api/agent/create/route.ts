import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { strategyToPolicy } from '@/lib/claude';
import { createPolicy, createWallet } from '@/lib/swig';
import { registerAgent } from '@/lib/metaplex';
import { vanish } from '@/lib/vanish';
import { registerSNSDomain } from '@/lib/sns';
import { enrollAgent, isIkaConfigured } from '@/lib/ika';
import { Keypair } from '@solana/web3.js';

export async function POST(req: Request) {
  let body: { ownerWallet?: string; name?: string; strategyText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { ownerWallet, name: rawName, strategyText } = body;

  if (!ownerWallet || !strategyText) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const name = rawName || `Agent-${Date.now().toString(36).toUpperCase()}`;

  // Generate agent keypair
  const agentKeypair = Keypair.generate();
  const agentPublicKey = agentKeypair.publicKey.toBase58();
  const agentSecretKey = Buffer.from(agentKeypair.secretKey).toString('base64');

  // Create agent record
  const agent = await db.agent.create({
    data: {
      ownerWallet,
      name,
      strategyText,
      status: 'creating',
      agentPublicKey,
      agentSecretKey,
    },
  });

  try {
    // Convert NL strategy → Swig ActionConfig
    const policyRules = await strategyToPolicy(strategyText);

    // Create Swig policy (graceful fallback when Swig devnet API is unavailable)
    let swigPolicyId = `mock-policy-${agent.id.slice(0, 8)}`;
    let swigAddress = `mock-wallet-${agent.id.slice(0, 8)}`;
    try {
      const policyResult = await createPolicy({
        name: `x9-${agent.id.slice(0, 8)}`,
        description: `Trading policy for ${name}`,
        authority: { type: 'ED25519', publicKey: agentPublicKey },
        actions: policyRules,
      });
      swigPolicyId = policyResult.id;
      const walletResult = await createWallet(swigPolicyId);
      swigAddress = walletResult.swigAddress;
    } catch {
      // Swig devnet API unavailable — using mock IDs, policy enforcement runs locally
    }

    // Register on Metaplex 014
    let metaplexNftAddress = '';
    try {
      const metaplexResult = await registerAgent(agentKeypair.secretKey, name);
      metaplexNftAddress = metaplexResult.nftAddress;
    } catch {
      metaplexNftAddress = 'registration-pending';
    }

    // Get Vanish deposit address
    let vanishDepositAddr = '';
    try {
      vanishDepositAddr = await vanish.getDepositAddress();
    } catch {
      vanishDepositAddr = 'vanish-pending';
    }

    // Register SNS .sol domain for agent identity
    const snsDomain = await registerSNSDomain(name);

    // Enroll in Ika MPC threshold signing if configured (Day 3 feature)
    let ikaKeyId: string | null = null;
    if (isIkaConfigured()) {
      const ikaResult = await enrollAgent(agent.id, agentPublicKey);
      ikaKeyId = ikaResult?.ikaKeyId ?? null;
    }

    // Save policy config
    await db.policyConfig.create({
      data: {
        agentId: agent.id,
        name: `x9-${agent.id.slice(0, 8)}`,
        rules: JSON.stringify(policyRules),
        swigPolicyId,
      },
    });

    // Update agent with all addresses
    const updated = await db.agent.update({
      where: { id: agent.id },
      data: {
        status: 'paused', // User must start explicitly
        swigPolicyId,
        swigWalletAddress: swigAddress,
        metaplexNftAddress,
        vanishDepositAddr,
        snsDomain,
        ...(ikaKeyId ? { ikaKeyId } : {}),
      },
    });

    const { agentSecretKey: _secret, ...safeAgent } = updated;
    return NextResponse.json({
      agent: safeAgent,
      policy: policyRules,
      swigWalletAddress: swigAddress,
      metaplexNftAddress,
    });
  } catch (err) {
    await db.agent.update({ where: { id: agent.id }, data: { status: 'stopped' } });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
