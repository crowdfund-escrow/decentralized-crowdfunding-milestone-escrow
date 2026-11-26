// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {CrowdfundingEscrow} from "../src/CrowdfundingEscrow.sol";

/**
 * @dev Test skeleton. Each `todo_` test names a REQUIRED behaviour. BC converts these into real
 *      tests and must not hand over the contract until `forge test -vv` is fully green.
 *      Use at least two actors: a creator and a contributor (plus more for voting).
 */
contract CrowdfundingEscrowTest is Test {
    CrowdfundingEscrow internal escrow;

    address internal creator = makeAddr("creator");
    address internal alice = makeAddr("alice"); // contributor
    address internal bob = makeAddr("bob"); // contributor

    function setUp() public {
        escrow = new CrowdfundingEscrow();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    // --- Campaign creation ---
    function todo_test_createCampaign_success() public {}
    function todo_test_createCampaign_rejectsAllocationsNotSummingTo100() public {}
    function todo_test_createCampaign_rejectsPastDeadline() public {}

    // --- Contributions ---
    function todo_test_contribute_recordsAmount() public {}
    function todo_test_contribute_revertsAfterDeadline() public {}
    function todo_test_contribute_revertsForNonexistentCampaign() public {}

    // --- Milestones & escrow ---
    function todo_test_submitMilestone_onlyCreator() public {}
    function todo_test_vote_weightEqualsContribution() public {}
    function todo_test_vote_revertsForNonContributor() public {}
    function todo_test_vote_revertsOnDoubleVote() public {}
    function todo_test_creatorCannotVoteOnOwnMilestone() public {}
    function todo_test_release_revertsBelowQuorumOrThreshold() public {}
    function todo_test_release_transfersAllocationOnApproval() public {}
    function todo_test_release_revertsOnDoubleRelease() public {}
    function todo_test_creatorCannotWithdrawDirectly() public {}

    // --- Refunds ---
    function todo_test_refund_onFailedCampaign() public {}
    function todo_test_refund_revertsOnDoubleClaim() public {}
    function todo_test_refund_revertsOnSuccessfulCampaign() public {}
}
