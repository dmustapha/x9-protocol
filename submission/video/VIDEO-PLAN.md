# x9 protocol — Video Production Plan

## DETECTED CONFIG

```
PROJECT:   x9 protocol
TYPE:      DeFi/Infra + AI Agents (hybrid)
THEME:     Custom x9 — bg: #09090b, accent: #00ff88, text: #f8fafc, JetBrains Mono
STRATEGY:  C — TransitionSeries + per-scene Gemini TTS (Charon voice)
CROSSFADE: 24 frames (0.8s)
SOCIAL:    10s vertical clip extracted from Hook scene
SUBMIT TO: 3 portals — Colosseum Arena, Superteam Earn (Encrypt+Ika $15K), Vanish ($10K bounty)
```

## TWO-VIDEO ARCHITECTURE

| | Video 1: Pitch | Video 2: Tech Demo |
|---|---|---|
| Purpose | WHY — startup pitch | HOW — implementation proof |
| Length | 3 min max | 2:30 target |
| Audience | Investor judges | Technical judges + sponsor judges |
| Format | Animated slides + TTS voiceover | Screen recordings + narration |
| Tool | Remotion (animated pitch deck) | Remotion (screen recordings + callouts) |
| Voice | Gemini Charon TTS | Gemini Charon TTS |

---

## VIDEO 1: PITCH VIDEO

### Scene Lineup (8 scenes, 3:00 total)

```
Hook (20s) → Problem (30s) → Solution (35s) → Stack (25s)
Market (20s) → GTM (15s) → Revenue (15s) → Close (20s)
```

### Scene Storyboards

**SCENE 1 — Hook (20s)**
Dark background. Counter counts up to 24. "hours a day markets run." Below: "You run about 6." Pause. "x9 protocol." Shield logo pulses in. AnimatedBackground green orbs.

**SCENE 2 — Problem (30s)**
Side-by-side contrast. Left column (red): "Strategy locked to a template", "Risk controls stored in a database", "Nothing about it is verifiable." Right column empty — the emptiness IS the contrast. No solution yet.

**SCENE 3 — Solution (35s)**
Four GlassCards stagger in. Card 1: "Write in plain English." Card 2: "Claude converts to on-chain policy." Card 3: "Agent trades within those rules." Card 4: "You never touch it again." Each with green checkmark. Right side: deploy wizard screenshot fades in.

**SCENE 4 — Stack (25s)**
Four sponsor cards in 2x2 grid:
- Swig (green): "Cryptographic policy enforcement"
- Vanish (cyan): "$10K bounty winner. Every trade routed privately."
- Claude (purple): "AI decision engine. Haiku + Sonnet."
- Metaplex (blue): "On-chain agent identity as Core NFT"
Each card pulses on entry.

**SCENE 5 — Market (20s)**
Three animated stat counters. "7M" — monthly active Solana wallets. "500K" — serious DeFi traders. "$100B" — daily Solana trading volume.

**SCENE 6 — GTM (15s)**
Two-column. Left: three channels ("Solana Twitter / build-in-public", "Phantom ecosystem", "Metaplex agent registry"). Right: "The product generates shareable output by default."

**SCENE 7 — Revenue (15s)**
Single GlassCard. "$15–30/agent/month → 1,000 agents = $180K–$360K ARR." Below: "Take-rate on volume scales with ecosystem."

**SCENE 8 — Close (20s)**
Pattern H. Logo center. "x9 protocol" gradient text. Tagline. "x9-protocol.vercel.app" in accent green. Corner brackets. Slow fade to black.

---

### PITCH VIDEO — Full Script

**[HOOK — 20s]** (~43 words)
Crypto markets run all day, every day, without pause. Most traders do not. The ones who try to keep up make emotional decisions under pressure, miss windows while they sleep, and blow limits they set for themselves. That is a tooling problem, not a discipline problem.

**[PROBLEM — 30s]** (~65 words)
Existing trading bots hand you a menu of rigid strategies. You pick a template, not express your own rules. And when something goes wrong, you have no way to know whether the bot followed your intent or acted on its own logic. The enforcement is advisory. The risk controls live in a database. Nothing about them is verifiable on-chain.

**[SOLUTION — 35s]** (~76 words)
x9 protocol lets you deploy an autonomous AI agent on Solana in under two minutes. You describe your strategy in plain English — conservative SOL trader, five dollars max per trade, twenty dollars per day — and Claude Sonnet converts that into a cryptographic policy enforced on-chain by Swig before any transaction executes. Claude Haiku then monitors live RSI signals for thirty-plus tokens every five minutes and makes buy, sell, or hold decisions within those exact constraints. You never touch it again.

**[STACK — 25s]** (~54 words)
Every component has a specific job. Swig's on-chain policy engine means the agent cannot exceed your limits even if it wants to. Vanish routes every trade through a fresh ephemeral wallet with Jito MEV protection, breaking the link between your identity and the trade. Metaplex mints each agent as a Core NFT. SNS assigns it a dot-sol domain.

**[MARKET — 20s]** (~43 words)
Seven million monthly active Solana wallets. Roughly half a million are serious DeFi traders who interact with the chain every week. They already have wallets. They already understand the tooling. Beyond retail, small crypto funds without engineering teams are the adjacent market. Both are already on Solana.

**[GTM — 15s]** (~33 words)
The first users come from Solana Twitter. The product generates shareable output by default — P&L curves, block events, Claude's reasoning on every trade. That is exactly the content this community engages with. Phantom and Metaplex give us ecosystem distribution from day one.

**[REVENUE — 15s]** (~33 words)
Per-agent subscription, fifteen to thirty dollars per month. One thousand active agents is between one hundred eighty and three hundred sixty thousand dollars in annual recurring revenue. Long term, a small take-rate on trade volume scales with the ecosystem.

**[CLOSE — 20s]** (~43 words)
I'm Dami, building this full time. x9 protocol is a new product category — autonomous agents with cryptographic policy enforcement — not a feature bolt-on to an existing trading platform. This is the right moment to define it. x9-protocol.vercel.app.

**Total: 378 words. ~2:54 at 130wpm. Under 3:00. ✓**

---

## VIDEO 2: TECH DEMO

### Scene Lineup (7 scenes, 2:35 total)

```
Architecture (25s) → Deploy Flow (30s) → Agent Loop (30s) → Swig Block (20s)
Vanish Route (20s) → Proof Page (20s) → Rationale (10s)
```

### Scene Storyboards

**SCENE 1 — Architecture (25s)**
Pattern G: three-column system diagram.
- Col 1 (green): "Decision Layer — Claude Haiku (RSI + prices) → Claude Sonnet (NL → policy)"
- Col 2 (accent): "Enforcement Layer — Swig ActionConfig → on-chain pre-check → block or approve"
- Col 3 (cyan): "Execution Layer — Vanish ephemeral → Jito MEV relay → Jupiter swap → GoldRush verify"
Arrows animate between columns. Bottom: "11 integrations. One loop."

**SCENE 2 — Deploy Flow (30s)**
Screen recording of deploy wizard (4 steps). FloatingCallouts:
- Step 1: "Plain English strategy"
- Step 3: "Swig ActionConfig — exact policy enforced on-chain"
- Step 4 progress: "Metaplex Core NFT minting + SNS domain registration"

**SCENE 3 — Agent Loop (30s)**
Terminal simulation. Lines type out real agent loop:
```
[alpha-hunter.sol] Fetching prices: 31 tokens via Jupiter API v2
[alpha-hunter.sol] RSI(14): SOL=42.3 BONK=61.7 WIF=38.1
[alpha-hunter.sol] Claude Haiku: HOLD — RSI neutral, insufficient momentum
[conservative.sol] Claude Haiku: BUY SOL $4.80 — RSI oversold at 31.2
[conservative.sol] Swig pre-check: PASS ($4.80 < $5.00 limit)
[conservative.sol] Vanish: ephemeral wallet 7xKm... created
[conservative.sol] Trade executed. Privacy score: 94
```

**SCENE 4 — Swig Block Event (20s)**
Screen recording of block event log. FloatingCallout: "1.2 SOL attempted — SolLimit (0.5 SOL) — BLOCKED before chain." EdgeArrows pointing to rule violated + Claude's reasoning logged.

**SCENE 5 — Vanish Route (20s)**
Animated diagram. Owner wallet → Vanish API → ephemeral address (one-time wallet) → Jito relay → DEX. Link from owner to ephemeral is visually cut (broken). "privacyScore: 94" appears from actual API response. Trade record showing vanishTxId.

**SCENE 6 — Proof Page (20s)**
Screen recording of /proof page. EdgeArrows: Swig LIVE, Vanish LIVE, Metaplex SEEDED, Jupiter LIVE, GoldRush LIVE, Dune LIVE, SNS LIVE, Ika SEEDED. Count: "11 integrations."

**SCENE 7 — Rationale (10s)**
Text only, full dark screen: "The agent cannot exceed your limits. Not because we check. Because Swig enforces it on-chain." Below: "x9-protocol.vercel.app"

---

### TECH DEMO — Full Script

**[ARCHITECTURE — 25s]** (~54 words)
Here is how x9 works at the systems level. Claude handles market analysis and decision-making. Swig enforces the policy on-chain before any transaction executes. Vanish routes the approved trade through an ephemeral wallet with Jito MEV protection. Metaplex and SNS handle agent identity. Jupiter aggregates the swap. GoldRush verifies it landed on-chain. These are not optional layers — they run on every single trade.

**[DEPLOY FLOW — 30s]** (~65 words)
Deploying an agent starts with a plain English strategy. Claude Sonnet converts it into typed Swig ActionConfig rules — SolLimit, SolRecurringLimit, and token allowlists. This is the exact policy enforced on-chain, not a re-interpretation of it. Metaplex then mints a Core NFT on-chain with the agent name, strategy, and owner wallet as permanent attributes. SNS assigns a dot-sol domain. The whole sequence takes about thirty seconds.

**[AGENT LOOP — 30s]** (~65 words)
Once started, the agent loop fires every five minutes. It fetches live prices for thirty-plus tokens from Jupiter Price API version two, computes a fourteen-period RSI, and passes the full market context to Claude Haiku using structured tool-use output. Haiku returns an action, token, dollar amount, and its reasoning. The Swig pre-check runs before any swap. A policy violation stops the trade right there and logs the block event.

**[SWIG BLOCK — 20s]** (~43 words)
Here is a real block event. An agent tried to buy 1.2 SOL in a single trade. The SolLimit rule caps it at 0.5 SOL. Swig rejects it before it touches the chain. The block event logs the rule violated, the attempted amount, and Claude's exact reasoning for wanting the trade.

**[VANISH — 20s]** (~43 words)
For trades that clear policy, Vanish handles routing. A fresh ephemeral deposit address is generated for each trade. The swap executes through Jito's MEV-protected relay. Every trade record stores the privacy score returned by Vanish. There is no on-chain link between your wallet and the agent's activity.

**[PROOF PAGE — 20s]** (~43 words)
The proof page documents every integration with live API evidence. Swig policy creation. Vanish privacy routing. Metaplex NFT mint. Jupiter price feed. GoldRush on-chain verification. Dune analytics. SNS domain registration. Ika MPC signing. Eleven integrations. Each card links to a real API response or on-chain data.

**[RATIONALE — 10s]** (~22 words)
The design choice that matters: Swig's enforcement is cryptographic, not advisory. The agent cannot exceed your limits even if Claude decides it should. That is the product guarantee.

**Total: 335 words. ~2:35 at 130wpm. ✓**

---

## SPONSOR COVERAGE MAP (3 submission portals)

| Sponsor | Coverage | Portal |
|---------|---------|--------|
| Vanish ($10K bounty) | Full scene in tech demo (Scene 5). Named in pitch Scene 4. "Every trade, not optional." | Colosseum + Vanish bounty |
| Swig | Architecture + block event scenes. "Cryptographic not advisory." | Colosseum + Superteam |
| Metaplex | Deploy flow scene. NFT mint with attributes on-chain. | Colosseum |
| Phantom | Visual in screen recordings (Connect Wallet button). | Colosseum |
| Jupiter | Agent loop terminal. "Price API v2, Quote API v6." | Colosseum |
| SNS | Deploy flow. ".sol domain per agent, logged in every cycle." | Colosseum |
| GoldRush | Architecture execution layer + proof page. | Colosseum |
| Dune | Proof page scene. "4 DuneSQL queries per agent." | Colosseum |
| Ika | Proof page SEEDED badge. Named explicitly for Superteam Earn track. | Colosseum + Superteam |
| Claude | Both videos throughout. Two models, two jobs. | Colosseum |

---

## ASSET CAPTURE CHECKLIST

Record at 1920x1080, clean browser profile, no extensions visible.

| File | What to record | Scene |
|------|---------------|-------|
| `deploy-wizard.mp4` | All 4 deploy steps: strategy → policy review → progress animation | Tech Demo Scene 2 |
| `dashboard-live.mp4` | Dashboard: 6 agents, 61 trades, live trade feed | Pitch Scene 3 |
| `agent-detail.mp4` | Agent detail: Active status, trade feed refreshing, PnL chart | Tech Demo Scene 3 |
| `block-event.mp4` | Block event log zoomed into a specific blocked trade | Tech Demo Scene 4 |
| `proof-page.mp4` | Scroll through /proof showing all 11 integration cards | Tech Demo Scene 6 |

---

## DECISIONS CONFIRMED

1. **Voice — DECIDED:** Pitch video = Dami's own voice (recorded over slides). Tech demo = Gemini Charon TTS. Rationale: judges evaluate "team credentials" and "full-time commitment" — a real voice on the pitch signals human behind the project. TTS is fine for technical narration.
2. Pitch format: Full Remotion animated slides.
3. Screen recordings: Dami records 5 clips from live site.
4. Ika explicit mention in pitch video (for Superteam Earn $15K) — TBD.
5. Vanish dedicated 30s in pitch beyond stack scene — TBD.

---

## BUILD ORDER (once decisions confirmed)

1. User captures 5 screen recordings (20 min)
2. Generate per-scene TTS audio — Gemini Charon (both scripts)
3. Build video/ Remotion project with x9 theme
4. Build Pitch Video (8 animated scenes)
5. Build Tech Demo (7 scenes + embedded screen recordings)
6. Preview in Remotion Studio
7. Render pitch.mp4 + demo.mp4
8. Render social.mp4 (10s vertical from Hook scene)
