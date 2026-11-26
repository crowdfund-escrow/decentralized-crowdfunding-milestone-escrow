# Contracts — CrowdfundingEscrow (Foundry)

Owner: **BC (Blockchain developer)**. This is the financial engine of the platform.

## Setup

```bash
cd contracts
# Install Foundry once: https://book.getfoundry.sh/getting-started/installation
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts
cp ../.env.example .env   # fill SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY
forge build
forge test -vv
```

> `lib/` is git-ignored — run the two `forge install` commands after cloning.

## What to implement

`src/CrowdfundingEscrow.sol` is a skeleton with every struct, event, and function signature already
defined (the frozen integration interface). Implement the bodies so that **all** tests in
`test/CrowdfundingEscrow.t.sol` pass. Rename each `todo_test_*` to `test_*` as you implement it.

Key rules (see NatSpec in the contract):

- ETH only; all math in **wei**.
- Milestone allocations sum to exactly `10_000` basis points (100%).
- Contribution-weighted voting; enforce quorum + approval threshold.
- `ReentrancyGuard` + checks-effects-interactions on every ETH transfer.
- The contract must prevent: double voting, non-contributor voting, creator voting on own
  milestone, releasing unapproved funds, double release, and double refunds.

## Deploy & hand over

After `forge test` is green, deploy to Sepolia (see `script/Deploy.s.sol`) and share with FE + BE:
contract **address**, **ABI** (`out/CrowdfundingEscrow.sol/CrowdfundingEscrow.json`), source,
deployment tx hash, and the event/function descriptions. Record them in
[`../docs/02-integration-contract.md`](../docs/02-integration-contract.md).
