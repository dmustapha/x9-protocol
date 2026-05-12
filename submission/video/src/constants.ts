export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const COLORS = {
  bg: "#09090b",
  bgCard: "rgba(0,255,136,0.04)",
  accent: "#00ff88",
  accentDim: "#00994d",
  accentBright: "#4ade80",
  white: "#f8fafc",
  offWhite: "#94a3b8",
  muted: "#475569",
  border: "rgba(0,255,136,0.15)",
  red: "#ef4444",
  amber: "#f59e0b",
  cyan: "#22d3ee",
  blue: "#0090ff",
  purple: "#bc8cff",
};

export const TERMINAL = {
  bg: "#0a120c",
  text: "#c9d9cd",
  green: "#3fb950",
  yellow: "#d29922",
  red: "#f85149",
  blue: "#58a6ff",
  purple: "#bc8cff",
  prompt: "#8b949e",
};

export const X9_ORBS = [
  { baseX: 250,  baseY: 200, size: 480, color: "#00ff88", blur: 120, opacity: 0.10, speed: 0.006 },
  { baseX: 1550, baseY: 780, size: 420, color: "#00994d", blur: 110, opacity: 0.08, speed: 0.005 },
  { baseX: 960,  baseY: 500, size: 550, color: "#0090ff", blur: 140, opacity: 0.07, speed: 0.008 },
  { baseX: 1680, baseY: 160, size: 380, color: "#22d3ee", blur: 100, opacity: 0.06, speed: 0.007 },
  { baseX: 180,  baseY: 820, size: 320, color: "#00ff88", blur: 100, opacity: 0.05, speed: 0.009 },
] as const;

export const SCENE_GAP = Math.round(1.5 * FPS);

// Exact durations from ffprobe (frames at 30fps)
export const AUDIO_DURATIONS = {
  hook:     438,
  problem:  689,
  solution: 899,
  moat:     769,
  market:   620,
  gtm:      518,
  revenue:  518,
  close:    687,
} as const;

export const SCENE_DURATIONS = {
  hook:     AUDIO_DURATIONS.hook     + SCENE_GAP,
  problem:  AUDIO_DURATIONS.problem  + SCENE_GAP,
  solution: AUDIO_DURATIONS.solution + SCENE_GAP,
  moat:     AUDIO_DURATIONS.moat     + SCENE_GAP,
  market:   AUDIO_DURATIONS.market   + SCENE_GAP,
  gtm:      AUDIO_DURATIONS.gtm      + SCENE_GAP,
  revenue:  AUDIO_DURATIONS.revenue  + SCENE_GAP,
  close:    AUDIO_DURATIONS.close    + 90,
} as const;

export const CROSSFADE = 24;

export const TOTAL_FRAMES =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  CROSSFADE * (Object.keys(SCENE_DURATIONS).length - 1);

export const AUDIO_FILES: Record<keyof typeof SCENE_DURATIONS, string> = {
  hook:     "audio/hook.mp3",
  problem:  "audio/problem.mp3",
  solution: "audio/solution.mp3",
  moat:     "audio/moat.mp3",
  market:   "audio/market.mp3",
  gtm:      "audio/gtm.mp3",
  revenue:  "audio/revenue.mp3",
  close:    "audio/close.mp3",
};

export type SubEntry = { text: string; start: number; end: number };

export const SUBTITLES: Record<keyof typeof SCENE_DURATIONS, SubEntry[]> = {
  hook: [
    { text: "Crypto markets run every hour of every day.", start: 0,   end: 112 },
    { text: "The average trader does not.",               start: 112, end: 196 },
    { text: "That gap between what the market offers and what any person can actually respond to is the product opportunity.", start: 196, end: 438 },
  ],
  problem: [
    { text: "Most trading tools give you a template.", start: 0,   end: 108 },
    { text: "You pick from a menu, you set a number in a database somewhere,", start: 108, end: 252 },
    { text: "and when something goes wrong you have no way to verify whether the bot followed your intent or just did whatever it wanted.", start: 252, end: 530 },
    { text: "The enforcement is advisory.", start: 530, end: 607 },
    { text: "Nothing about it is verifiable on-chain.", start: 607, end: 689 },
  ],
  solution: [
    { text: "x9 lets you deploy an autonomous AI agent on Solana in under two minutes.", start: 0,   end: 180 },
    { text: "You describe your strategy in plain English,", start: 180, end: 290 },
    { text: "Claude Sonnet converts it into a cryptographic policy enforced on-chain by Swig before any transaction touches your funds.", start: 290, end: 590 },
    { text: "Claude Haiku then monitors thirty-one tokens every five minutes and trades within those exact constraints.", start: 590, end: 800 },
    { text: "You never touch it again.", start: 800, end: 899 },
  ],
  moat: [
    { text: "What makes this defensible is the enforcement layer, not the AI layer.", start: 0,   end: 190 },
    { text: "Swig's policy runs at the transaction level before the chain processes anything.", start: 190, end: 385 },
    { text: "Every agent also gets a permanent on-chain identity through Metaplex Core, Bonfida SNS, and Ika MPC key management.", start: 385, end: 620 },
    { text: "A competitor who wants to copy this needs the same on-chain primitives, not just the same interface.", start: 620, end: 769 },
  ],
  market: [
    { text: "Solana moves between one and four billion dollars in DEX volume every day.", start: 0,   end: 185 },
    { text: "Millions of active traders are already on the network, already have wallets, already understand the tooling.", start: 185, end: 440 },
    { text: "The adjacent market is small crypto funds without engineering teams who want automated execution without sending funds to a CEX.", start: 440, end: 620 },
  ],
  gtm: [
    { text: "The product generates shareable output by default.", start: 0,   end: 135 },
    { text: "P&L curves, block events, Claude's exact reasoning on every trade.", start: 135, end: 310 },
    { text: "That is exactly the content Solana Twitter engages with,", start: 310, end: 415 },
    { text: "and Phantom and Metaplex give us ecosystem distribution from day one.", start: 415, end: 518 },
  ],
  revenue: [
    { text: "Per-agent subscription, fifteen to thirty dollars a month.", start: 0,   end: 195 },
    { text: "A thousand active agents is between one-eighty and three-sixty K in annual recurring revenue,", start: 195, end: 410 },
    { text: "and trade volume take-rate scales that further.", start: 410, end: 518 },
  ],
  close: [
    { text: "I'm Dami, building this full time.", start: 0,   end: 150 },
    { text: "x9 protocol is a new product category - autonomous agents with cryptographic policy enforcement,", start: 150, end: 420 },
    { text: "not a feature bolt-on to an existing trading platform.", start: 420, end: 560 },
    { text: "The moment to define it is now.", start: 560, end: 640 },
    { text: "x9-protocol.vercel.app", start: 640, end: 687 },
  ],
};

export const SOCIAL_FPS = 30;
export const SOCIAL_W = 1080;
export const SOCIAL_H = 1920;
export const SOCIAL_DURATION = 10 * FPS;
