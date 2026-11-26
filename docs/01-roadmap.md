# Roadmap — 8 stages, ~28 days

Frontend and backend can start early against the agreed interfaces + mock data. These are
milestones, not a requirement that everyone waits for the previous stage.

| Stage | Days | Focus | Deliverable |
|-------|------|-------|-------------|
| 1 | 1-2  | Setup & architecture | Dev environment ready; interfaces agreed |
| 2 | 3-7  | Smart contract | Functional CrowdfundingEscrow contract |
| 3 | 8-9  | Contract testing | Passing Foundry test suite |
| 4 | 10-13| Backend | APIs + Prisma + PostgreSQL + event indexing |
| 5 | 14-19| Frontend | Responsive website (home, explore, detail, create, dashboard) |
| 6 | 20-22| Wallet & chain integration | FE talks to the deployed Sepolia contract |
| 7 | 23-25| End-to-end testing | Working full lifecycle; bugs fixed |
| 8 | 26-28| Deploy & docs | Sepolia + Vercel live, docs, demo, evidence |

## Definition of done (the demo must show)

Creator connects MetaMask -> creates a campaign -> another wallet contributes ETH -> progress
updates -> funds stay in the contract -> creator submits milestone evidence -> contributors vote ->
approved funds release -> a failed campaign refunds contributors -> transaction history displays ->
all on Sepolia.
