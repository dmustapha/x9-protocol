# x9 protocol — Integration Proof

> Integration evidence for the Solana Frontier Hackathon submission.
> Live on-chain data requires funded wallets and active API keys.
> All integration code is real and production-ready — see source links below.

---

## Swig Policy Engine

**Integration depth:** 5-touchpoint canonical integration

- Policy schema enforcement: `src/lib/swig.ts` — `createPolicy()`, `checkPolicy()`, `enforcePolicy()`
- Policy types enforced: `SolLimit`, `SolRecurringLimit`, `TokenLimit`, `Program` allowlist
- Block events recorded to DB: `BlockEvent` Prisma model captures every policy violation with rule, amount, agent reason
- Natural language → policy translation: `src/lib/claude.ts` — user strategy text parsed into typed Swig rules
- UI: `/deploy` page — policy builder with real-time rule preview; `/agent/[id]` page — live block event log

**Sample block event (from local agent loop):**
- BLOCKED 1,200,000,000 lamports | rule: `SolLimit` (0.5 SOL max per trade) | agent reason: "Market moving fast. Buying 1.2 SOL."

**Source:** `src/lib/swig.ts`, `src/app/api/policy/create/route.ts`, `src/app/api/agent/[id]/route.ts`

---

## Vanish Core API

**Integration depth:** 3-touchpoint privacy routing

- One-time wallet generation: `src/lib/vanish.ts` — `createDepositAddress()` → Vanish returns ephemeral address
- Jito-protected swap execution: `executeVanishSwap()` → Vanish routes the transaction through MEV-protected relay
- Privacy score metadata: each `Trade` record stores `privacyScore` JSON from Vanish response
- Fallback: graceful mock mode when `VANISH_API_KEY` is unset (mock tx ID format: `mock-tx-{timestamp}-{hash}`)
- Live routing requires: `VANISH_API_KEY` in environment (contact vanish.trade for access)

**Source:** `src/lib/vanish.ts`, `src/app/api/agent-engine.ts` lines 160–180

---

## Metaplex Core 014

**Integration depth:** 4-touchpoint agent identity layer

- Agent minting: `src/lib/metaplex.ts` — `mintAgentNFT()` creates a Core NFT with agent name, strategy, owner as attributes
- NFT address stored in `Agent.metaplexNftAddress` Prisma field
- `/agent/[id]` page: NFT badge displayed with abbreviated address and Metaplex Core explorer link
- `/agents` directory: NFT addresses listed alongside SNS `.sol` domains for all deployed agents
- Explorer pattern: `https://core.metaplex.com/explorer/{nftAddress}?env=devnet`

**Live minting requires:** funded Solana devnet wallet with SOL for rent exemption

**Source:** `src/lib/metaplex.ts`, `src/app/agent/[id]/page.tsx`, `src/app/agents/page.tsx`

---

## SNS Identity (Solana Name Service)

**Integration depth:** 5-touchpoint canonical identity layer

- Domain registration: `src/lib/sns.ts` — `registerAgentDomain()` → registers `{agentName}.sol` on agent deploy
- SNS domain stored in `Agent.snsDomain` Prisma field
- Cron loop: `src/app/api/cron/agent-loop/route.ts` — logs reference agent by `.sol` domain (e.g., `[alpha-hunter.sol]`)
- Block event logs: `snsDomain` field included alongside `agentId` in all block events
- `/agents` directory: `.sol` domains displayed in accent color (#00ff88) for each agent
- Reverse lookup: `/agent/[id]` page resolves and displays the `.sol` name

**Source:** `src/lib/sns.ts`, `src/app/agents/page.tsx`, `src/app/agent/[id]/page.tsx`

---

## GoldRush (Covalent)

**Integration depth:** 4-touchpoint on-chain verification layer

- Live portfolio: `src/lib/goldrush.ts` — `getWalletPortfolio()` → Covalent `/solana-mainnet/address/{addr}/balances_v2/`
- On-chain trade verification: `verifyTradeOnChain()` → scans last 25 txs for matching hash → sets `Trade.onChainVerified = true`
- PortfolioCard component: `/dashboard` page shows live SOL + USDC balances sourced from GoldRush
- Token price feed: `getTokenPriceUsd()` augments CoinGecko RSI feed with Covalent price data
- Fallback: `{sol: 2, usdc: 150, source: 'mock'}` when `GOLDRUSH_API_KEY` unset

**Source:** `src/lib/goldrush.ts`, `src/app/api/portfolio/route.ts`, `src/components/PortfolioCard.tsx`

---

## Dune Analytics

**Integration depth:** 4-query server-side analytics engine with 24h cache

- Analytics engine: `src/lib/dune.ts` — `DuneClient` wrapping Dune API with Prisma `DuneCache` (24h TTL)
- 4 DuneSQL queries per agent: trade volume over time, buy/sell ratio, PnL curve by block timestamp, full tx history
- `derivedAnalytics()` fallback: computes same 4 metrics from local `Trade` DB records when `DUNE_API_KEY` unset
- `/agent/[id]` page: `DunePanel` component renders 4 chart widgets using analytics data
- `/proof` page: `getAggregateAnalytics()` aggregates across all agents for portfolio-level view

**Source:** `src/lib/dune.ts`, `src/app/api/dune/[agentId]/route.ts`, `src/components/DunePanel.tsx`

---

## Ika MPC Threshold Signing

**Integration depth:** Additive MPC layer — new agents use threshold signing, existing agents unaffected

- Enrollment: `src/lib/ika.ts` — `enrollAgent()` splits key into threshold shares, stores `ikaKeyId` in `Agent` record
- Signing: `signWithIka()` → Ika validates policy compliance before signing (cryptographic enforcement)
- Fallback path: `agent-engine.ts` line 147–153 — `if (agent.ikaKeyId) use Ika; else use Keypair.fromSecretKey()`
- `Agent.ikaKeyId` is nullable — existing agents without Ika enrollment continue working unchanged

**Source:** `src/lib/ika.ts`, `src/lib/agent-engine.ts` (lines 147–153)

---

## Claude AI

**Models used:**
- `claude-haiku-4-5-20251001` — trade decision loop (cost-optimized for high-frequency calls)
- `claude-sonnet-4-6-20250514` — natural language → Swig policy translation (higher reasoning)

**Integration:** `src/lib/claude.ts`
- `getTradeDecision(marketContext)` → returns `{action, reasoning, confidence}`
- `parseStrategyToPolicy(strategyText)` → returns typed Swig policy rules

**Fallback:** when Claude API credits exhausted, agent holds position and logs `"Claude API unavailable — holding to preserve capital"`

---

## Jupiter Aggregator

**Integration:** `src/lib/jupiter.ts`
- `getSwapQuote(inputMint, outputMint, amount)` → Jupiter Quote API v6
- `buildUnsignedSwap(quoteResponse)` → returns unsigned transaction for Ika/Keypair signing
- Best-route aggregation across all Solana DEXes

**Source:** `src/lib/jupiter.ts`, used in `agent-engine.ts` after Swig policy clearance

---

## Phantom Connect

- App ID: `6673da67-257d-4538-b82c-d3e69928c46e`
- Integration: `@phantom/react-sdk` for wallet connect + embedded wallet
- Wallet address passed to all agent routes as `ownerWallet` for multi-user isolation
- Policy deploy, agent start/stop all require authenticated wallet signature

---

## Open Source

Repository: https://github.com/dmustapha/x9-protocol (or see submitted GitHub link)

All integration code is in `src/lib/`:
`agent-engine.ts` · `swig.ts` · `vanish.ts` · `metaplex.ts` · `sns.ts` · `goldrush.ts` · `dune.ts` · `ika.ts` · `jupiter.ts` · `claude.ts` · `coingecko.ts` · `rsi.ts`
