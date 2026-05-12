# x9 Protocol — Demo Flow (New User Test Script)

Use this file as your script when recording the demo video. Verified against production: https://x9-protocol.vercel.app

---

## Pre-flight checklist (before recording)

- [ ] Phantom browser extension installed and logged in (devnet)
- [ ] Browser at `https://x9-protocol.vercel.app` — landing page visible
- [ ] Window at 1280x800 or fullscreen
- [ ] Agent cron daemon running: `launchctl list | grep agentcron` (fires every 5 min)
- [ ] At least one agent already Active with trades in DB for demo richness

---

## Step 1 — Landing page

1. Open `https://x9-protocol.vercel.app`
2. Scroll to show the headline, feature bullets, and the "Launch App" CTA
3. Click **Launch App** → redirects to `/dashboard`

**What you'll see:** Full landing page with "Autonomous AI trading agents on Solana" hero text.

---

## Step 2 — Dashboard

1. You land on `/dashboard`
2. If Phantom is not connected: the page shows a "Connect Phantom" prompt in the portfolio card area
3. Click the **Phantom connect button** (top-right of the app)
4. Approve the connection in the Phantom popup
5. Dashboard now shows your GoldRush live portfolio card (SOL balance, USDC, shielded SOL)
   - If the wallet has mainnet history: badge shows **GoldRush · LIVE** in green
   - If the wallet is fresh/unfunded: badge shows **Mock** in yellow — this is expected for new wallets

**What you'll see:** Live portfolio with wallet balances and agent count.

---

## Step 3 — Deploy a new agent

1. Click **Deploy Agent** in the nav (or go to `/deploy`)
2. **Step 1 — Strategy:** Type a trading strategy in plain English, for example:
   ```
   Conservative SOL trader. Max $5 per trade, $20 per day. Only trade SOL.
   ```
3. Click **Next** — the button shows "Converting strategy..." while Claude Sonnet translates it
4. **Step 2 — Claude's Understanding:** Review what Claude understood. You'll see:
   - Plain-English interpretation (2-3 sentences)
   - List of tradeable tokens (SOL, and any others mentioned)
5. Click **Next**
6. **Step 3 — Policy Review:** See the Swig ActionConfig rules:
   - SolLimit (max per trade)
   - SolRecurringLimit (daily cap)
   - Program whitelists (Token Program + Jupiter)
7. Click **Next**
8. **Step 4 — Deploy:** Enter agent name (e.g. `Alpha`), review everything, click **Deploy Agent**
   - Button shows "Deploying..." while 4 things happen in parallel: Swig wallet created, Metaplex NFT minted, SNS .sol domain registered, DB record created
9. On success: redirected to `/agents` directory

**Key point:** The policy rules reviewed in Step 3 are the EXACT rules stored — no double-generation.

---

## Step 4 — Agents directory

1. You see your new agent card with name, `.sol` domain, and **Stopped** status badge
2. Click the agent card → goes to `/agent/[id]`

---

## Step 5 — Agent detail page

1. Top section: agent name, status badge (Stopped), **Start Agent** button
2. Info cards: Swig wallet address, Metaplex NFT link, SNS domain (e.g. `alpha.sol`)
3. Agent Wallet card: SOL, USDC, Total Value, Shielded SOL (GoldRush live or Mock)
4. Click **Start Agent**
   - Phantom popup appears asking for wallet signature (ownership proof)
   - Approve it
   - Status badge flips to **Active** (green)
5. Scroll down: PnL chart (empty for new agent), Trade Feed (empty), Policy Panel showing rules, Dune Analytics panel

**What you'll see:** The start/stop button correctly passes your wallet address — no 403 errors.

---

## Step 6 — Trigger the agent loop (manual)

The cron runs automatically every 5 minutes via launchd daemon (Vercel cron removed — Hobby plan only allows daily crons). To trigger manually:

```bash
curl -X POST https://x9-protocol.vercel.app/api/cron/agent-loop \
  -H "Authorization: Bearer 762a0ace93f35758c78b6929e011dad688e557f2bf98a7aed8c80be87f2f0f22"
```

Expected response: `{"processed": N, "results": [...]}`

Each active agent will:
1. Fetch live USD prices for 30+ tokens via Jupiter Price API v2
2. Compute 14-period RSI per token
3. Ask Claude Haiku for a buy/sell/hold decision
4. Run Swig policy pre-check (SOL lamports for SOL rules, token base units for SPL rules)
5. If approved: get Jupiter quote, route via Vanish, record trade
6. If policy blocks: record a block event

**For a brand new agent:** Claude will likely return **hold** — the agent wallet has no SOL, triggering the balance guard. To see a real trade:
- Send a small amount of SOL to the agent's public key (shown on the detail page)
- Re-trigger the cron

---

## Step 7 — View a trade

After the cron runs:
1. Refresh `/agent/[id]`
2. Trade Feed shows each decision: action, token, dollar amount, reason, privacy score
3. PnL chart updates with cumulative value over time
4. Policy Panel shows any block events

---

## Step 8 — Proof page

1. Go to `/proof`
2. Shows evidence of every integration: Swig, Vanish, Metaplex, SNS, Jupiter, GoldRush, Dune, Ika
3. Each card links to real on-chain data or live API responses

---

## Known behaviors (not bugs)

| Behavior | Reason |
|----------|--------|
| Agent wallet shows "Mock" badge | GoldRush returns mock for unfunded wallets — send SOL to agent key to see live data |
| PnL chart empty on new agent | No trades yet — trigger cron or wait 5 minutes |
| Dune panel shows "Query failed" | Dune free tier has cold-start delays — data appears after ~60s or on cache hit |
| RSI shows "insufficient data" | Needs 15+ price samples (15 cron cycles = 75 minutes) to compute RSI |
| SNS domain shows derived name | SNS registration is async — `.sol` domain confirmed after a few blocks |

---

## Quick URLs

| Page | URL |
|------|-----|
| Landing | https://x9-protocol.vercel.app |
| Dashboard | https://x9-protocol.vercel.app/dashboard |
| Deploy | https://x9-protocol.vercel.app/deploy |
| Agents | https://x9-protocol.vercel.app/agents |
| Proof | https://x9-protocol.vercel.app/proof |

---

## Cron manual trigger

```bash
curl -X POST https://x9-protocol.vercel.app/api/cron/agent-loop \
  -H "Authorization: Bearer 762a0ace93f35758c78b6929e011dad688e557f2bf98a7aed8c80be87f2f0f22"
```
