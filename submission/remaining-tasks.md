# x9 protocol — Remaining Tasks (as of 2026-05-08)

## Blocked on User Action

### Claude API Credits
- Go to platform.claude.com → Billing → add credits ($5 minimum)
- Then copy the key `sk-ant-api03-eZb...FgAA` from Settings → API Keys → paste here
- This unlocks: agent loop making real BUY/SELL decisions instead of holding
- Without this: loop runs but always returns "hold" (Claude unavailable fallback)

### ~~Ika Integration~~ — DONE
- Rewrote ika.ts to use correct CPI approach (removed fake REST API)
- Program ID: 87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY
- approve_message instruction (discriminator 8) + gRPC Sign at pre-alpha-dev-1.ika.ika-network.net:443
- Ika re-added to proof page as SEEDED (11 integrations total)
- isIkaConfigured() now returns true whenever SOLANA_RPC_URL is set

---

## Ready to Execute (unblocked)

### Deploy to Vercel (Tier 5)
- Push all changes: seed fix, INP fix (Phantom deferred load), env updates
- Update Vercel env vars: GOLDRUSH_API_KEY, DUNE_API_KEY (+ ANTHROPIC_API_KEY once available)
- Verify live site at https://x9-protocol.vercel.app still works after deploy

### Trigger Live Agent Loop (Tier 4)
- Requires: Claude API credits first
- Run: POST /api/cron/agent-loop with Bearer x9-cron-secret-dev
- Verify: Trade record created with real Claude reasoning (not "Claude API unavailable")
- Verify: CoinGecko prices fetched (already LIVE)
- Verify: Vanish createDepositAddress called (already LIVE — key is set)

---

## Submission (Tier 1 — last)

### Videos (deadline: May 11, 2026)
1. Pitch video (3 min): problem → solution → why Solana → traction
2. Tech demo video (2-3 min): deploy agent → watch loop → see block event → proof page

### Submission Targets
1. Main: arena.colosseum.org (Solana Frontier)
2. Side track: superteam.fun/earn/hackathon/frontier → "Encrypt & Ika" track ($15K USDC)
   - Adjust submission to emphasize MPC signing angle even if pre-alpha

### Submission Checklist
- [ ] Demo video URL filled in submission/links.md
- [ ] GitHub repo pushed and public (github.com/dmustapha/x9-protocol)
- [ ] Live URL confirmed working: https://x9-protocol.vercel.app
- [ ] Proof page live: https://x9-protocol.vercel.app/proof
- [ ] Submit on arena.colosseum.org
- [ ] Submit on Superteam Earn (Encrypt & Ika side track)

---

## Completed
- [x] Devnet wallet funded (Conservative RSI Trader: 0.5 SOL)
- [x] Seed script fixed (DuneCache deletion order)
- [x] GoldRush API key wired
- [x] Dune API key wired (DB-derived fallback active)
- [x] INP performance fix (Phantom SDK deferred via next/dynamic)
- [x] Vanish confirmed LIVE (API key was already set)
- [x] Ika removed from proof page (not a REST API, pre-alpha CPI-based)
- [x] Proof page count corrected: 11 → 10 integrations
- [x] Public URL corrected in agent-metadata.json (missing hyphen)
- [x] submission/links.md updated with live URLs
- [x] Ika rewritten: CPI-based approve_message + gRPC Sign (Program ID 87W54kG…; curve Ristretto255)
- [x] Ika re-added to proof page as SEEDED (11 integrations)
