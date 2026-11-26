// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {CrowdfundingEscrow} from "../src/CrowdfundingEscrow.sol";

contract CrowdfundingEscrowTest is Test {
    CrowdfundingEscrow internal escrow;

    address internal creator = makeAddr("creator");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    uint256 internal constant GOAL = 10 ether;
    bytes32 internal constant META = keccak256("ipfs://meta");

    function setUp() public {
        escrow = new CrowdfundingEscrow();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    // --- helpers ---
    function _twoMilestones() internal pure returns (uint256[] memory allocs, bytes32[] memory hashes) {
        allocs = new uint256[](2);
        allocs[0] = 6_000; // 60%
        allocs[1] = 4_000; // 40%
        hashes = new bytes32[](2);
        hashes[0] = keccak256("m0");
        hashes[1] = keccak256("m1");
    }

    function _createCampaign() internal returns (uint256 id) {
        (uint256[] memory allocs, bytes32[] memory hashes) = _twoMilestones();
        vm.prank(creator);
        id = escrow.createCampaign(META, GOAL, block.timestamp + 7 days, allocs, hashes);
    }

    /// Funds the campaign to exactly GOAL: alice 6, bob 4.
    function _createAndFund() internal returns (uint256 id) {
        id = _createCampaign();
        vm.prank(alice);
        escrow.contribute{value: 6 ether}(id);
        vm.prank(bob);
        escrow.contribute{value: 4 ether}(id);
    }

    // --- Campaign creation ---
    function test_createCampaign_success() public {
        uint256 id = _createCampaign();
        assertEq(id, 0);
        CrowdfundingEscrow.Campaign memory c = escrow.getCampaign(id);
        assertEq(c.creator, creator);
        assertEq(c.goal, GOAL);
        assertEq(c.milestoneCount, 2);
        assertTrue(c.exists);
    }

    function test_createCampaign_rejectsAllocationsNotSummingTo100() public {
        uint256[] memory allocs = new uint256[](2);
        allocs[0] = 5_000;
        allocs[1] = 4_000; // sums to 9_000, not 10_000
        bytes32[] memory hashes = new bytes32[](2);
        vm.prank(creator);
        vm.expectRevert("allocations must total 100%");
        escrow.createCampaign(META, GOAL, block.timestamp + 1 days, allocs, hashes);
    }

    function test_createCampaign_rejectsPastDeadline() public {
        (uint256[] memory allocs, bytes32[] memory hashes) = _twoMilestones();
        vm.prank(creator);
        vm.expectRevert("deadline must be in the future");
        escrow.createCampaign(META, GOAL, block.timestamp, allocs, hashes);
    }

    // --- Contributions ---
    function test_contribute_recordsAmount() public {
        uint256 id = _createCampaign();
        vm.prank(alice);
        escrow.contribute{value: 3 ether}(id);
        assertEq(escrow.getContribution(id, alice), 3 ether);
        assertEq(escrow.getCampaign(id).totalRaised, 3 ether);
        assertEq(address(escrow).balance, 3 ether);
    }

    function test_contribute_revertsAfterDeadline() public {
        uint256 id = _createCampaign();
        vm.warp(block.timestamp + 8 days);
        vm.prank(alice);
        vm.expectRevert("campaign has ended");
        escrow.contribute{value: 1 ether}(id);
    }

    function test_contribute_revertsForNonexistentCampaign() public {
        vm.prank(alice);
        vm.expectRevert("campaign does not exist");
        escrow.contribute{value: 1 ether}(999);
    }

    // --- Milestones & escrow ---
    function test_submitMilestone_onlyCreator() public {
        uint256 id = _createAndFund();
        vm.prank(alice);
        vm.expectRevert("only creator");
        escrow.submitMilestone(id, 0, keccak256("ev"));
    }

    function test_submitMilestone_revertsIfNotFunded() public {
        uint256 id = _createCampaign(); // not funded
        vm.prank(creator);
        vm.expectRevert("campaign not funded");
        escrow.submitMilestone(id, 0, keccak256("ev"));
    }

    function test_vote_weightEqualsContribution() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        vm.prank(alice);
        escrow.voteOnMilestone(id, 0, true);
        CrowdfundingEscrow.Milestone memory m = escrow.getMilestone(id, 0);
        assertEq(m.votesFor, 6 ether);
        assertEq(m.weightVoted, 6 ether);
    }

    function test_vote_revertsForNonContributor() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        vm.prank(carol); // never contributed
        vm.expectRevert("not a contributor");
        escrow.voteOnMilestone(id, 0, true);
    }

    function test_vote_revertsOnDoubleVote() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        vm.prank(alice);
        escrow.voteOnMilestone(id, 0, true);
        vm.prank(alice);
        vm.expectRevert("already voted");
        escrow.voteOnMilestone(id, 0, true);
    }

    function test_creatorCannotVoteOnOwnMilestone() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        vm.prank(creator);
        vm.expectRevert("creator cannot vote");
        escrow.voteOnMilestone(id, 0, true);
    }

    function test_release_transfersAllocationOnApproval() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        vm.prank(alice);
        escrow.voteOnMilestone(id, 0, true);
        vm.prank(bob);
        escrow.voteOnMilestone(id, 0, true);

        assertTrue(escrow.isMilestoneApproved(id, 0));

        uint256 before = creator.balance;
        escrow.releaseMilestoneFunds(id, 0);
        assertEq(creator.balance - before, 6 ether); // 60% of 10 ETH
        assertTrue(escrow.getMilestone(id, 0).released);
    }

    function test_release_revertsBelowQuorum() public {
        // total 10 (alice 3, bob 3, carol 4); only alice votes -> weight 3 < 50% quorum
        uint256 id = _createCampaign();
        vm.prank(alice);
        escrow.contribute{value: 3 ether}(id);
        vm.prank(bob);
        escrow.contribute{value: 3 ether}(id);
        vm.prank(carol);
        escrow.contribute{value: 4 ether}(id);

        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        vm.prank(alice);
        escrow.voteOnMilestone(id, 0, true);

        assertFalse(escrow.isMilestoneApproved(id, 0));
        vm.expectRevert("not approved");
        escrow.releaseMilestoneFunds(id, 0);
    }

    function test_release_revertsBelowThreshold() public {
        // all vote but majority against: for 3, against 7
        uint256 id = _createCampaign();
        vm.prank(alice);
        escrow.contribute{value: 3 ether}(id);
        vm.prank(bob);
        escrow.contribute{value: 3 ether}(id);
        vm.prank(carol);
        escrow.contribute{value: 4 ether}(id);

        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        vm.prank(alice);
        escrow.voteOnMilestone(id, 0, true); // 3 for
        vm.prank(bob);
        escrow.voteOnMilestone(id, 0, false); // 3 against
        vm.prank(carol);
        escrow.voteOnMilestone(id, 0, false); // 4 against

        assertFalse(escrow.isMilestoneApproved(id, 0));
        vm.expectRevert("not approved");
        escrow.releaseMilestoneFunds(id, 0);
    }

    function test_release_revertsOnDoubleRelease() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        vm.prank(alice);
        escrow.voteOnMilestone(id, 0, true);
        vm.prank(bob);
        escrow.voteOnMilestone(id, 0, true);

        escrow.releaseMilestoneFunds(id, 0);
        vm.expectRevert("already released");
        escrow.releaseMilestoneFunds(id, 0);
    }

    function test_creatorCannotWithdrawUnapprovedFunds() public {
        uint256 id = _createAndFund();
        vm.prank(creator);
        escrow.submitMilestone(id, 0, keccak256("ev"));
        // no votes -> not approved -> cannot release
        vm.prank(creator);
        vm.expectRevert("not approved");
        escrow.releaseMilestoneFunds(id, 0);
    }

    // --- Refunds ---
    function test_refund_onFailedCampaign() public {
        uint256 id = _createCampaign();
        vm.prank(alice);
        escrow.contribute{value: 2 ether}(id); // below GOAL
        vm.warp(block.timestamp + 8 days); // past deadline, failed

        uint256 before = alice.balance;
        vm.prank(alice);
        escrow.claimRefund(id);
        assertEq(alice.balance - before, 2 ether);
        assertEq(escrow.getContribution(id, alice), 0);
    }

    function test_refund_revertsOnDoubleClaim() public {
        uint256 id = _createCampaign();
        vm.prank(alice);
        escrow.contribute{value: 2 ether}(id);
        vm.warp(block.timestamp + 8 days);

        vm.prank(alice);
        escrow.claimRefund(id);
        vm.prank(alice);
        vm.expectRevert("nothing to refund");
        escrow.claimRefund(id);
    }

    function test_refund_revertsOnSuccessfulCampaign() public {
        uint256 id = _createAndFund(); // reaches GOAL
        vm.warp(block.timestamp + 8 days);
        vm.prank(alice);
        vm.expectRevert("campaign succeeded");
        escrow.claimRefund(id);
    }
}
