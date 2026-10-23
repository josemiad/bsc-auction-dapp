    // SPDX-License-Identifier: MIT
    pragma solidity 0.8.34;
    
    import "forge-std/Script.sol";
    import "../src/auction.sol";
    
    contract DeployAuction is Script {
        function run() external returns (Auction) {
            // Reads PRIVATE_KEY directly from .env as a uint256
            uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
            vm.startBroadcast(deployerPrivateKey);
    
            // Deploy the Auction contract
            Auction auction = new Auction();

            vm.stopBroadcast();

            console.log("Auction deployed to:", address(auction));
            return auction;
        }
    }