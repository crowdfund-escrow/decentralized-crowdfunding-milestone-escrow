// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {CrowdfundingEscrow} from "../src/CrowdfundingEscrow.sol";

/**
 * @dev Deploy to Sepolia:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url sepolia --broadcast --verify --private-key $PRIVATE_KEY
 *
 * The PRIVATE_KEY lives only in contracts/.env (git-ignored) and never in the browser.
 */
contract Deploy is Script {
    function run() external returns (CrowdfundingEscrow escrow) {
        vm.startBroadcast();
        escrow = new CrowdfundingEscrow();
        vm.stopBroadcast();
        console2.log("CrowdfundingEscrow deployed at:", address(escrow));
    }
}
