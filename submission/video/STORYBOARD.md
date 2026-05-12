# x9 protocol — Pitch Video Storyboard
## Strategy C · TransitionSeries + per-scene audio · 8 scenes · TOTAL_FRAMES = 5385

All frame numbers are within-scene (scene-local). Audio cues derived from ffprobe silence detection.
Theme: bg #09090b · accent #00ff88 · text #f8fafc · fonts Inter + JetBrains Mono

---

## SCENE 1 — HOOK (485 frames = 16.17s)
**Audio:** Hook.m4a → hook.mp3 (14.656s = 440 frames)
**Silence at:** 0.46–0.99s (frames 14–30) — first pause after "every hour of every day"

### Layout
Full dark canvas. AnimatedBackground green orbs. Center-stack composition.

```
[Frame 0]    AnimatedBackground begins (all scenes)
[Frame 5]    Counter appears — counts from 0 → 24 (accent color, 160px Inter 900)
             Label below: "hours a day markets run" (32px Inter 600 offWhite)
             Spring entrance: scale 0.93→1, opacity 0→1 (damping 15, stiffness 80)
[Frame 14]   PAUSE detected — counter hits 24, hold for ~16 frames
[Frame 30]   Crossfade via interpolate: counter fades to 60% opacity
             New line appears: "You run about" (40px Inter 600 offWhite)
             Stat: "6" (140px Inter 900 accent) with glow pulse
             Spring delay=30: scale 0.93→1, opacity 0→1
[Frame 150]  "~6h" becomes full-width, counter row exits upward (translateY -40px, opacity 0→0)
             Actually: keep both, add third beat below
[Frame 200]  Thin separator line fades in (linear gradient, 1px, accent at 40%)
[Frame 220]  "x9 protocol" appears center — 88px Inter 900, gradient text
             (linear-gradient 135deg: accentBright → accent → #0090ff)
             Shield icon (32px) to left, GlowText glowIntensity 1.5
             Spring delay=220, damping 14, stiffness 80
[Frame 270]  Tagline below: "autonomous agents · cryptographic enforcement"
             28px JetBrains Mono 600, offWhite, letterSpacing 1px
             Spring delay=270
[Frame 380]  Subtle bottom-right: "Colosseum Frontier 2026" — 13px Mono muted
[Frame 440]  Audio ends. SCENE_GAP begins (frames 440–485). No new animations.
```

---

## SCENE 2 — PROBLEM (736 frames = 24.53s)
**Audio:** Problem.m4a → problem.mp3 (23.019s = 691 frames)
**Silence at:**
- 0.0–1.13s (frames 0–34) — leading silence, intentional breath before speaking
- 17.66–18.39s (frames 530–552) — "The enforcement is advisory." LANDING PAUSE

### Layout
Two-column contrast. Left = problems (red). Right = empty/void initially. Pattern B.

```
[Frame 0]    AnimatedBackground. No other elements yet (leading silence).
[Frame 10]   Left column header slides in from left (translateX -30→0)
             "CURRENT STATE" — 12px JetBrains Mono 700, red (#ef4444), letterSpacing 3px
             Spring delay=10
[Frame 30]   Left item 1 appears:
             "Strategy locked to a template" — 26px Inter 600 white
             Red dash prefix "—" (accent red). Spring delay=30, translateY 16→0.
[Frame 80]   Left item 2: "Risk controls stored in a database"
             Same style. Spring delay=80.
[Frame 150]  Left item 3: "Nothing about it is verifiable."
             Same style. Spring delay=150.
             After this line: right column header appears but stays dim.
[Frame 200]  Right column area: dim border outline appears (1px border, accent 10% opacity)
             Dashed border. Label "ON-CHAIN" at top — 12px Mono, muted. No content yet.
             The emptiness IS the contrast. The right column is intentionally void.
[Frame 380]  Left item 4: "The enforcement is advisory."
             28px Inter 700 white. NO red prefix — this line stands alone.
             Spring delay=380. Slower entrance: damping 20, stiffness 60.
[Frame 400]  Horizontal rule below item 4 (thin line, red 40% opacity, animates width 0→300px)
[Frame 530]  PAUSE HIT — "The enforcement is advisory." is on screen alone. No animation.
             Hold. Let it breathe. The void right column amplifies this.
[Frame 552]  Right column: large text fades in, centered in the void:
             "Nothing." — 72px Inter 900, red, opacity 0→0.7
             This is the punchline. Not a label — a fact.
             Spring delay=552, damping 25, stiffness 40 (very slow, deliberate)
[Frame 691]  Audio ends. SCENE_GAP begins (frames 691–736).
```

---

## SCENE 3 — SOLUTION (945 frames = 31.5s)
**Audio:** Solution.m4a → solution.mp3 (30.016s = 900 frames)
**Silence at:**
- 2.65–3.37s (frames 79–101) — after "in under two minutes" → Card 1 trigger
- 7.15–8.07s (frames 214–242) — after "enforced on-chain by Swig" → Card 2 trigger
- 17.65–18.48s (frames 529–554) — middle pause, end of RSI/trading segment → Card 3 trigger
- 26.13–27.08s (frames 784–812) — after "within those exact constraints" → Card 4 trigger

### Layout
Four GlassCards stagger in on their silence cues. Right side: deploy screenshot B-roll appears mid-scene.
Pattern C (staggered cards) + Pattern E (recording overlay).

```
[Frame 0]    AnimatedBackground. Title top-left:
             "THE SOLUTION" — 12px Mono 700, accent, letterSpacing 3px
             Fades in opacity 0→1 over 20 frames.
[Frame 10]   Subtitle: "deploy in under 2 minutes" — 20px Mono 600 offWhite
             Spring delay=10

[Frame 24]   Card 1 springs in — full-width (1400px), left-aligned:
             Header: "01" (Mono accent 14px) + "Write in plain English"
             Body: "conservative SOL trader, $5 max per trade, $20 per day"
             GlassCard with accent border. Spring delay=24, damping 14, stiffness 80.
             Scale 0.93→1, translateY 16→0.

[Frame 79]   PAUSE — Card 1 settles. Nothing new.

[Frame 107]  Card 2 springs in below Card 1:
             Header: "02" + "Claude converts to on-chain policy"
             Body: "cryptographic rules enforced by Swig before any transaction executes"
             borderColor: cyan (#22d3ee) at 30% opacity
             Spring delay=107

[Frame 214]  PAUSE — Cards 1+2 visible. Breathing room.

[Frame 242]  Card 3 springs in:
             Header: "03" + "Agent monitors 31 tokens every 5 minutes"
             Body: "RSI signals · Jupiter prices · Claude Haiku decisions"
             borderColor: accent at 30%
             Spring delay=242

[Frame 320]  Right side: deploy screenshot placeholder fades in
             (1px border, rounded 16px, accent glow, placeholder text if no asset)
             Width: 600px, right-aligned. Opacity 0→0.6 over 30 frames.
             This is the visual proof — app doing what the script describes.

[Frame 529]  PAUSE — pause at ~17.65s. Hold.

[Frame 593]  Card 4 springs in — full width, distinct styling:
             Header: "04" + "You never touch it again."
             Body: (none — this line stands alone)
             borderColor: accent at 60%, bolder border
             Background: accent at 8% (slightly highlighted vs others)
             Spring delay=593, damping 20, stiffness 60 (slow, landing emphasis)
             Text: 30px Inter 700 white (bigger than body text on other cards)

[Frame 784]  PAUSE at 26.13s — Card 4 fully visible. Hold.

[Frame 900]  Audio ends. SCENE_GAP begins (frames 900–945).
```

---

## SCENE 4 — MOAT (815 frames = 27.17s)
**Audio:** Moat.m4a → moat.mp3 (25.664s = 770 frames)
**Silence at:**
- 3.56–5.05s (frames 107–151) — two close pauses: comma breath at 3.56s, sentence end at 5.05s
- ~18s+ onward — no major pauses detected in second half

### Layout
Single strong GlassCard with argument flow. Tech stack badges appear late. Pattern C + G hybrid.

```
[Frame 0]    AnimatedBackground. Left section label:
             "COMPETITIVE MOAT" — 12px Mono 700, accent, letterSpacing 3px

[Frame 10]   Main header springs in:
             "The enforcement layer, not the AI layer."
             56px Inter 800 white. Spring delay=10, damping 14, stiffness 80.

[Frame 40]   Sub-argument block 1:
             GlassCard (800px wide, left side):
             "Swig's policy runs at the transaction level — before the chain processes anything."
             24px Inter 500 offWhite, lineHeight 1.6
             Spring delay=40.

[Frame 107]  PAUSE (comma breath). Hold.

[Frame 130]  GlassCard 2 slides in from right:
             "Every agent gets a permanent on-chain identity."
             24px Inter 500 offWhite
             Right side of layout. Spring delay=130, translateX 30→0.

[Frame 151]  PAUSE (sentence end). Hold.

[Frame 200]  Argument statement appears below header, center-width:
             "A competitor who wants to copy this needs the same on-chain primitives."
             22px Inter 500 offWhite italic
             Spring delay=200, opacity 0→0.85

[Frame 350]  Divider line animates: width 0→900px, centered, accent 30%

[Frame 400]  Label: "BUILT ON" — 11px Mono muted, letterSpacing 3px

[Frame 420]  Tech badges row springs in staggered (18-frame gaps):
             Badge 1: "Swig" — bg accent 15%, border accent 40%, text accent
             Badge 2: "Metaplex Core" — bg blue 15%, border blue 40%, text #0090ff
             Badge 3: "Bonfida SNS" — bg purple 15%, border purple 40%, text #bc8cff
             Badge 4: "Ika MPC" — bg cyan 15%, border cyan 40%, text #22d3ee
             Each badge: 14px Mono 700, padding 8px 16px, borderRadius 8px
             Enter frames: 420, 438, 456, 474

[Frame 544]  All badges visible. No new animations.
             Right side: large text annotation:
             "Not just an interface — a new primitive."
             28px Inter 700, accent, opacity 0→1 over 20 frames
             Spring delay=544.

[Frame 770]  Audio ends. SCENE_GAP begins (frames 770–815).
```

---

## SCENE 5 — MARKET (666 frames = 22.2s)
**Audio:** Market.m4a → market.mp3 (20.715s = 621 frames)
**Silence at:**
- 5.38–6.07s (frames 161–182) — after first market stat, before second

### Layout
Three animated stat counters + market context text. Pattern A (hook counter style) extended to 3 stats.

```
[Frame 0]    AnimatedBackground. Header:
             "THE MARKET" — 12px Mono 700, accent, letterSpacing 3px
             Subtitle: "Solana DEX ecosystem" — 18px Mono 500 muted

[Frame 20]   Stat 1 counter animates:
             Label first: "daily DEX volume" — 14px Mono muted, letterSpacing 2px
             Counter: "$1B – $4B" — 96px Inter 900 accent
             Use static display (range, not animated count — avoids wrong number)
             Spring delay=20, scale 0.93→1.

[Frame 161]  PAUSE — Stat 1 holds. Breathing room.

[Frame 178]  Stat 2 springs in (below or right of Stat 1):
             Label: "active traders on Solana" — 14px Mono muted
             Counter: "2M+" — 96px Inter 900 white
             Spring delay=178, translateY 20→0.

[Frame 250]  Stat 3 begins: (no silence cue — mid-sentence, time-estimated at ~8.5s = frame 255)
             Label: "adjacent market" — 14px Mono muted
             Value: "small crypto funds" — 36px Inter 700 white (text, not a number)
             Sub: "no engineering team · want automation" — 20px Inter 500 offWhite
             Spring delay=255.

[Frame 380]  Context card springs in (right side or below stats):
             GlassCard, borderColor cyan 30%:
             "They already have wallets."
             "They already understand the tooling."
             24px Inter 600 white, lineHeight 1.8
             Spring delay=380.

[Frame 450]  Bottom annotation:
             "The market is already on Solana."
             28px Inter 700 accent, center
             Spring delay=450, glowIntensity 1.2.

[Frame 621]  Audio ends. SCENE_GAP begins (frames 621–666).
```

---

## SCENE 6 — GTM (564 frames = 18.8s)
**Audio:** GTM.m4a → gtm.mp3 (17.301s = 519 frames)
**Silence at:**
- Almost none — dense delivery. Estimated sentence boundaries by word count.
- ~1.6s (frame 48): after "Solana Twitter" intro
- ~5.3s (frame 159): after "build-in-public"
- ~10.0s (frame 300): after "block events, Claude's reasoning on every trade"

### Layout
Two-column. Left: GTM channels (staggered). Right: shareable output card.

```
[Frame 0]    AnimatedBackground. Header:
             "GO-TO-MARKET" — 12px Mono 700, accent, letterSpacing 3px

[Frame 10]   Right column card springs in early (sets up the "output = content" thesis):
             GlassCard (560px wide, right side):
             Header: "The product generates shareable output by default."
             20px Inter 600 white
             Below: three mini-items staggered:
               — "P&L curves" (accent)
               — "block events" (accent)
               — "Claude's reasoning on every trade" (accent)
             Each 18px Inter 500, spring delay offset 20 frames
             Overall card spring delay=10.

[Frame 21]   Left: Channel 1 slides in from left:
             Icon: "01" (Mono accent) + "Solana Twitter / build-in-public"
             22px Inter 600 white
             Sub: "this community engages with P&L content" — 16px Mono muted
             Spring delay=21, translateX -24→0.

[Frame 160]  Channel 2:
             "02" + "Phantom ecosystem"
             Sub: "Connect Wallet integration · wallet-native distribution"
             Spring delay=160.

[Frame 300]  Channel 3:
             "03" + "Metaplex agent registry"
             Sub: "ecosystem distribution from day one"
             Spring delay=300.

[Frame 400]  Bottom callout — full width, center:
             "Phantom and Metaplex give us ecosystem distribution from day one."
             22px Inter 600 offWhite
             Fades in opacity 0→0.8, spring delay=400.

[Frame 519]  Audio ends. SCENE_GAP begins (frames 519–564).
```

---

## SCENE 7 — REVENUE (564 frames = 18.8s)
**Audio:** Revenue.m4a → revenue.mp3 (17.301s = 519 frames)
**Silence at:**
- 9.16–10.04s (frames 275–301) — perfect split between pricing line and agent count line

### Layout
Single GlassCard with pricing, then counter. Clean, minimal. Pattern C single card.

```
[Frame 0]    AnimatedBackground. Header:
             "REVENUE MODEL" — 12px Mono 700, accent, letterSpacing 3px

[Frame 20]   GlassCard springs in (1200px wide, center):
             First line: "Per-agent subscription"
             38px Inter 700 white, spring delay=20.

[Frame 50]   Price range appears below:
             "$15 – $30" — 96px Inter 900 accent, GlowText glowIntensity 1.5
             "per agent / month" — 20px Mono 500 offWhite
             Spring delay=50.

[Frame 120]  Separator line animates (accent 30%, width 0→800px, centered).

[Frame 160]  Scale card appears right side:
             "What 1,000 agents looks like:"
             18px Mono 600 muted
             Spring delay=160.

[Frame 275]  PAUSE — price line and context visible. Hold.

[Frame 296]  Agent counter starts animating:
             "0 → 1,000 agents" — 80px Inter 900 white, count up animation
             interpolate(frame-296, [0, 200], [0, 1000])
             "= $180K – $360K ARR" — 40px Inter 700 accent, appears when counter hits 1000
             (appears at frame ~496, or use delayed GlowText)
             Spring delay=296 for the counter container.

[Frame 450]  ARR label appears:
             "$180K – $360K ARR" — 48px Inter 800 accent, GlowText
             Spring delay=450.

[Frame 480]  Additional line:
             "Trade volume take-rate scales with the ecosystem."
             20px Inter 500 offWhite
             Spring delay=480, opacity 0→0.75.

[Frame 519]  Audio ends. SCENE_GAP begins (frames 519–564).
```

---

## SCENE 8 — CLOSE (778 frames = 25.93s)
**Audio:** Close.m4a → close.mp3 (22.933s = 688 frames)
**Silence at:**
- 0.0–1.52s (frames 0–46) — intentional leading silence. No animation. Open on darkness.
- 18.23–19.16s (frames 547–575) — "The moment to define it is now." landing pause

### Layout
Pattern H: Corner brackets → Logo → Brand name → Tagline → Statement → URL → Fade to black.

```
[Frame 0]    AnimatedBackground (slower, dramatic).
             DARKNESS. No other elements. Let the leading silence land.

[Frame 10]   Corner brackets fade in (4 corners, 55x55 SVG lines, accent 60% opacity)
             Each corner: 2 lines, 40px each, borderRadius 0
             opacity 0→0.6 over 36 frames

[Frame 46]   Audio begins. Now elements enter.

[Frame 55]   "x9 protocol" — 96px Inter 900, gradient text
             (linear-gradient 135deg: #4ade80 → #00ff88 → #22d3ee)
             Center, GlowText glowIntensity 1.8
             Spring delay=55, damping 12, stiffness 70

[Frame 80]   Tagline: "autonomous agents · cryptographic policy enforcement"
             28px JetBrains Mono 600 offWhite letterSpacing 1px
             Spring delay=80.

[Frame 150]  Statement block springs in:
             "I'm Dami, building this full time."
             24px Inter 600 offWhite
             Spring delay=150.

[Frame 220]  "x9 protocol is a new product category —"
             24px Inter 600 offWhite
             "not a feature bolt-on to an existing trading platform."
             Same size, line 2.
             Spring delay=220.

[Frame 547]  PAUSE — "The moment to define it is now." just spoken. Hold.
             NO animation during this pause. Let it land in silence.

[Frame 590]  URL appears:
             "x9-protocol.vercel.app"
             40px JetBrains Mono 700 accent, GlowText glowIntensity 2.0
             Spring delay=590, damping 15, stiffness 80.
             textShadow: 3 layers (0 0 20px accent, 0 0 60px accent30, 0 0 120px accent15)

[Frame 640]  "Built for Solana Frontier · Colosseum 2026"
             14px Mono 500 muted
             Spring delay=640, opacity 0→0.5.

[Frame 688]  Audio ends. SCENE_GAP begins (frames 688–718).

[Frame 718]  FADE TO BLACK begins:
             AbsoluteFill overlay, background #000000
             opacity interpolate(frame, [718, 778], [0, 1])
             extrapolateLeft: clamp, extrapolateRight: clamp
             (60 frames = 2s slow fade)

[Frame 778]  Composition ends.
```

---

## TIMING SUMMARY

| Scene | Audio (frames) | SCENE_GAP | SCENE_DURATION | Transitions |
|-------|---------------|-----------|----------------|-------------|
| Hook | 440 | +45 | 485 | 24 out |
| Problem | 691 | +45 | 736 | 24 in+out |
| Solution | 900 | +45 | 945 | 24 in+out |
| Moat | 770 | +45 | 815 | 24 in+out |
| Market | 621 | +45 | 666 | 24 in+out |
| GTM | 519 | +45 | 564 | 24 in+out |
| Revenue | 519 | +45 | 564 | 24 in+out |
| Close | 688 | +90 | 778 | 24 in |
| **Total** | **5148** | **405** | **5553** | |

**TOTAL_FRAMES = 5553 - (24 × 7) = 5553 - 168 = 5385**
**At 30fps: 5385 / 30 = 179.5s = 2:59.5 — UNDER 3:00 CAP ✓**

---

## TEXT SPEC REFERENCE

| Role | Size | Weight | Font | Color |
|------|------|--------|------|-------|
| Stat headline | 96–160px | 900 | Inter | accent |
| Scene header | 72–88px | 800 | Inter | white/gradient |
| Card title | 28–36px | 700 | Inter | white |
| Body text | 22–26px | 500–600 | Inter | offWhite |
| Label / badge | 11–14px | 700 | JetBrains Mono | accent/muted |
| URL | 40px | 700 | JetBrains Mono | accent |
| Tagline | 28px | 600 | JetBrains Mono | offWhite |
| Section tag | 12px | 700 | JetBrains Mono | accent |
| Muted annotation | 13–18px | 500 | Inter/Mono | muted |

All colors reference COLORS constant — never hardcoded hex in scene files.
