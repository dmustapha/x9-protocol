# x9 protocol — Business Overview

## The Problem

Most people who trade crypto seriously are doing something that doesn't scale. They're watching charts manually, setting alerts, waking up at 3am to catch a window, and still making emotional decisions under pressure. The ones who've been around long enough know that systematic trading outperforms discretionary trading almost every time, but building a system is engineering work, not trading work. You need a server, a price feed, a decision engine, a risk layer, and the confidence that none of it will do something catastrophic while you're asleep. That stack, historically, has been the exclusive domain of quantitative funds with engineering teams.

The alternative is to use an existing bot product, most of which let you pick from a menu of rigid pre-built strategies, don't enforce risk limits at the transaction level, and route trades through infrastructure you have no visibility into. There's no middle ground between "build it yourself" and "trust a black box."

x9 protocol is that middle ground.

## What We Built

You write your strategy in plain English. Something like: "conservative SOL trader, never risk more than $5 per trade, $20 per day, only trade SOL and USDC." The platform converts that into a cryptographic policy enforced on-chain by Swig before any transaction executes. Then an AI agent, powered by Claude, monitors live prices and 14-period RSI signals for 30+ Solana tokens every five minutes and makes buy, sell, or hold decisions entirely within those constraints, without any further input from you.

The agent has an on-chain identity. Every deployment mints a Metaplex Core NFT that permanently records the agent's strategy, owner wallet, and policy hash on Solana. SNS assigns a .sol domain so the agent is discoverable and verifiable. Every trade is routed through Vanish, which uses ephemeral one-time wallets and Jito MEV protection to break the on-chain link between your wallet and your agent's trading activity. The Swig policy layer means the constraints you set aren't just stored in a database somewhere — they're enforced at the transaction level.

That last point matters more than it might seem at first. A lot of trading infrastructure claims to have risk controls. x9 is one of the very few systems where the risk control is cryptographic, not advisory. The agent cannot exceed your daily limit even if Claude decides it should.

## The Market

There are roughly 7 million monthly active Solana wallets. Of those, around 5-10% are active DeFi traders who engage with the chain at least weekly, which is somewhere between 350,000 and 700,000 people. These are not users who need to be educated about wallets or convinced to move on-chain — they're already there, already trading, already sophisticated enough to want a better system. The conversion path is short.

Beyond retail, the adjacent market is small crypto funds and DAOs running systematic strategies. These teams want algorithmic execution but don't have the engineering capacity to build and maintain the infrastructure. A multi-agent deployment where each agent has its own policy, its own on-chain identity, and its own independent P&L tracking is something that currently doesn't exist as a packaged product for this cohort.

The broader AI agent economy on Solana is also just getting started. Metaplex's 014 registry, Swig's programmable wallet infrastructure, and the maturation of Solana-native AI tooling are all converging in 2026. Being the platform that makes those tools accessible to non-engineers puts x9 in front of a wave that's still forming.

## Revenue

The initial model is a per-agent subscription. Somewhere in the range of $15-30 per month per active agent is a realistic price point given what it would cost someone to build this themselves, and it's low enough that serious traders deploying two or three agents would pay it without much friction. At 1,000 active agents, which is a reasonable 12-month target given the size of the Solana ecosystem and the AI agent tailwind, that's $180,000 to $360,000 in annualised recurring revenue.

The longer-term revenue line is a small take-rate on trade volume. As agent activity compounds and trade frequency increases, even a 0.05-0.1% fee on executed swap volume becomes significant. The infrastructure cost per agent is low enough that margins hold well at scale. A third potential revenue line is an enterprise tier for funds that want custom policy templates, dedicated RPC endpoints, and white-label deployment — though that's a 12-18 month horizon.

## How We Get Users

Solana Twitter is genuinely one of the best distribution channels for this kind of product. The culture rewards building in public, sharing P&L, and showing your work. Posting an agent's trade history, highlighting moments where Swig blocked a trade that would have gone over limit, showing the RSI signal that triggered a buy — this is exactly the kind of content that performs in that community, and it's easy to generate because the product produces it automatically. The trade feed, block event log, and P&L chart are built to be shareable from day one.

The Phantom and Metaplex integrations are both distribution relationships as much as they are technical integrations. Being in the Phantom ecosystem and the Metaplex agent registry gives x9 exposure to the developer communities around both products. Organic listing on Solana dApp directories and the Colosseum builder community is a low-effort channel that compounds over the first year.

The first 100 users likely come from the Solana DeFi Twitter community, direct outreach to systematic traders, and being visible in the Superteam and Colosseum communities. The product's core loop — deploy, watch it trade, share the results — is inherently demonstrable, which makes referral and word-of-mouth natural.

## Why Solana, Why Now

Solana's sub-400ms block times are not just a marketing number for this use case. They're the difference between acting on a price signal and arriving late to it. When an RSI-14 crosses a threshold on a token moving fast, the window for execution at a useful price is measured in seconds. No other chain provides the combination of speed, finality, and ecosystem liquidity that makes this viable.

Beyond speed, the Solana ecosystem produced the specific primitive stack that x9 needs. Swig's on-chain policy engine. Vanish's privacy routing. Metaplex's agent identity standard. Jupiter's aggregated swap execution. These weren't all available and production-ready eighteen months ago. The timing of this build reflects that — x9 is a product that could only exist in 2026, and it's built to run on infrastructure that only Solana has.

## Team

Damilola Mustapha — builder with experience across AI application development and DeFi product design. x9 protocol is being built for full-time commitment post-hackathon. The thesis is that autonomous agents with cryptographic policy enforcement are not a feature of existing trading platforms but a genuinely new product category, and this is the right moment to define it.

---

GitHub: https://github.com/dmustapha/x9-protocol
Live: https://x9-protocol.vercel.app
