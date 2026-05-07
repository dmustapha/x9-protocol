# x9 protocol Implementation Plan

**Project:** x9-protocol
**Hackathon:** Solana Frontier Hackathon
**Deadline:** 2026-05-12 06:59 UTC (9 days remaining, 8 build days)
**Stack:** TypeScript, Next.js 15, Prisma 6, SQLite, TailwindCSS 4
**Architecture Doc:** /Users/MAC/solana-frontier/x9-protocol/ARCHITECTURE.md (THE source of truth for all code)

---

## How to Use This Plan

1. Read in order. Do not skip phases. Do not reorder tasks.
2. Every phase has a GATE checklist. Verify every item before proceeding.
3. When you see a decision point, test BOTH paths and follow the one that matches.
4. Copy code from ARCHITECTURE.md — do not improvise.
5. Commit after every task using the specified commit messages.
6. Save deployed addresses / credentials to .env immediately.
7. If something fails and isn't covered by a decision tree: STOP. Report the error. Do not guess.
8. VERIFY-MILESTONE tasks are mandatory — failure stops the plan.
9. seed-demo.ts must be implemented before any demo-related phase. Run it before every E2E test.

---

## Phase Overview

| Phase | Purpose | Est. Time | Depends On | Day |
|:---:|---------|-----------|-----------|:---:|
| 0 | Project scaffold + dependency install | 2h | — | May 3 |
| 1 | Core infrastructure (types, DB, service clients) | 6h | Phase 0 | May 3-4 |
| 2 | Agent engine + API routes | 6h | Phase 1 | May 4-5 |
| 3 | Swig enforcement + Vanish routing | 5h | Phase 2 | May 5 |
| 4 | Frontend dashboard (core pages) | 6h | Phase 2 | May 6 |
| 5 | Deploy wizard + Phantom Connect | 5h | Phase 3, 4 | May 7 |
| 6 | Seed data + proof generation | 3h | Phase 5 | May 8 |
| 7 | Integration testing + bug fixes | 4h | Phase 6 | May 9 |
| 8 | Polish + feature freeze | 4h | Phase 7 | May 10 |
| 9 | Demo recording + submission prep | 4h | Phase 8 | May 11 |

---

## Phase 0: Project Scaffold

**Purpose:** Initialize the project, install all dependencies, set up database schema, verify toolchain.
**Estimated time:** 2 hours

### Task 0.1: Initialize Next.js Project

**Files:**
- Create: `package.json` (from ARCHITECTURE.md Section 20)
- Create: `tsconfig.json` (from ARCHITECTURE.md Section 20)
- Create: `next.config.ts` (from ARCHITECTURE.md Section 20)
- Create: `tailwind.config.ts` (from ARCHITECTURE.md Section 20)

**Steps:**

1. Create the project directory and initialize:
   ```bash
   cd /Users/MAC/solana-frontier/x9-protocol
   mkdir -p src/{app,lib,types,providers,components/{layout,dashboard,deploy,shared}} prisma scripts public
   ```

2. Copy `package.json` from ARCHITECTURE.md Section 20 exactly:
   ```bash
   # Write the file with all dependencies listed in ARCHITECTURE.md
   ```

3. Install dependencies:
   ```bash
   npm install
   ```
   Expected: No errors. All packages resolve.

4. Copy `tsconfig.json` from ARCHITECTURE.md Section 20.

5. Copy `next.config.ts` from ARCHITECTURE.md Section 20.

6. Copy `tailwind.config.ts` from ARCHITECTURE.md Section 20.

**Decision Point: npm install fails with peer dependency conflicts**

Run: `npm install`
Expected: Clean install, `node_modules/` created.

If you get peer dependency errors:
1. Run `npm install --legacy-peer-deps`
2. If still failing on a specific package, check the version in ARCHITECTURE.md and pin it
3. Re-run `npm install`

If nothing works:
1. Delete `node_modules/` and `package-lock.json`
2. Remove the conflicting package from `package.json`
3. Re-run `npm install`, then `npm install {package}@{version}` individually
4. Continue from Task 0.2.

**Commit:**
```bash
git init
git add package.json tsconfig.json next.config.ts tailwind.config.ts
git commit -m "chore: initialize x9 protocol Next.js project with all dependencies"
```

---

### Task 0.2: Set Up Environment + Database

**Files:**
- Create: `.env.example` (from ARCHITECTURE.md Section 20)
- Create: `.env` (copy from .env.example, fill real values)
- Create: `prisma/schema.prisma` (from ARCHITECTURE.md Section 4)
- Create: `src/lib/db.ts` (from ARCHITECTURE.md Section 5)

**Steps:**

1. Copy `.env.example` from ARCHITECTURE.md Section 20.

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in real values:
   - `ANTHROPIC_API_KEY` — from user's Anthropic account
   - `VANISH_API_KEY` — PENDING (use "mock" for now)
   - `NEXT_PUBLIC_PHANTOM_APP_ID` — `6673da67-257d-4538-b82c-d3e69928c46e`
   - `DATABASE_URL` — `file:./dev.db`

3. Copy `prisma/schema.prisma` from ARCHITECTURE.md Section 4.

4. Generate Prisma client and create database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   Expected:
   ```
   Environment variables loaded from .env
   Prisma schema loaded from prisma/schema.prisma
   Datasource "db": SQLite database "dev.db"
   Your database is now in sync with your Prisma schema.
   ```

5. Copy `src/lib/db.ts` from ARCHITECTURE.md Section 5.

**Decision Point: Prisma generate fails**

Run: `npx prisma generate`
Expected: `Generated Prisma Client`

If you get `Error: Generator "prisma-client-js" failed`:
1. Check `prisma/schema.prisma` for syntax errors
2. Run `npx prisma validate`
3. Fix any reported issues
4. Re-run `npx prisma generate`

If `npx prisma db push` fails with SQLite errors:
1. Delete `prisma/dev.db` if it exists
2. Re-run `npx prisma db push`

**Commit:**
```bash
git add .env.example prisma/schema.prisma src/lib/db.ts
git commit -m "feat: add database schema with Agent, Trade, PricePoint, PolicyConfig, BlockEvent models"
```

---

### Task 0.3: Create Shared Types

**Files:**
- Create: `src/types/index.ts` (from ARCHITECTURE.md Section 3)

**Steps:**

1. Copy `src/types/index.ts` from ARCHITECTURE.md Section 3 exactly. This file defines all shared enums, interfaces, constants, and the ActionConfig union type.

2. Verify TypeScript compiles:
   ```bash
   npx tsc --noEmit src/types/index.ts 2>&1 | head -20
   ```
   Expected: No errors (or only errors from missing module declarations which resolve after full project setup).

**Commit:**
```bash
git add src/types/index.ts
git commit -m "feat: add shared types — enums, interfaces, ActionConfig, constants"
```

---

### Phase 0 Gate

Before proceeding to Phase 1, verify:
- [ ] `npm run dev` starts without crash (Ctrl+C after seeing "Ready")
  ```bash
  timeout 15 npx next dev 2>&1 | tail -5
  ```
- [ ] `npx prisma studio` opens without error (Ctrl+C after seeing "Started")
  ```bash
  timeout 10 npx prisma studio 2>&1 | tail -3
  ```
- [ ] `src/types/index.ts` exists with all enums: `AgentStatus`, `TradeAction`, `TradeStatus`
- [ ] `.env` file has all required variables (even if some are placeholders)
- [ ] All commits made for Phase 0

**If any check fails: DO NOT proceed. Fix the failing check first.**

---

## Phase 1: Core Infrastructure

**Purpose:** Build all service client libraries that the Agent Engine depends on. These are the building blocks.
**Estimated time:** 6 hours

### Task 1.1: CoinGecko Price Client

**Files:**
- Create: `src/lib/coingecko.ts` (from ARCHITECTURE.md Section 6)

**Steps:**

1. Copy `src/lib/coingecko.ts` from ARCHITECTURE.md Section 6.

2. Quick smoke test:
   ```bash
   npx ts-node -e "
   const { fetchPrices } = require('./src/lib/coingecko');
   fetchPrices().then(p => console.log('SOL:', p.sol, 'USDC:', p.usdc)).catch(e => console.error(e));
   "
   ```
   Expected: `SOL: <number> USDC: <number close to 1.0>`

**Decision Point: CoinGecko API returns 429 (rate limited)**

Run: the smoke test above
Expected: prices printed

If you get 429 or timeout:
1. Wait 60 seconds, retry
2. If still failing: the 30s cache in the client handles this. For testing, hardcode a test price
3. Continue — the cache will smooth over rate limits in production

**Commit:**
```bash
git add src/lib/coingecko.ts
git commit -m "feat: add CoinGecko price client with 30s cache"
```

---

### Task 1.2: RSI Calculator

**Files:**
- Create: `src/lib/rsi.ts` (from ARCHITECTURE.md Section 7)

**Steps:**

1. Copy `src/lib/rsi.ts` from ARCHITECTURE.md Section 7.

2. Verify with known values:
   ```bash
   npx ts-node -e "
   const { calculateRSI } = require('./src/lib/rsi');
   // 14 prices trending up should give RSI > 50
   const prices = [100,101,102,103,104,105,106,107,108,109,110,111,112,113,114];
   console.log('RSI:', calculateRSI(prices));
   "
   ```
   Expected: RSI > 50 (likely ~100 for a pure uptrend of 14 consecutive gains)

**Commit:**
```bash
git add src/lib/rsi.ts
git commit -m "feat: add RSI calculator (14-period Wilder smoothing)"
```

---

### Task 1.3: Claude Decision Client

**Files:**
- Create: `src/lib/claude.ts` (from ARCHITECTURE.md Section 8)

**Steps:**

1. Copy `src/lib/claude.ts` from ARCHITECTURE.md Section 8. This contains:
   - `TRADE_TOOL` schema definition
   - `getTradeDecision()` — calls claude-haiku-4-5 with tool_use
   - `strategyToPolicy()` — calls claude-sonnet-4-6 to convert NL strategy to ActionConfig array

2. Verify the API key is set:
   ```bash
   grep ANTHROPIC_API_KEY .env
   ```
   Expected: Non-empty value starting with `sk-ant-`

3. Quick test (uses real API — 1 call):
   ```bash
   npx ts-node -e "
   const { getTradeDecision } = require('./src/lib/claude');
   const ctx = {
     prices: { sol: 150, usdc: 1 },
     rsiValues: { sol: 45 },
     portfolio: { sol: 2, usdc: 150 },
     recentTrades: [],
     policyUsage: { solUsedToday: 0, solDailyLimit: 5000000000 }
   };
   getTradeDecision(ctx, 'Buy SOL when RSI < 30, sell when RSI > 70').then(d => console.log(JSON.stringify(d))).catch(e => console.error(e));
   "
   ```
   Expected: `{"action":"hold"|"buy"|"sell","token":"SOL"|"USDC","amount_lamports":<number>,"reason":"..."}`

**Decision Point: Claude API returns error**

Run: the test above
Expected: valid JSON decision

If you get `401 Unauthorized`:
1. Check `ANTHROPIC_API_KEY` in `.env`
2. Verify the key at https://console.anthropic.com
3. Re-run

If you get `429 Rate Limited`:
1. Wait 30 seconds, retry
2. If persistent: check account tier and usage

If Claude returns malformed tool_use:
1. The strict schema + `tool_choice: { type: 'any' }` should prevent this
2. If it still happens: the fallback in `getTradeDecision` returns `{ action: 'hold', ... }`
3. This is acceptable — agent holds when uncertain

**Commit:**
```bash
git add src/lib/claude.ts
git commit -m "feat: add Claude client — trade decisions via tool_use + NL strategy conversion"
```

---

### Task 1.4: Swig Policy Client

**Files:**
- Create: `src/lib/swig.ts` (from ARCHITECTURE.md Section 9)

**Steps:**

1. Copy `src/lib/swig.ts` from ARCHITECTURE.md Section 9.

2. This client handles:
   - `createPolicy()` — deploys ActionConfig array as Swig policy
   - `createWallet()` — creates Swig smart wallet with policy
   - `preCheckTrade()` — validates a trade against policy before execution

3. Verify imports resolve:
   ```bash
   npx tsc --noEmit src/lib/swig.ts 2>&1 | head -10
   ```

**Decision Point: @swig-wallet/api or @swig-wallet/developer not found**

Run: `npx tsc --noEmit src/lib/swig.ts`
Expected: No "Cannot find module" errors

If you get module not found:
1. `npm ls @swig-wallet/api` — verify installed
2. If missing: `npm install @swig-wallet/api@1.3.0 @swig-wallet/developer@1.3.1`
3. Re-run typecheck

If types don't match (Swig SDK breaking change):
1. Check `node_modules/@swig-wallet/api/dist/index.d.ts` for actual exported types
2. Adapt `createPolicy()` parameters to match actual SDK
3. Tag the adaptation as [UNVERIFIED] in a code comment

**Commit:**
```bash
git add src/lib/swig.ts
git commit -m "feat: add Swig client — policy creation, wallet creation, trade pre-check"
```

---

### Task 1.5: Vanish Trade Client

**Files:**
- Create: `src/lib/vanish.ts` (from ARCHITECTURE.md Section 10)

**Steps:**

1. Copy `src/lib/vanish.ts` from ARCHITECTURE.md Section 10. This includes:
   - `VanishClient` — real API client
   - `MockVanishClient` — local mock for Plan B
   - `createVanishClient()` — factory function selecting real vs mock based on `VANISH_API_KEY`
   - `buildPrivacyScore()` — calculates privacy metrics

2. Check which mode will be active:
   ```bash
   grep VANISH_API_KEY .env
   ```
   If value is "mock" or empty: mock client activates automatically.

**Decision Point: Vanish API key status**

If `VANISH_API_KEY` is a real key:
1. Test with a small deposit call (will fail without funds, but validates auth)
2. If 401: key is invalid. Switch to mock.
3. If 200: proceed with real client.

If `VANISH_API_KEY` is "mock" or empty (Plan B):
1. Mock client activates automatically
2. All trade operations succeed locally
3. Privacy score shows "demo mode"
4. This is the expected path until the API key arrives

**Commit:**
```bash
git add src/lib/vanish.ts
git commit -m "feat: add Vanish client with real + mock implementations"
```

---

### Task 1.6: Jupiter Swap Client

**Files:**
- Create: `src/lib/jupiter.ts` (from ARCHITECTURE.md Section 11)

**Steps:**

1. Copy `src/lib/jupiter.ts` from ARCHITECTURE.md Section 11.

2. Quick test (no auth needed):
   ```bash
   npx ts-node -e "
   const { getSwapQuote } = require('./src/lib/jupiter');
   getSwapQuote('So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 100000000, 50).then(q => console.log('Quote:', JSON.stringify(q).slice(0,200))).catch(e => console.error(e));
   "
   ```
   Expected: JSON object with `inputMint`, `outputMint`, `outAmount` fields

**Commit:**
```bash
git add src/lib/jupiter.ts
git commit -m "feat: add Jupiter swap client — quote + transaction builder"
```

---

### Task 1.7: Metaplex Agent Registry Client

**Files:**
- Create: `src/lib/metaplex.ts` (from ARCHITECTURE.md Section 12)

**Steps:**

1. Copy `src/lib/metaplex.ts` from ARCHITECTURE.md Section 12.

2. Verify import resolves:
   ```bash
   npx tsc --noEmit src/lib/metaplex.ts 2>&1 | head -10
   ```

**Decision Point: mpl-agent-registry not found**

Run: `npx tsc --noEmit src/lib/metaplex.ts`
Expected: Compiles (may warn about unused params)

If module not found:
1. `npm install @metaplex-foundation/mpl-agent-registry@0.2.5`
2. If the package doesn't exist on npm: this is a pre-1.0 SDK
3. Fallback: comment out the import, hardcode a mock NFT address
4. Tag as [ASSUMED] in code comment
5. Continue — Metaplex registration is non-blocking for core agent loop

**Commit:**
```bash
git add src/lib/metaplex.ts
git commit -m "feat: add Metaplex 014 client — agent identity registration"
```

---

### Task 1.8: Create Domain Knowledge File

**Files:**
- Create: `DOMAIN-GUIDE.md` (from ARCHITECTURE.md Section 21)

**Steps:**

1. Write `DOMAIN-GUIDE.md` with key domain concepts from ARCHITECTURE.md Section 21:
   - RSI (Relative Strength Index) — 14-period momentum oscillator
   - Swig ActionConfig — policy rule that limits agent trading authority
   - Vanish one-time wallet — ephemeral address for trade privacy
   - Agent loop — 5-minute autonomous cycle
   - Policy pre-check — validation before trade execution
   - Block event — logged policy violation
   - Privacy score — composite metric from Vanish usage
   - All 10-20 domain terms with definitions

**Commit:**
```bash
git add DOMAIN-GUIDE.md
git commit -m "docs: add domain knowledge guide for x9 protocol"
```

---

### Phase 1 Gate

Before proceeding to Phase 2, verify:
- [ ] All 9 lib files exist in `src/lib/`:
  ```bash
  ls src/lib/*.ts | wc -l
  ```
  Expected: 9
- [ ] `src/types/index.ts` exists
- [ ] Prisma client generates without errors: `npx prisma generate`
- [ ] CoinGecko returns prices (smoke test)
- [ ] Claude returns a trade decision (smoke test)
- [ ] Jupiter returns a swap quote (smoke test)
- [ ] All commits made for Phase 1

**If any check fails: DO NOT proceed. Fix the failing check first.**

---

## Phase 2: Agent Engine + API Routes

**Purpose:** Build the core agent loop and all REST API endpoints. After this phase, the backend is functional.
**Estimated time:** 6 hours

### Task 2.1: Agent Engine

**Files:**
- Create: `src/lib/agent-engine.ts` (from ARCHITECTURE.md Section 13)

**Steps:**

1. Copy `src/lib/agent-engine.ts` from ARCHITECTURE.md Section 13. This is the CORE of the product — the 9-step autonomous trading loop:
   - Step 1: Fetch prices from CoinGecko
   - Step 2: Store in DB, accumulate history
   - Step 3: Calculate RSI (need 15+ price points)
   - Step 4: Build market context, call Claude for decision
   - Step 5: If hold, log and return
   - Step 6: Pre-check against Swig policy
   - Step 7: If blocked, log BlockEvent, pause agent
   - Step 8: Build Jupiter swap, route through Vanish
   - Step 9: Always /commit, record trade in DB

2. This file imports from all service clients. Verify:
   ```bash
   npx tsc --noEmit src/lib/agent-engine.ts 2>&1 | head -20
   ```

**Commit:**
```bash
git add src/lib/agent-engine.ts
git commit -m "feat: add agent engine — 9-step autonomous trading loop"
```

---

### Task 2.2: API Routes — Agent CRUD

**Files:**
- Create: `src/app/api/agent/create/route.ts` (from ARCHITECTURE.md Section 14)
- Create: `src/app/api/agent/[id]/route.ts` (from ARCHITECTURE.md Section 14)
- Create: `src/app/api/agent/[id]/start/route.ts` (from ARCHITECTURE.md Section 14)
- Create: `src/app/api/agent/[id]/stop/route.ts` (from ARCHITECTURE.md Section 14)

**Steps:**

1. Create directory structure:
   ```bash
   mkdir -p src/app/api/agent/create src/app/api/agent/\[id\]/{start,stop,trades,pnl}
   mkdir -p src/app/api/policy/create src/app/api/dashboard/overview src/app/api/cron/agent-loop
   ```

2. Copy each route file from ARCHITECTURE.md Section 14.

3. POST /api/agent/create — Creates agent with strategy text, generates Solana keypair, stores in DB
4. GET /api/agent/[id] — Returns agent details with recent trades and policy
5. POST /api/agent/[id]/start — Sets agent status to RUNNING
6. POST /api/agent/[id]/stop — Sets agent status to STOPPED

**Commit:**
```bash
git add src/app/api/agent/
git commit -m "feat: add agent CRUD API routes — create, read, start, stop"
```

---

### Task 2.3: API Routes — Trades, PnL, Policy, Dashboard

**Files:**
- Create: `src/app/api/agent/[id]/trades/route.ts` (from ARCHITECTURE.md Section 14)
- Create: `src/app/api/agent/[id]/pnl/route.ts` (from ARCHITECTURE.md Section 14)
- Create: `src/app/api/policy/create/route.ts` (from ARCHITECTURE.md Section 14)
- Create: `src/app/api/dashboard/overview/route.ts` (from ARCHITECTURE.md Section 14)

**Steps:**

1. Copy each file from ARCHITECTURE.md Section 14.
2. These routes handle:
   - GET /api/agent/[id]/trades — Paginated trade history
   - GET /api/agent/[id]/pnl — P&L calculation
   - POST /api/policy/create — NL strategy to ActionConfig via Claude
   - GET /api/dashboard/overview — Aggregate stats for all agents

**Commit:**
```bash
git add src/app/api/agent/\[id\]/trades/ src/app/api/agent/\[id\]/pnl/ src/app/api/policy/ src/app/api/dashboard/
git commit -m "feat: add trades, pnl, policy, dashboard API routes"
```

---

### Task 2.4: Cron Agent Loop Route

**Files:**
- Create: `src/app/api/cron/agent-loop/route.ts` (from ARCHITECTURE.md Section 14)

**Steps:**

1. Copy from ARCHITECTURE.md Section 14. This route:
   - Triggered by Vercel cron every 5 minutes (or manually)
   - Queries all RUNNING agents
   - Calls `runAgentLoop()` for each
   - Returns results summary

2. Verify it compiles:
   ```bash
   npx tsc --noEmit src/app/api/cron/agent-loop/route.ts 2>&1 | head -10
   ```

**Commit:**
```bash
git add src/app/api/cron/
git commit -m "feat: add cron agent-loop route — triggers all running agents every 5 min"
```

---

### Task 2.5: Implement Demo Seed Script

**Files:**
- Create: `scripts/seed-demo.ts` (from ARCHITECTURE.md Section 19)

**Steps:**

1. Copy `scripts/seed-demo.ts` from ARCHITECTURE.md Section 19. This creates:
   - 1 demo agent with strategy text
   - 14 price points (enough for RSI)
   - 20 realistic trades over 48 hours
   - 1 BLOCKED event (policy violation)
   - PolicyConfig entries

2. Run the seed:
   ```bash
   npx ts-node scripts/seed-demo.ts
   ```
   Expected: `Seed complete.`

3. Verify data exists:
   ```bash
   npx ts-node -e "
   const { PrismaClient } = require('@prisma/client');
   const db = new PrismaClient();
   Promise.all([
     db.agent.count(),
     db.trade.count(),
     db.pricePoint.count(),
     db.blockEvent.count()
   ]).then(([a,t,p,b]) => console.log('Agents:', a, 'Trades:', t, 'Prices:', p, 'Blocks:', b));
   "
   ```
   Expected: `Agents: 1 Trades: 20 Prices: 14 Blocks: 1`

**Commit:**
```bash
git add scripts/seed-demo.ts
git commit -m "seed(demo): implement seed-demo.ts — 1 agent, 20 trades, 14 prices, 1 block event"
```

---

### Task 2.6: VERIFY-MILESTONE Checkpoint — Core Backend

**Purpose:** Mid-build quality gate. Backend must be functional before building frontend.

**Steps:**

1. Verify all API routes respond:
   ```bash
   # Start dev server
   npx next dev &
   sleep 5

   # Test dashboard overview
   curl -s http://localhost:3000/api/dashboard/overview | head -100

   # Test agent creation
   curl -s -X POST http://localhost:3000/api/agent/create \
     -H "Content-Type: application/json" \
     -d '{"ownerWallet":"test123","strategyText":"Buy SOL when RSI < 30"}' | head -100

   # Kill dev server
   kill %1
   ```

2. Verify agent engine compiles and imports resolve:
   ```bash
   npx tsc --noEmit 2>&1 | head -30
   ```

**Gate (MANDATORY):**
- [ ] `GET /api/dashboard/overview` returns 200 with JSON
- [ ] `POST /api/agent/create` returns 200 with agent object
- [ ] `seed-demo.ts` runs without errors
- [ ] TypeScript compilation has no blocking errors (warnings OK)
- [ ] Database has seeded data

**If gate fails:** STOP. Do not proceed to Phase 3. Fix the failing endpoint first.

---

### Phase 2 Gate

Before proceeding to Phase 3, verify:
- [ ] Agent engine file exists and compiles
- [ ] All 10 API route files exist
- [ ] Seed script creates expected data
- [ ] VERIFY-MILESTONE passed
- [ ] All commits made for Phase 2

---

## Phase 3: Swig Enforcement + Vanish Routing

**Purpose:** Wire up the policy enforcement (Swig) and private execution (Vanish) — the core differentiators.
**Estimated time:** 5 hours

### Task 3.1: Test Swig Policy Creation

**Steps:**

1. Test creating a Swig policy with real SDK:
   ```bash
   npx ts-node -e "
   const { createPolicy } = require('./src/lib/swig');
   const { Keypair } = require('@solana/web3.js');
   const owner = Keypair.generate();
   const rules = [{ type: 'SolLimit', amount: '1000000000' }];
   createPolicy(owner, rules).then(r => console.log('Policy:', r)).catch(e => console.error('Error:', e.message));
   "
   ```

**Decision Point: Swig SDK fails to create policy**

Expected: Policy creation succeeds on devnet

If you get connection errors:
1. Check Solana devnet is up: `curl -s https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | head`
2. If devnet is down: wait and retry
3. If SDK errors: check `node_modules/@swig-wallet/api` exports match our usage

If Swig SDK types don't match ARCHITECTURE.md:
1. Read actual SDK types: `cat node_modules/@swig-wallet/api/dist/index.d.ts | head -50`
2. Adapt `createPolicy()` to match actual exports
3. Tag adaptation as [UNVERIFIED] in code
4. Continue — policy creation is testable after adaptation

**Commit:**
```bash
git commit -m "test: verify Swig policy creation on devnet"
```

---

### Task 3.2: Test Vanish Trade Flow

**Steps:**

1. If real API key available:
   ```bash
   npx ts-node -e "
   const { createVanishClient } = require('./src/lib/vanish');
   const client = createVanishClient();
   console.log('Client type:', client.constructor.name);
   // Test deposit (will need actual SOL on devnet)
   "
   ```

2. If mock mode:
   ```bash
   npx ts-node -e "
   const { createVanishClient } = require('./src/lib/vanish');
   const client = createVanishClient(); // Should create MockVanishClient
   const { Keypair } = require('@solana/web3.js');
   const kp = Keypair.generate();
   client.deposit(kp, 100000).then(r => console.log('Mock deposit:', r)).catch(e => console.error(e));
   "
   ```
   Expected: Mock returns success.

**Decision Point: Vanish API key arrives**

If `VANISH_API_KEY` becomes available:
1. Update `.env` with real key
2. Re-test with small deposit
3. If real API works: update `VANISH_MOCK` to `false` in `.env`
4. If real API fails: keep mock, continue

Day 6 cutoff: If no real Vanish key by Day 6, lock to mock mode for the rest of the build. Demo will show "privacy routing" via mock with a note about pending API access.

Day 8 (Plan C): If mock is causing issues, skip Vanish entirely. Direct Jupiter swaps. Remove privacy score panel from dashboard. This is the nuclear option.

**Commit:**
```bash
git commit -m "test: verify Vanish trade flow (mock or real)"
```

---

### Task 3.3: End-to-End Agent Loop Test

**Steps:**

1. Run a single agent loop iteration:
   ```bash
   npx ts-node -e "
   const { runAgentLoop } = require('./src/lib/agent-engine');
   const { PrismaClient } = require('@prisma/client');
   const db = new PrismaClient();
   db.agent.findFirst({ where: { status: 'RUNNING' } }).then(agent => {
     if (!agent) { console.log('No running agent. Run seed first.'); return; }
     return runAgentLoop(agent.id);
   }).then(r => console.log('Result:', JSON.stringify(r, null, 2))).catch(e => console.error(e));
   "
   ```

2. Check DB for new trade or hold decision:
   ```bash
   npx ts-node -e "
   const { PrismaClient } = require('@prisma/client');
   const db = new PrismaClient();
   db.trade.findMany({ orderBy: { timestamp: 'desc' }, take: 3 }).then(t => t.forEach(x => console.log(x.action, x.token, x.status)));
   "
   ```

**Decision Point: Agent loop crashes mid-execution**

If Claude returns malformed response:
1. Check `getTradeDecision` fallback is working (should return hold)
2. If persistent: verify `ANTHROPIC_API_KEY` and model name
3. Fallback: hardcode a test decision for integration testing

If Swig pre-check throws:
1. This is expected for policy violations — should create BlockEvent
2. If it throws for valid trades: check `preCheckTrade()` logic
3. Ensure error handling catches Swig errors gracefully

If Vanish commit fails:
1. Mock should always succeed
2. Real API: check network, retry once
3. The `/commit` is ALWAYS called — even on failure, log the attempt

**Commit:**
```bash
git commit -m "test: verify end-to-end agent loop — prices → RSI → Claude → Swig → Jupiter → Vanish"
```

---

### Phase 3 Gate

Before proceeding to Phase 4, verify:
- [ ] Agent engine runs one full loop without crash
- [ ] Claude returns valid trade decisions
- [ ] Swig pre-check works (blocks over-limit trades)
- [ ] Vanish client (mock or real) completes deposit → trade → commit cycle
- [ ] New trades appear in database after loop run
- [ ] All commits made for Phase 3

---

## Phase 4: Frontend Dashboard

**Purpose:** Build the core UI — landing page, dashboard, and agent detail view.
**Estimated time:** 6 hours

### Task 4.1: App Layout + Providers

**Files:**
- Create: `src/providers/PhantomProvider.tsx` (from ARCHITECTURE.md Section 15)
- Create: `src/app/layout.tsx` (from ARCHITECTURE.md Section 16)
- Create: `src/app/globals.css` (from ARCHITECTURE.md Section 16)

**Steps:**

1. Copy `PhantomProvider.tsx` from ARCHITECTURE.md Section 15.
2. Copy `layout.tsx` from ARCHITECTURE.md Section 16.
3. Copy `globals.css` from ARCHITECTURE.md Section 16.

4. Verify the app renders:
   ```bash
   npx next dev &
   sleep 5
   curl -s http://localhost:3000 | head -20
   kill %1
   ```
   Expected: HTML response (not an error page).

**Commit:**
```bash
git add src/providers/ src/app/layout.tsx src/app/globals.css
git commit -m "feat: add app layout with Phantom provider + dark theme globals"
```

---

### Task 4.2: Landing Page

**Files:**
- Create: `src/app/page.tsx` (from ARCHITECTURE.md Section 16)

**Steps:**

1. Copy `src/app/page.tsx` from ARCHITECTURE.md Section 16. This is the first thing judges see:
   - Hero section with tagline
   - "AI judgment + onchain enforcement" thesis
   - Stats (if agents exist) or demo prompt
   - CTA to connect wallet / deploy agent

**Commit:**
```bash
git add src/app/page.tsx
git commit -m "feat: add landing page — hero, thesis, stats, CTA"
```

---

### Task 4.3: Layout Components

**Files:**
- Create: `src/components/layout/Header.tsx` (from ARCHITECTURE.md Section 17)
- Create: `src/components/shared/WalletButton.tsx` (from ARCHITECTURE.md Section 17)
- Create: `src/components/shared/StatusBadge.tsx` (from ARCHITECTURE.md Section 17)

**Steps:**

1. Copy all three files from ARCHITECTURE.md Section 17.
2. Header includes navigation (Dashboard, Deploy, Proof) and WalletButton.
3. WalletButton uses Phantom SDK for connect/disconnect.
4. StatusBadge renders agent status with color coding.

**Commit:**
```bash
git add src/components/layout/ src/components/shared/
git commit -m "feat: add Header, WalletButton, StatusBadge components"
```

---

### Task 4.4: Dashboard Page + Components

**Files:**
- Create: `src/app/dashboard/page.tsx` (from ARCHITECTURE.md Section 16)
- Create: `src/components/dashboard/AgentCard.tsx` (from ARCHITECTURE.md Section 17)
- Create: `src/components/dashboard/TradeFeed.tsx` (from ARCHITECTURE.md Section 17)
- Create: `src/components/dashboard/PolicyPanel.tsx` (from ARCHITECTURE.md Section 17)
- Create: `src/components/dashboard/PnLChart.tsx` (from ARCHITECTURE.md Section 17)
- Create: `src/components/dashboard/PrivacyScore.tsx` (from ARCHITECTURE.md Section 17)
- Create: `src/components/dashboard/BlockEventLog.tsx` (from ARCHITECTURE.md Section 17)

**Steps:**

1. Copy dashboard page from ARCHITECTURE.md Section 16.
2. Copy all 6 dashboard components from ARCHITECTURE.md Section 17.
3. The dashboard fetches from `/api/dashboard/overview` and renders:
   - Agent cards with status
   - Live trade feed
   - Policy rules display
   - P&L chart (visual representation)
   - Privacy score meter
   - Block event log (policy violations)

4. Verify the page loads with seeded data:
   ```bash
   npx next dev &
   sleep 5
   curl -s http://localhost:3000/dashboard | grep -c "agent"
   kill %1
   ```

**Commit:**
```bash
git add src/app/dashboard/ src/components/dashboard/
git commit -m "feat: add dashboard page — agent cards, trade feed, policy panel, P&L, privacy, block log"
```

---

### Task 4.5: Agent Detail Page

**Files:**
- Create: `src/app/agent/[id]/page.tsx` (from ARCHITECTURE.md Section 16)

**Steps:**

1. Copy from ARCHITECTURE.md Section 16.
2. This page shows:
   - Agent status and strategy
   - Full trade history
   - P&L metrics
   - Start/Stop controls
   - Block event history

**Commit:**
```bash
git add src/app/agent/
git commit -m "feat: add agent detail page — trades, P&L, controls, block events"
```

---

### Phase 4 Gate

Before proceeding to Phase 5, verify:
- [ ] Landing page renders at `/`
- [ ] Dashboard renders at `/dashboard` with seeded agent data
- [ ] Agent detail page renders at `/agent/{id}`
- [ ] Navigation between pages works
- [ ] WalletButton shows connect state
- [ ] All commits made for Phase 4

---

## Phase 5: Deploy Wizard + Phantom Connect

**Purpose:** Build the agent deployment flow — NL strategy input, policy review, onchain signing.
**Estimated time:** 5 hours

### Task 5.1: Deploy Page + Components

**Files:**
- Create: `src/app/deploy/page.tsx` (from ARCHITECTURE.md Section 16)
- Create: `src/components/deploy/StrategyInput.tsx` (from ARCHITECTURE.md Section 18)
- Create: `src/components/deploy/PolicyReview.tsx` (from ARCHITECTURE.md Section 18)
- Create: `src/components/deploy/DeployConfirm.tsx` (from ARCHITECTURE.md Section 18)

**Steps:**

1. Copy deploy page from ARCHITECTURE.md Section 16.
2. Copy all 3 deploy components from ARCHITECTURE.md Section 18.
3. The deploy flow:
   - Step 1: User types natural language strategy (StrategyInput)
   - Step 2: Claude converts to ActionConfig array, user reviews (PolicyReview)
   - Step 3: User signs Swig policy deployment tx via Phantom (DeployConfirm)

4. Test the full flow:
   ```bash
   npx next dev &
   sleep 5
   # Navigate to /deploy in browser
   # Type a strategy: "Buy SOL when RSI < 30, max 1 SOL per trade, max 5 SOL per day"
   # Click "Generate Policy"
   # Review the generated ActionConfig rules
   # Click "Deploy Agent" (requires Phantom wallet)
   kill %1
   ```

**Decision Point: Phantom Connect doesn't work in dev**

Expected: Phantom extension connects and signs transactions

If Phantom extension not detected:
1. Install Phantom browser extension from phantom.app
2. Switch to Solana devnet in Phantom settings
3. Get devnet SOL: `solana airdrop 2 {your-wallet-address} --url devnet`

If Phantom rejects the signing request:
1. Check the transaction is well-formed
2. Verify the Swig policy deployment builds a valid Solana transaction
3. If Swig SDK generates the tx incorrectly: log the tx bytes, debug
4. Fallback for demo: pre-deploy the policy and show it as "already configured"

**Commit:**
```bash
git add src/app/deploy/ src/components/deploy/
git commit -m "feat: add deploy wizard — NL strategy input → policy review → Phantom signing"
```

---

### Task 5.2: Proof Page

**Files:**
- Create: `src/app/proof/page.tsx` (from ARCHITECTURE.md Section 16)

**Steps:**

1. Copy from ARCHITECTURE.md Section 16. This page shows judges:
   - Deployed agent contract/wallet addresses
   - Transaction hashes with Solana Explorer links
   - Integration verification results
   - Trade count and volume stats

**Commit:**
```bash
git add src/app/proof/
git commit -m "feat: add proof page — integration artifacts for judges"
```

---

### Task 5.3: Agent Metadata + Public Assets

**Files:**
- Create: `public/agent-metadata.json` (from ARCHITECTURE.md Section 20)

**Steps:**

1. Copy agent-metadata.json from ARCHITECTURE.md Section 20.
2. This JSON file defines the Metaplex 014 agent metadata structure.

**Commit:**
```bash
git add public/
git commit -m "feat: add agent metadata JSON for Metaplex 014 registry"
```

---

### Phase 5 Gate

Before proceeding to Phase 6, verify:
- [ ] Deploy page renders at `/deploy`
- [ ] Strategy input shows and accepts text
- [ ] Policy creation API (`POST /api/policy/create`) returns ActionConfig array
- [ ] Proof page renders at `/proof`
- [ ] All pages accessible via Header navigation
- [ ] All commits made for Phase 5

---

## Phase 6: Seed Data + Proof Generation

**Purpose:** Generate realistic demo data and integration proof artifacts.
**Estimated time:** 3 hours

### Task 6.1: Generate Proof Script

**Files:**
- Create: `scripts/generate-proof.ts` (from ARCHITECTURE.md Section 19)

**Steps:**

1. Copy `scripts/generate-proof.ts` from ARCHITECTURE.md Section 19.
2. This script:
   - Reads agent data from DB
   - Queries Solana Explorer for tx hashes
   - Generates `submission/proof.md` with all addresses and links
   - Captures integration verification results

3. Run the script:
   ```bash
   npx ts-node scripts/generate-proof.ts
   ```

4. Verify output:
   ```bash
   cat submission/proof.md | head -30
   ```

**Commit:**
```bash
git add scripts/generate-proof.ts
git commit -m "feat: add proof generation script — tx hashes, addresses, integration verification"
```

---

### Task 6.2: Final Seed Run + Verification

**Steps:**

1. Reset and re-seed for clean demo state:
   ```bash
   npx prisma db push --force-reset
   npx ts-node scripts/seed-demo.ts
   ```

2. Start the app and verify all pages show data:
   ```bash
   npx next dev &
   sleep 5
   # Dashboard: should show 1 agent, 20 trades, P&L data
   curl -s http://localhost:3000/api/dashboard/overview | python3 -m json.tool | head -20
   kill %1
   ```

**Commit:**
```bash
git commit -m "chore: verify seed data and dashboard rendering"
```

---

### Phase 6 Gate

Before proceeding to Phase 7, verify:
- [ ] `seed-demo.ts` runs clean after DB reset
- [ ] Dashboard shows realistic data (20 trades, P&L, privacy score)
- [ ] Block event log shows at least 1 policy violation
- [ ] Proof page displays addresses and tx links
- [ ] All commits made for Phase 6

---

## Phase 7: Integration Testing + Bug Fixes

**Purpose:** Test all integrations end-to-end. Fix bugs. Ensure demo flow works.
**Estimated time:** 4 hours

### Task 7.1: Full Demo Flow Test

**Steps:**

1. Start the app:
   ```bash
   npx next dev
   ```

2. Walk through the complete demo flow manually:
   - [ ] Landing page loads with hero section
   - [ ] "Connect Wallet" button appears
   - [ ] Navigate to /deploy
   - [ ] Type strategy: "Buy SOL when RSI drops below 30, sell when above 70. Max 1 SOL per trade, 5 SOL daily limit."
   - [ ] Click "Generate Policy" — see ActionConfig rules
   - [ ] Click "Deploy Agent" — agent created
   - [ ] Navigate to /dashboard — see the new agent
   - [ ] Agent card shows strategy and status
   - [ ] Navigate to /agent/{id} — see trade history
   - [ ] Trigger agent loop: `curl -X GET http://localhost:3000/api/cron/agent-loop`
   - [ ] Trade appears in feed
   - [ ] Navigate to /proof — see integration artifacts

3. Record any failures in a bug list.

### Task 7.2: Fix Bugs from Demo Flow

**Steps:**

1. For each bug found in Task 7.1:
   - Identify the root cause
   - Fix in the relevant file
   - Re-test the specific flow
   - Commit with descriptive message

### Task 7.3: Test Swig Policy Block Demo Moment

**Steps:**

1. This is THE demo differentiator. The agent must visibly get BLOCKED by its policy:
   ```bash
   # Create an agent with very restrictive policy (0.1 SOL limit)
   # Trigger agent loop
   # Verify BlockEvent is created
   # Verify dashboard shows the block in BlockEventLog
   ```

2. If the block doesn't trigger:
   - Check `preCheckTrade()` logic
   - Ensure the test trade exceeds the policy limit
   - Verify BlockEvent is saved to DB and fetched by dashboard

**Decision Point: Swig policy violation not visible**

Expected: BlockEvent in DB, visible in BlockEventLog component

If pre-check doesn't throw on over-limit trade:
1. Check the policy amount vs trade amount comparison
2. Ensure amounts are in the same unit (lamports vs SOL)
3. If Swig SDK error codes are unclear: catch any error and create BlockEvent from it

If BlockEventLog doesn't render:
1. Check `/api/dashboard/overview` returns blockEvents array
2. Check the BlockEventLog component mapping

---

### Phase 7 Gate

Before proceeding to Phase 8, verify:
- [ ] Full demo flow works end-to-end without manual intervention
- [ ] Agent creates from NL strategy
- [ ] Agent loop executes and creates trades
- [ ] Policy violation is visible (BLOCKED event in log)
- [ ] All pages render with real data
- [ ] No unhandled errors in browser console
- [ ] All bug fixes committed

---

## Phase 8: Polish + Feature Freeze

**Purpose:** UI polish, performance, accessibility. Feature freeze after this phase.
**Estimated time:** 4 hours

### Task 8.1: UI Polish

**Steps:**

1. Review each page for:
   - Responsive design (mobile + desktop)
   - Loading states (skeleton or spinner)
   - Error states (network failures)
   - Empty states (no data)
   - Color consistency (dark theme)
   - Typography hierarchy

2. Fix any visual issues found.

### Task 8.2: Metaplex Agent Registration

**Steps:**

1. If Metaplex 014 SDK works:
   ```bash
   npx ts-node -e "
   const { registerAgent } = require('./src/lib/metaplex');
   const { Keypair } = require('@solana/web3.js');
   const owner = Keypair.generate();
   registerAgent(owner, 'x9-demo-agent', 'Autonomous trading agent', 'https://x9protocol.com/agent-metadata.json')
     .then(r => console.log('Registered:', r))
     .catch(e => console.error('Error:', e.message));
   "
   ```

2. If SDK fails: use fallback (hardcoded mock NFT address from prior run or skip).

**Decision Point: Metaplex 014 SDK not working**

Expected: Agent registered, NFT address returned

If SDK throws:
1. Check `@metaplex-foundation/mpl-agent-registry` version
2. Try updating: `npm install @metaplex-foundation/mpl-agent-registry@latest`
3. If still failing: hardcode a mock address, note in README
4. This is not blocking — agent loop works without registration

### Task 8.3: Feature Freeze

**Steps:**

1. Tag the current state:
   ```bash
   git tag feature-freeze-v1
   ```

2. After this point: ONLY bug fixes and polish. No new features.

**Commit:**
```bash
git add -A
git commit -m "chore: feature freeze — all core features complete, polish only from here"
```

---

### Phase 8 Gate

Before proceeding to Phase 9, verify:
- [ ] All pages responsive on mobile viewport (375px)
- [ ] Loading states present on dashboard and agent pages
- [ ] No 500 errors from any API route
- [ ] Feature freeze tag created
- [ ] All commits made for Phase 8

---

## Phase 9: Demo Recording + Submission Prep

**Purpose:** Record demo video, prepare submission materials.
**Estimated time:** 4 hours

### Task 9.1: Pre-Demo Setup

**Steps:**

1. Reset to clean demo state:
   ```bash
   npx prisma db push --force-reset
   npx ts-node scripts/seed-demo.ts
   ```

2. Verify all data is present and app looks good.

3. Start the app:
   ```bash
   npx next dev
   ```

### Task 9.2: Generate Proof Artifacts

**Steps:**

1. Run proof generation:
   ```bash
   npx ts-node scripts/generate-proof.ts
   ```

2. Create submission directory:
   ```bash
   mkdir -p submission/{screenshots,video}
   ```

3. Take screenshots of each page for submission.

### Task 9.3: Demo Recording

**Steps:**

1. Follow the Demo Script from PRD Section 6:
   - **Scene 1 (30s):** Knight Capital hook + problem statement
   - **Scene 2 (30s):** x9 protocol solution — deploy agent from NL
   - **Scene 3 (30s):** Agent makes autonomous trade decision
   - **Scene 4 (30s):** Policy violation — BLOCKED event visible
   - **Scene 5 (20s):** Privacy score + Vanish integration
   - **Scene 6 (20s):** Proof page — tx hashes, explorer links

2. Total target: ~3 minutes

### Task 9.4: Submission Package

**Steps:**

1. Create `submission/links.md`:
   ```markdown
   # x9 protocol — Submission Links

   - Live URL: {deployment URL}
   - GitHub: {repo URL}
   - Demo Video: {YouTube/Loom URL}
   - Proof: {live-url}/proof
   ```

2. Create `submission/sponsor-tracks.md` mapping integrations to sponsors:
   - Swig: Smart wallet policy engine
   - Vanish: Private trade execution
   - Metaplex: Agent identity registry (014)
   - Phantom: Wallet connection + tx signing

**Commit:**
```bash
git add submission/
git commit -m "docs: add submission package — links, proof, sponsor tracks"
```

---

### Phase 9 Gate (Final)

- [ ] Demo video recorded and uploaded
- [ ] All submission materials in `submission/` directory
- [ ] Proof page live at `/proof` with real data
- [ ] All sponsor integrations documented
- [ ] Repository clean and ready for submission

---

## Appendix: Quick Reference

### All Addresses
| Item | Address | Network |
|------|---------|---------|
| SOL Mint | So11111111111111111111111111111111111111112 | Devnet |
| USDC Mint | 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU | Devnet |
| Jupiter API | https://quote-api.jup.ag/v6 | Mainnet (works for devnet quotes) |
| Vanish Dev API | https://core-api-dev.vanish.trade | Devnet |
| Phantom App ID | 6673da67-257d-4538-b82c-d3e69928c46e | — |

### All Commands
| Phase | Task | Command | Purpose |
|:---:|:---:|---------|---------|
| 0 | 0.1 | `npm install` | Install all dependencies |
| 0 | 0.2 | `npx prisma generate && npx prisma db push` | Set up database |
| 1 | 1.1 | `npx ts-node -e "require('./src/lib/coingecko').fetchPrices().then(console.log)"` | Test price fetch |
| 1 | 1.3 | `npx ts-node -e "require('./src/lib/claude').getTradeDecision(...).then(console.log)"` | Test Claude |
| 2 | 2.5 | `npx ts-node scripts/seed-demo.ts` | Seed demo data |
| 2 | 2.6 | `curl http://localhost:3000/api/dashboard/overview` | Test dashboard API |
| 3 | 3.3 | `npx ts-node -e "require('./src/lib/agent-engine').runAgentLoop(agentId)"` | Test agent loop |
| 6 | 6.1 | `npx ts-node scripts/generate-proof.ts` | Generate proof artifacts |

### Troubleshooting
| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `Cannot find module '@swig-wallet/api'` | Package not installed | `npm install @swig-wallet/api@1.3.0` |
| `Cannot find module '@phantom/react-sdk'` | Package not installed | `npm install @phantom/react-sdk@2.0.2` |
| `ANTHROPIC_API_KEY not set` | Missing env var | Add to `.env` |
| `429 Too Many Requests` from CoinGecko | Rate limited | Wait 60s, cache handles it |
| `Prisma: table does not exist` | DB not initialized | `npx prisma db push` |
| Phantom not connecting | Extension not installed or wrong network | Install Phantom, switch to devnet |
| Agent loop returns "hold" every time | Not enough price history | Run `seed-demo.ts` for 14+ prices |
| Vanish returns 401 | Invalid API key | Switch to mock mode: set `VANISH_API_KEY=mock` in `.env` |
| Jupiter quote returns empty | Invalid mint address | Verify SOL/USDC devnet addresses |
| TypeScript compilation errors | Missing types | Run `npx prisma generate` first |
