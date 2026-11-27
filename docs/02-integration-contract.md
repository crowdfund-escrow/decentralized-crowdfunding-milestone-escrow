# Integration Contract (the frozen interface)

This is the single source of truth for how the three code areas connect. Once agreed, treat it as
frozen — any change must be announced to the whole team.

## On-chain interface (from BC)

Contract: **CrowdfundingEscrow** (one contract, many campaigns). ETH only. Sepolia only.

| Function | Purpose |
|----------|---------|
| `createCampaign(metadataHash, goal, deadline, allocationsBps[], milestoneHashes[])` | Register a campaign; allocations sum to 10000 bps |
| `contribute(campaignId)` payable | Contribute ETH before the deadline |
| `submitMilestone(campaignId, index, evidenceHash)` | Creator opens milestone voting |
| `voteOnMilestone(campaignId, index, support)` | Contributor votes; weight = contribution |
| `releaseMilestoneFunds(campaignId, index)` | Release approved allocation to creator |
| `claimRefund(campaignId)` | Refund from a failed campaign |
| `getCampaign(id)` / `getContribution(id, addr)` | Views |

Events (BE indexes these; dedupe on `txHash + logIndex`):
`CampaignCreated, ContributionReceived, MilestoneSubmitted, MilestoneVoted, MilestoneApproved,
FundsReleased, RefundClaimed`.

**To be filled in after deployment:** contract address, ABI location, deployment tx hash.

## API (from BE) — Next.js routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/campaigns` | GET | List campaigns |
| `/api/campaigns` | POST | Save campaign metadata (tied to a confirmed on-chain id + tx) |
| `/api/campaigns/[id]` | GET | Campaign details |
| `/api/campaigns/[id]` | PATCH | Update permitted metadata |
| `/api/campaigns/[id]/milestones` | GET | Campaign milestones |
| `/api/campaigns/[id]/contributions` | GET | Contributions for a campaign |
| `/api/users/[wallet]/contributions` | GET | A user''s contributions |
| `/api/transactions` | GET | Indexed blockchain events |

The backend must **not** record a campaign as on-chain just because a DB row exists — associate it
with the confirmed blockchain campaign id and transaction.

## Data flow

| User action | Frontend | Backend | Blockchain |
|-------------|----------|---------|-----------|
| Create campaign | collects form data | saves metadata | registers campaign |
| Contribute | requests wallet approval | indexes event | receives ETH |
| Submit milestone | shows submission form | stores evidence ref | records submission |
| Vote | sends vote tx | indexes vote | records vote |
| Release funds | shows release action | updates indexed records | transfers ETH |
| Claim refund | shows refund action | records refund event | returns ETH |

## Live deployment (Sepolia)

- **Contract address:** `0x1814bd123576A928b1642D5f56e3329A12789825`
- **Network:** Ethereum Sepolia (chainId 11155111)
- **ABI:** `app/lib/abi/CrowdfundingEscrow.json`
- **RPC note:** deployed via a public RPC; free public nodes are unreliable for sustained writes. For a stable demo use an Alchemy/Infura Sepolia key as `SEPOLIA_RPC_URL` / `NEXT_PUBLIC` provider.

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the address above in `app/.env`.
