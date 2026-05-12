# x9 protocol — Tech Demo Script
## 6 Scenes · ~2:25 total · Gemini Charon TTS

---

## [SCENE 1 — ARCHITECTURE — 25s] (~54 words)

x9 protocol is three layers that lock together. Claude analyzes the market and picks a trade. Swig checks it against your policy on-chain before it touches your funds — not our server, the chain. Vanish then routes the approved trade through a fresh wallet with Jito MEV protection so nothing traces back to you. Eleven integrations. One loop. Every five minutes.

---

## [SCENE 2 — DEPLOY FLOW — 30s] (~65 words)

You deploy an agent in four steps. You write your strategy in plain English — something like "conservative SOL trader, fifteen dollars max, fifty per day." Claude Sonnet reads that and generates a typed Swig policy — exact limits, exact tokens — enforced on-chain. Not stored in our database. On-chain. Metaplex then mints the agent as a Core NFT with those rules baked into its attributes permanently. Bonfida's SNS assigns it a dot-sol identity. The whole thing takes about thirty seconds.

---

## [SCENE 3 — AGENT LOOP — 35s] (~76 words)

Once active, the loop fires every five minutes. Jupiter's Price API feeds live data for thirty-one tokens. The system calculates a fourteen-period RSI on each, then passes the full picture to Claude Haiku — market context, portfolio state, recent decisions. Haiku returns an action, an amount, and its exact reasoning. That decision goes straight to Swig's pre-check. When the numbers fit the policy, the trade clears. When they don't — you see it right here — the block event logs the rule, the attempted amount, and why Claude wanted the trade anyway. Nothing reaches the chain. Nothing leaves your control.

---

## [SCENE 4 — VANISH ROUTE — 25s] (~54 words)

For trades that clear, Vanish handles execution. A one-time deposit address is created for that trade specifically — it is never reused. The swap routes through Jito's MEV-protected relay into Jupiter. The agent records the privacy score Vanish returns — this one came back at ninety-one. There is no on-chain connection between your wallet and that trade. That is by design, not by accident.

---

## [SCENE 5 — PROOF PAGE — 20s] (~43 words)

This is the proof page. Every integration documented with live API evidence — not screenshots, actual response data. Swig policy on-chain. Vanish tx confirmed. Metaplex NFT minted. SNS domain registered. Jupiter price feed running. GoldRush verifying on-chain. Dune pulling four queries per agent. Ika MPC signing wired in. Eleven integrations. All live.

---

## [SCENE 6 — RATIONALE — 10s] (~22 words)

The design choice that matters: Swig's enforcement is cryptographic, not advisory. The agent cannot exceed your limits — even if Claude decides it should. That is the product guarantee.

---

## TIMING

| Scene | Words | Seconds (@130wpm) |
|-------|-------|-------------------|
| Architecture | 54 | 25s |
| Deploy Flow | 65 | 30s |
| Agent Loop | 76 | 35s |
| Vanish Route | 54 | 25s |
| Proof Page | 43 | 20s |
| Rationale | 22 | 10s |
| **Total** | **314** | **~2:25** |

**With 5 crossfades × 0.8s = ~2:29 final runtime. Under 2:30. ✓**

---

## SCENE 3 — BLOCK EVENT NOTE

No dedicated screen recording for the block event. The block moment is delivered as a terminal animation overlaid on the agent-detail recording during Scene 3's climax:

```
[alpha-hunter.sol] Swig pre-check: BLOCKED — 1.2 SOL > 0.5 SOL SolLimit
```

Narration cue: "When they don't — you see it right here — the block event logs the rule..."
The FloatingCallout points to the block entry in the terminal output.

---

## RECORDING CUT PLAN

| Scene | Recording | Segment | Notes |
|-------|-----------|---------|-------|
| 1 | x9 protocol + landing | Full scroll, 0s–12s | Hero → How It Works → Policy Engine → integrations grid |
| 2 | x9 protocol + deploy | Full flow, 0s–27s | All 4 steps. Pause at step 3 (Swig policy preview). |
| 3 | x9 protocol + agent detail | 0s–8s active view | Agent loop terminal animation overlaid. Block event at climax. |
| 4 | x9 protocol + agent detail | Trade detail panel | vanishTxId + privacyScore visible. FloatingCallout: "privacyScore: 91" |
| 5 | x9 protocol + proof | Full scroll | All 11 cards. EdgeArrows: LIVE badges. |
| 6 | None | Dark screen, text only | GlowText rationale only. |

---

## RE-ENCODE COMMAND

All files must be converted from 2876×1538 @ 60fps before Remotion use.
Actual filenames: `x9-protocol landing.mov`, `x9-protocol deploy.mov`, etc.

```bash
for name in landing deploy agent-detail proof; do
  ffmpeg -i ~/Documents/"x9-protocol ${name}.mov" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
    -r 30 -c:v libx264 -crf 18 -pix_fmt yuv420p \
    video/public/assets/${name}.mp4
done
```

NOTE: dashboard.mov must be re-recorded before encoding (see RECORDING ISSUES below).
