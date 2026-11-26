# Team roles & sign-off checklists

| Role | Responsibility |
|------|----------------|
| PM | Requirements, coordination, integration, documentation, defence |
| BC | Solidity contract, escrow, milestones, refunds, Foundry tests, Sepolia deployment |
| BE | Prisma schema, PostgreSQL, APIs, blockchain event indexing |
| FE | Website, campaign pages, dashboard, MetaMask integration |
| QA | Test cases, functional + integration testing, bug reports |

## Sign-off (project is defence-ready at 22/22)

**BC** — contract compiles; all Foundry tests pass; deployed to Sepolia; ABI + address handed over.
**BE** — migrations work; all APIs work; events indexed; DB reconciles with chain.
**FE** — all pages complete; MetaMask works; create + contribute flows work; responsive.
**QA** — creation, contribution/escrow, milestone voting/release, refunds + security edge cases
tested; end-to-end report done.
**PM** — components integrated; app deployed + smoke-tested; repo complete; docs + slides ready;
demo rehearsed.

## The one coordination rule

BC shares the contract functions, ABI, and data structures **early** so FE and BE develop against
the same spec. Start integrating as soon as interfaces exist — not in the final week.
