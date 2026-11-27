# Decentralized Crowdfunding and Milestone Escrow Platform

> A decentralised crowdfunding platform where people can raise funds for projects, while
> contributors retain visibility and voting rights over how those funds are released
> through **milestones**.

This is a Web3 capstone project. Contributors' ETH is held in a smart-contract **escrow** and
is released to a campaign creator **only as milestones are approved by contributor vote**. If a
campaign fails to reach its target by its deadline, contributors can **claim refunds**. The
blockchain is the source of truth; the database is an indexed, searchable copy of on-chain events.

It is a focused blend of two existing platforms:

- **Giveth** — campaign discovery, presentation, and donation experience.
- **Juicebox** — blockchain transparency and smart-contract-based fund management.
- **Our contribution** — milestone approval, escrow, and refunds.

---

## The four things that must work

Everything else in this repo exists to support these:

1. **Campaign creation** — a creator connects a wallet and registers a campaign (target, deadline, milestones).
2. **ETH contributions** — contributors send ETH, which the contract records and holds.
3. **Milestone-based escrow & release** — funds stay locked until contributors approve a milestone by vote.
4. **Refunds** — contributors reclaim their ETH from unsuccessful campaigns, with no double-claims.

## Explicitly out of scope (do not build)

Multiple chains · multiple currencies · NFTs / reward tokens · DAO governance · recurring
donations · advanced analytics · complex user verification.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React, Tailwind CSS, Ethers.js, MetaMask |
| Backend | Next.js API routes, Prisma, PostgreSQL, Ethers.js (event indexing) |
| Blockchain | Solidity 0.8.20, Foundry, OpenZeppelin, Ethereum **Sepolia** testnet |

Five fixed decisions (the "integration contract"): **one** `CrowdfundingEscrow` contract ·
**ETH only** · **Sepolia only** · contribution-weighted milestone voting with a fixed quorum +
threshold · target & deadline are immutable after launch.

## Repository layout

```
.
├── contracts/     Foundry project — CrowdfundingEscrow.sol, tests, deploy script  (owner: BC)
├── app/           Next.js app — frontend + API routes + Prisma schema             (owner: FE + BE)
│   ├── src/app/   pages & routes
│   ├── lib/       web3 + contract + prisma helpers (shared)
│   └── prisma/    schema.prisma, migrations
├── docs/          project overview, roadmap, integration contract, roles, defence prep
└── .github/       PR + issue templates
```

Next.js serves both the frontend and the API, so there is no separate backend folder.

## Getting started

Each area has its own README with exact steps:

- Smart contracts → [`contracts/README.md`](contracts/README.md)
- Web app (frontend + backend) → [`app/README.md`](app/README.md)

Prerequisites: Node.js 18+, Git, [Foundry](https://book.getfoundry.sh/), PostgreSQL, and the
MetaMask browser extension configured for Sepolia.

```bash
git clone https://github.com/crowdfund-escrow/decentralized-crowdfunding-milestone-escrow.git
cd decentralized-crowdfunding-milestone-escrow
```

## How we work together

We are building **one application with five areas of responsibility**, not five separate projects.
Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before your first commit. In short:

- Every developer works on their own branch; `main` must always build.
- All changes land through **pull requests** — no one overwrites another person's work.
- **Secrets are never committed.** Use `.env` (git-ignored); copy from `.env.example`.
- Start integrating early against the agreed interfaces — don't leave it to the final week.

## Team

| Role | Responsibility |
|------|----------------|
| PM | Coordination, integration, documentation, defence |
| BC | Solidity contract, escrow, milestones, refunds, Foundry tests, Sepolia deployment |
| BE | Prisma schema, PostgreSQL, APIs, blockchain event indexing |
| FE | Website, campaign pages, dashboard, MetaMask integration |
| QA | Test cases, functional + integration testing, bug reports |

See [`docs/03-team-roles.md`](docs/03-team-roles.md) for the full per-role checklists.

## Status

✅ **Live on Sepolia and publicly deployed.** The `CrowdfundingEscrow` contract is deployed at
`0x1814bd123576A928b1642D5f56e3329A12789825` (20 passing Foundry tests; the full create →
contribute → vote → release → refund lifecycle has been exercised on-chain), and the web app runs
on Vercel + Neon with a scheduled event indexer.

- **Live app:** <https://decentralized-crowdfunding-mileston.vercel.app>
- **Contract:** [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x1814bd123576A928b1642D5f56e3329A12789825)
- **Deploy setup:** [`docs/04-deployment.md`](docs/04-deployment.md) · original plan: [`docs/01-roadmap.md`](docs/01-roadmap.md)

## License

[MIT](LICENSE)
