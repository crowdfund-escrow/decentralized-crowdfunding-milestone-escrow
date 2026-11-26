// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrowdfundingEscrow
 * @notice One contract managing many crowdfunding campaigns. Contributions are held in escrow and
 *         released to the creator one milestone at a time, only after contributors approve that
 *         milestone by contribution-weighted vote. Campaigns that miss their goal are refundable.
 *
 * @dev Design decisions (the frozen integration contract — announce any change to the team):
 *      - ETH only; all accounting in wei.
 *      - Target & deadline are immutable after creation.
 *      - Milestone allocations are basis points summing to exactly 10_000 (100%).
 *      - A campaign is "successful" once totalRaised >= goal. Only successful campaigns enter the
 *        milestone/release flow; each milestone releases allocationBps/10_000 of totalRaised, so
 *        the sum of all releases equals the escrow balance exactly.
 *      - A campaign is "failed" once block.timestamp > deadline && totalRaised < goal. Only failed
 *        campaigns are refundable; each contributor reclaims their own recorded contribution once.
 *      - Voting weight = the voter's recorded contribution. Quorum = share of total contributed
 *        weight that must vote; threshold = share of cast weight that must approve.
 *      - checks-effects-interactions + ReentrancyGuard on every ETH transfer.
 */
contract CrowdfundingEscrow is ReentrancyGuard {
    // --- Parameters ---
    uint256 public constant BPS_DENOMINATOR = 10_000; // 100.00%
    uint256 public constant APPROVAL_THRESHOLD_BPS = 5_000; // >=50% of cast weight must approve
    uint256 public constant QUORUM_BPS = 5_000; // >=50% of contributed weight must vote
    uint256 public constant VOTING_PERIOD = 3 days; // informational minimum voting window

    // --- Data structures ---
    struct Campaign {
        address creator;
        bytes32 metadataHash;
        uint256 goal;
        uint256 deadline;
        uint256 totalRaised;
        uint256 released;
        uint256 milestoneCount;
        bool exists;
    }

    struct Milestone {
        bytes32 evidenceHash;
        uint256 allocationBps;
        uint256 submittedAt;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 weightVoted;
        bool released;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public refunded;

    uint256 public nextCampaignId;

    // --- Events ---
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

    // --- Campaign creation ---
    function createCampaign(
        bytes32 metadataHash,
        uint256 goal,
        uint256 deadline,
        uint256[] calldata allocationsBps,
        bytes32[] calldata milestoneHashes
    ) external returns (uint256 campaignId) {
        require(goal > 0, "goal must be > 0");
        require(deadline > block.timestamp, "deadline must be in the future");
        require(allocationsBps.length > 0, "need >= 1 milestone");
        require(allocationsBps.length == milestoneHashes.length, "length mismatch");

        uint256 sum;
        for (uint256 i = 0; i < allocationsBps.length; i++) {
            require(allocationsBps[i] > 0, "allocation must be > 0");
            sum += allocationsBps[i];
        }
        require(sum == BPS_DENOMINATOR, "allocations must total 100%");

        campaignId = nextCampaignId++;
        Campaign storage c = campaigns[campaignId];
        c.creator = msg.sender;
        c.metadataHash = metadataHash;
        c.goal = goal;
        c.deadline = deadline;
        c.milestoneCount = allocationsBps.length;
        c.exists = true;

        for (uint256 i = 0; i < allocationsBps.length; i++) {
            milestones[campaignId][i].allocationBps = allocationsBps[i];
            milestones[campaignId][i].evidenceHash = milestoneHashes[i];
        }

        emit CampaignCreated(campaignId, msg.sender, goal, deadline, metadataHash);
    }

    // --- Contributions ---
    function contribute(uint256 campaignId) external payable {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "campaign does not exist");
        require(block.timestamp <= c.deadline, "campaign has ended");
        require(msg.value > 0, "contribution must be > 0");

        c.totalRaised += msg.value;
        contributions[campaignId][msg.sender] += msg.value;

        emit ContributionReceived(campaignId, msg.sender, msg.value);
    }

    // --- Milestones & escrow ---
    function submitMilestone(uint256 campaignId, uint256 milestoneIndex, bytes32 evidenceHash) external {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "campaign does not exist");
        require(msg.sender == c.creator, "only creator");
        require(milestoneIndex < c.milestoneCount, "bad milestone index");
        require(c.totalRaised >= c.goal, "campaign not funded");

        Milestone storage m = milestones[campaignId][milestoneIndex];
        require(!m.released, "already released");

        m.evidenceHash = evidenceHash;
        m.submittedAt = block.timestamp;

        emit MilestoneSubmitted(campaignId, milestoneIndex, evidenceHash);
    }

    function voteOnMilestone(uint256 campaignId, uint256 milestoneIndex, bool support) external {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "campaign does not exist");
        require(msg.sender != c.creator, "creator cannot vote");

        uint256 weight = contributions[campaignId][msg.sender];
        require(weight > 0, "not a contributor");

        Milestone storage m = milestones[campaignId][milestoneIndex];
        require(m.submittedAt != 0, "milestone not submitted");
        require(!m.released, "already released");
        require(!hasVoted[campaignId][milestoneIndex][msg.sender], "already voted");

        hasVoted[campaignId][milestoneIndex][msg.sender] = true;
        m.weightVoted += weight;
        if (support) {
            m.votesFor += weight;
        } else {
            m.votesAgainst += weight;
        }

        emit MilestoneVoted(campaignId, milestoneIndex, msg.sender, support, weight);

        if (_isApproved(c, m)) {
            emit MilestoneApproved(campaignId, milestoneIndex);
        }
    }

    function releaseMilestoneFunds(uint256 campaignId, uint256 milestoneIndex) external nonReentrant {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "campaign does not exist");
        require(c.totalRaised >= c.goal, "campaign not funded");

        Milestone storage m = milestones[campaignId][milestoneIndex];
        require(m.submittedAt != 0, "milestone not submitted");
        require(!m.released, "already released");
        require(_isApproved(c, m), "not approved");

        uint256 amount = (c.totalRaised * m.allocationBps) / BPS_DENOMINATOR;
        require(c.released + amount <= c.totalRaised, "exceeds escrow");

        // effects before interaction
        m.released = true;
        c.released += amount;

        emit FundsReleased(campaignId, milestoneIndex, amount);

        (bool ok,) = payable(c.creator).call{value: amount}("");
        require(ok, "transfer failed");
    }

    // --- Refunds ---
    function claimRefund(uint256 campaignId) external nonReentrant {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "campaign does not exist");
        require(block.timestamp > c.deadline, "campaign still open");
        require(c.totalRaised < c.goal, "campaign succeeded");

        uint256 amount = contributions[campaignId][msg.sender];
        require(amount > 0, "nothing to refund");
        require(!refunded[campaignId][msg.sender], "already refunded");

        // effects before interaction
        refunded[campaignId][msg.sender] = true;
        contributions[campaignId][msg.sender] = 0;

        emit RefundClaimed(campaignId, msg.sender, amount);

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "transfer failed");
    }

    // --- Views ---
    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    function getMilestone(uint256 campaignId, uint256 milestoneIndex) external view returns (Milestone memory) {
        return milestones[campaignId][milestoneIndex];
    }

    function getContribution(uint256 campaignId, address contributor) external view returns (uint256) {
        return contributions[campaignId][contributor];
    }

    function isMilestoneApproved(uint256 campaignId, uint256 milestoneIndex) external view returns (bool) {
        return _isApproved(campaigns[campaignId], milestones[campaignId][milestoneIndex]);
    }

    // --- Internal ---
    function _isApproved(Campaign storage c, Milestone storage m) internal view returns (bool) {
        if (m.submittedAt == 0 || m.weightVoted == 0) return false;
        bool quorum = m.weightVoted * BPS_DENOMINATOR >= c.totalRaised * QUORUM_BPS;
        bool threshold = m.votesFor * BPS_DENOMINATOR >= m.weightVoted * APPROVAL_THRESHOLD_BPS;
        return quorum && threshold;
    }
}
