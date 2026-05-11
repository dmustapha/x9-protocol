# x9 protocol — Sponsor Integration Map

## Swig Smart Wallet
- Integration: Policy engine enforcing per-trade and daily SOL limits
- Depth: Deep — SwigClient.createPolicy() + enforcePolicy() + BlockEvent table
- Evidence: BlockEvent log visible in dashboard; policy rules stored per agent
- Code: src/lib/swig.ts, src/lib/agent-engine.ts (preCheckTrade)
- Status: Local enforcement live; on-chain API pending funded devnet wallet

## Vanish Core API
- Integration: Trades routed through one-time privacy wallets
- Depth: Deep — VanishClient.getOneTimeWallet() + createTrade() + commit()
- Evidence: vanishTxId stored on each executed Trade; privacy score displayed per trade
- Code: src/lib/vanish.ts, src/lib/agent-engine.ts (Step 6)
- Status: LIVE — production API key active (https://core-api.vanish.trade)

## Metaplex Core 014
- Integration: Every agent minted as an on-chain Core NFT on deployment
- Depth: Moderate — mintAndSubmitAgent() via mpl-agent-registry SDK
- Evidence: metaplexNftAddress stored on Agent; public/agent-metadata.json served at /agent-metadata.json
- Code: src/lib/metaplex.ts, public/agent-metadata.json
- Status: SDK wired; live mint pending funded devnet wallet

## Claude AI (Anthropic)
- Integration: Claude Haiku reasons about each trade using tool_use structured output
- Depth: Deep — real-time market context + RSI passed to model; structured decision returned
- Evidence: Trade.reason stores Claude's AI reasoning for each decision
- Code: src/lib/claude.ts (getTradeDecision + strategyToPolicy)
- Models: claude-haiku-4-5-20251001 (trade loop), claude-sonnet-4-6-20250514 (NL policy)
- Status: LIVE (fallback to hold when API credits exhausted)

## Phantom Connect
- Integration: Users connect Phantom wallet to deploy agents and sign transactions
- Depth: Moderate — @phantom/react-sdk useAccounts() + useModal().open()
- Evidence: WalletButton in header; ownerWallet stored on Agent at deploy
- Code: src/providers/PhantomProvider.tsx, src/components/shared/WalletButton.tsx
- App ID: 6673da67-257d-4538-b82c-d3e69928c46e
- Status: LIVE

## Jupiter DEX Aggregator
- Integration: All swaps routed through Jupiter for best execution
- Depth: Moderate — getSwapQuote() + getSwapTransaction() via Jupiter V6 API
- Evidence: jupiterTxId stored on Trade; integrated in agent-engine.ts trade path
- Code: src/lib/jupiter.ts, src/lib/agent-engine.ts (Step 6)
- Status: Fully wired; live swaps pending funded devnet wallet

## CoinGecko Price Feed
- Integration: Real-time SOL/USDC price feeds power RSI(14) calculations
- Depth: Deep — fetchPrices() polls every agent loop cycle; PricePoint table accumulates history
- Evidence: RSI(14) calculated from 14 price points; trading decisions reference live prices
- Code: src/lib/coingecko.ts, src/lib/rsi.ts
- Status: LIVE
