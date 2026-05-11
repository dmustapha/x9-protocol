import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { strategyToPolicy } from '@/lib/claude';
import { createPolicy, createWallet } from '@/lib/swig';
import type { ActionConfig } from '@/types';
import { registerAgent } from '@/lib/metaplex';
import { vanish } from '@/lib/vanish';
import { registerSNSDomain } from '@/lib/sns';
import { enrollAgent, isIkaConfigured } from '@/lib/ika';
import { Keypair, Connection } from '@solana/web3.js';
import { encryptSecret } from '@/lib/crypto';

// In-memory rate limiter: max 5 agent creations per IP per hour
const rateMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  // Parse and validate body first — invalid requests don't consume rate limit slots
  let body: { ownerWallet?: string; name?: string; strategyText?: string; policyRules?: ActionConfig[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { ownerWallet, name: rawName, strategyText, policyRules: prebuiltRules } = body;

  if (!ownerWallet || !strategyText) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // CRON_SECRET bearer token bypasses rate limit (used by integration tests + internal tooling)
  const authHeader = req.headers.get('authorization');
  const isTrusted = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isTrusted) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded — max 5 agents per hour' }, { status: 429 });
    }
  }

  const name = (rawName ?? '')
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/[^\w\s\-_.]/g, '')   // allow only safe chars
    .trim()
    .slice(0, 50)
    || `Agent-${Date.now().toString(36).toUpperCase()}`;

  // Generate agent keypair
  const agentKeypair = Keypair.generate();
  const agentPublicKey = agentKeypair.publicKey.toBase58();
  const agentSecretKey = encryptSecret(Buffer.from(agentKeypair.secretKey).toString('base64'));

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
    // Use pre-generated rules from deploy wizard if provided — avoids second Sonnet call
    // and ensures deployed rules match what the user reviewed and approved
    const policyRules: ActionConfig[] = (Array.isArray(prebuiltRules) && prebuiltRules.length > 0)
      ? prebuiltRules
      : (await strategyToPolicy(strategyText!)).rules;

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
      const walletResult = await createWallet(swigPolicyId, agentPublicKey);
      swigAddress = walletResult.swigAddress;
      if (walletResult.transaction) {
        walletResult.transaction.sign([agentKeypair]);
        const conn = new Connection(process.env.SOLANA_RPC_URL!);
        await conn.sendTransaction(walletResult.transaction);
      }
    } catch {
      // Swig API unavailable — using mock IDs, policy enforcement runs locally
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
      vanishDepositAddr = await vanish.getDepositAddress(undefined, agentPublicKey);
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
