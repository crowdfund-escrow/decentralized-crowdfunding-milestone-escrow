// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrowdfundingEscrow
 * @notice A single contract that manages many crowdfunding campaigns. Contributions are held in
 *         escrow and released to the creator one milestone at a time, only after contributors
 *         approve that milestone by contribution-weighted vote. Failed campaigns are refundable.
 *
 * @dev INTEGRATION CONTRACT — this interface (structs, functions, events) is frozen and shared
 *      with FE and BE. Any change must be announced to the whole team. Rules:
 *      - ETH only. All accounting is in wei. Never use floating point.
 *      - Target and deadline are immutable after creation.
 *      - Milestone allocations must total exactly 100% (use basis points: sum == 10_000).
 *      - Follow checks-effects-interactions and use ReentrancyGuard on every ETH transfer.
 *
 *      This file is a SKELETON. The Blockchain developer (BC) implements the bodies and must not
 *      hand it over until every test in test/CrowdfundingEscrow.t.sol passes.
 */
contract CrowdfundingEscrow is ReentrancyGuard {
    // --- Tunable parameters (agree these before implementing) ---
    uint16 public constant BPS_DENOMINATOR = 10_000; // 100.00%
    uint16 public constant APPROVAL_THRESHOLD_BPS = 5_000; // >50% of votes cast must approve
    uint16 public constant QUORUM_BPS = 5_000; // >=50% of contributed weight must vote
    uint256 public constant VOTING_PERIOD = 3 days;

    // --- Data structures ---
    struct Campaign {
        address creator;
        bytes32 metadataHash; // off-chain title/description/image reference (IPFS or hash)
        uint256 goal; // fundraising target, in wei
        uint256 deadline; // unix timestamp; immutable
        uint256 totalRaised; // in wei
        uint256 released; // total wei released to creator so far
        uint256 milestoneCount;
        bool exists;
    }

    struct Milestone {
        bytes32 evidenceHash; // off-chain evidence reference, set on submission
        uint16 allocationBps; // share of the goal, in basis points; all milestones sum to 10_000
        uint256 submittedAt; // 0 until submitted
        uint256 votesFor; // contribution-weighted
        uint256 votesAgainst; // contribution-weighted
        uint256 weightVoted; // total weight that has voted
        bool released;
    }

    // campaignId => Campaign
    mapping(uint256 => Campaign) public campaigns;
    // campaignId => milestoneIndex => Milestone
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    // campaignId => contributor => amount contributed (wei)
    mapping(uint256 => mapping(address => uint256)) public contributions;
    // campaignId => milestoneIndex => contributor => hasVoted
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;
    // campaignId => contributor => refunded
    mapping(uint256 => mapping(address => bool)) public refunded;

    uint256 public nextCampaignId;

    // --- Events (BE indexes these; keep names and params stable) ---
    event CampaignCreated(
        uint256 indexed campaignId, address indexed creator, uint256 goal, uint256 deadline, bytes32 metadataHash
    );
    event ContributionReceived(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event MilestoneSubmitted(uint256 indexed campaignId, uint256 indexed milestoneIndex, bytes32 evidenceHash);
    event MilestoneVoted(
        uint256 indexed campaignId, uint256 indexed milestoneIndex, address indexed voter, bool support, uint256 weight
    );
    event MilestoneApproved(uint256 indexed campaignId, uint256 indexed milestoneIndex);
    event FundsReleased(uint256 indexed campaignId, uint256 indexed milestoneIndex, uint256 amount);
    event RefundClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount);

    // --- Core functions (BC implements the bodies) ---

    /// @notice Register a campaign. allocationsBps must sum to exactly BPS_DENOMINATOR.
    function createCampaign(
        bytes32 metadataHash,
        uint256 goal,
        uint256 deadline,
        uint16[] calldata allocationsBps,
        bytes32[] calldata milestoneHashes
    ) external returns (uint256 campaignId) {
        revert("not implemented");
    }

    /// @notice Contribute ETH to an open campaign before its deadline.
    function contribute(uint256 campaignId) external payable {
        revert("not implemented");
    }

    /// @notice Creator submits evidence for a milestone, opening its voting period.
    function submitMilestone(uint256 campaignId, uint256 milestoneIndex, bytes32 evidenceHash) external {
        revert("not implemented");
    }

    /// @notice A contributor votes on a submitted milestone; weight = their recorded contribution.
    function voteOnMilestone(uint256 campaignId, uint256 milestoneIndex, bool support) external {
        revert("not implemented");
    }

    /// @notice Release an approved milestone's allocation to the creator. Non-reentrant.
    function releaseMilestoneFunds(uint256 campaignId, uint256 milestoneIndex) external nonReentrant {
        revert("not implemented");
    }

    /// @notice Claim a refund from a campaign that missed its goal by the deadline. Non-reentrant.
    function claimRefund(uint256 campaignId) external nonReentrant {
        revert("not implemented");
    }

    // --- Views ---
    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    function getContribution(uint256 campaignId, address contributor) external view returns (uint256) {
        return contributions[campaignId][contributor];
    }
}
