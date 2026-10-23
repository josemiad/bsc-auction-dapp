// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import "forge-std/Test.sol";
import "../src/auction.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RejectEther {
    function create(Auction auction, string memory name, uint256 duration, 
                    uint256 startingBid) external returns (uint256) {
        return auction.createAuction(name, duration, startingBid);
    }

    function bid(Auction auction, uint256 auctionId) external payable {
        auction.makeBid{value: msg.value}(auctionId);
    }

    function withdraw(Auction auction, uint256 auctionId) external {
        auction.withdrawBids(auctionId);
    }

    function withdrawProceeds(Auction auction) external {
        auction.withdrawProceeds();
    }

    receive() external payable {
        revert("Reject ETH");
    }
}

contract AuctionTest is Test {
    Auction public auction;
    address testOwner = address(1);
    address testSeller = address(2);
    address testBidder1 = address(3);
    address testBidder2 = address(4);
    string testProductName = "Test product";
    uint256 testMinutesAuction = 10;
    uint256 testStartingBid = 2 ether;

    function setUp() public {
        vm.startPrank(testOwner);
        auction = new Auction();
        vm.stopPrank();
    }

    function test_getAuction_empty() public view {
        Auction.auctionItem memory aItem = auction.getAuction(0);

        assertEq(aItem.productName, "");
        assertEq(aItem.deadline, 0);
        assertEq(aItem.open, false);
        assertEq(aItem.winner, address(0));
        assertEq(aItem.maxBidAddress, address(0));
        assertEq(aItem.maxCurrentBid, 0);
        assertEq(aItem.seller, address(0));
    }

    function test_getAuction_notEmpty() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        Auction.auctionItem memory aItem = auction.getAuction(auctionId);

        assertEq(aItem.productName, testProductName);
        assertEq(aItem.deadline, block.timestamp + (testMinutesAuction * 1 minutes));
        assertEq(aItem.open, true);
        assertEq(aItem.winner, address(0));
        assertEq(aItem.maxBidAddress, address(0));
        assertEq(aItem.maxCurrentBid, testStartingBid);
        assertEq(aItem.seller, testSeller);
    }

    function test_forceCloseAuction_requireAuctionOpen() external {
        vm.startPrank(testOwner);
        vm.expectRevert("Auction is not open");
        auction.forceCloseAuction(0);
        vm.stopPrank();
    }

    function test_forceCloseAuction_requireOnlyOwner() external {
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector, 
                address(this)
            )
        );
        auction.forceCloseAuction(0);
    }

    function test_forceCloseAuction_success() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testOwner);
        auction.forceCloseAuction(auctionId);
        vm.stopPrank();
    }

    function test_forceCloseAuction_requireAuctionNotFinished() external {
        vm.prank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);

        vm.warp(block.timestamp + ((testMinutesAuction + 1) * 1 minutes));
        vm.prank(testOwner);
        vm.expectRevert("Auction is finished");
        auction.forceCloseAuction(auctionId);
    }

    function test_createAuction_requireProductNameMinimumLenght() public {
        vm.expectRevert("Product name cannot be empty");
        auction.createAuction("", 0, 0);
    }

    function test_createAuction_requireDurationMoreThanFiveMinutes() public {
        vm.expectRevert("Auction duration must be at least 1 minute");
        auction.createAuction(testProductName, 0, 0);
    }


    function test_createAuction_requireStartingBidMoreThanZero() public {
        vm.expectRevert("Starting bid must be greater than 0");
        auction.createAuction(testProductName, testMinutesAuction, 0);
    }

    function test_createAuction_success() public {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);

        Auction.auctionItem memory aItem = auction.getAuction(auctionId);

        assertEq(aItem.productName, testProductName);
        assertEq(aItem.maxCurrentBid, testStartingBid);
        assertEq(aItem.seller, testSeller);
        assertEq(aItem.deadline, block.timestamp + (testMinutesAuction * 1 minutes));
        assertTrue(aItem.open);

        vm.stopPrank();
    }

    function test_makeBid_requireAuctionOpen() external {
        vm.expectRevert("Auction is not open");
        auction.makeBid(0);
    }

    function test_makeBid_requireAuctionIsNotFinished() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.warp(block.timestamp + ((testMinutesAuction + 1) * 1 minutes));
        vm.expectRevert("Auction is finished");
        auction.makeBid(auctionId);

    }

    function test_makeBid_requireNotSeller() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);

        vm.expectRevert("Seller cannot bid");
        auction.makeBid(auctionId);

        vm.stopPrank(); 
    }

    function test_makeBid_requireMoreThanCurrentBid() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testBidder1);
        vm.deal(testBidder1, testStartingBid + (1 ether)); // 1 ether = 1 BNB in BSC/EVM
        vm.expectRevert("Bid must be at least the starting bid");
        auction.makeBid{value: testStartingBid - (1 ether)}(auctionId);

        // Success call for next check
        auction.makeBid{value: testStartingBid + (1 ether)}(auctionId);
        vm.stopPrank();


        vm.startPrank(testBidder2);
        vm.deal(testBidder2, testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        vm.expectRevert("Bid must be greater than current highest bid");
        auction.makeBid{value: testStartingBid - (1 ether)}(auctionId);

        vm.stopPrank();
    }

    function test_makeBid_requireNotBidTwice() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testBidder1);
        vm.deal(testBidder1, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        // Success call
        auction.makeBid{value: testStartingBid + (1 ether)}(auctionId);
        // Second call
        vm.expectRevert("You can not bid twice");
        auction.makeBid{value: testStartingBid + (2 ether)}(auctionId);
        vm.stopPrank();
    }

    function test_makeBid_success() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testBidder1);
        vm.deal(testBidder1, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        auction.makeBid{value: testStartingBid + (1 ether)}(auctionId);

        Auction.auctionItem memory aItem = auction.getAuction(auctionId);
        assertEq(aItem.maxBidAddress, testBidder1);
        assertEq(aItem.maxCurrentBid, testStartingBid + (1 ether));
        assertEq(auction.bids(auctionId, testBidder1), testStartingBid + (1 ether));
        vm.stopPrank();
    }

    function test_endAuction_requireAuctionOpen() external {
        vm.expectRevert("Auction already closed");
        auction.endAuction(0);
    }

    function test_endAuction_requireAuctionNotFinished() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.expectRevert("Auction is not finished");
        auction.endAuction(auctionId);
    }

    // A seller that rejects ETH must not block the auction from closing
    function test_endAuction_rejectingSellerDoesNotBlock() public {
        RejectEther rejectSeller = new RejectEther();
        uint256 auctionId = rejectSeller.create(auction, "Item", 10, 1 ether);

        vm.deal(testBidder1, 2 ether);
        vm.prank(testBidder1);
        auction.makeBid{value: 1 ether}(auctionId);

        vm.warp(block.timestamp + 11 minutes);
        auction.endAuction(auctionId);

        assertEq(auction.getAuction(auctionId).winner, testBidder1);
        assertEq(auction.pendingProceeds(address(rejectSeller)), 1 ether);
    }

    function test_endAuction_success() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testBidder1);
        vm.deal(testBidder1, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        uint256 bidValue = testStartingBid + (1 ether);
        auction.makeBid{value: bidValue}(auctionId);
        vm.stopPrank();

        vm.warp(block.timestamp + ((testMinutesAuction + 1) * 1 minutes));
        uint256 testSellerBalanceBefore = testSeller.balance;
        auction.endAuction(auctionId);

        Auction.auctionItem memory aItem = auction.getAuction(auctionId);

        assert(!aItem.open);
        assertEq(aItem.winner, testBidder1);
        // Pull payment: nothing sent yet, only credited
        assertEq(testSeller.balance, testSellerBalanceBefore);
        assertEq(auction.pendingProceeds(testSeller), bidValue);
    }

    function test_withdrawProceeds_requireHaveProceeds() external {
        vm.prank(testSeller);
        vm.expectRevert("No proceeds to withdraw");
        auction.withdrawProceeds();
    }

    function test_withdrawProceeds_requireTransferSuccess() external {
        RejectEther rejectSeller = new RejectEther();
        uint256 auctionId = rejectSeller.create(auction, "Item", 10, 1 ether);

        vm.deal(testBidder1, 2 ether);
        vm.prank(testBidder1);
        auction.makeBid{value: 1 ether}(auctionId);

        vm.warp(block.timestamp + 11 minutes);
        auction.endAuction(auctionId);

        vm.expectRevert("Transfer failed");
        rejectSeller.withdrawProceeds(auction);
    }

    function test_withdrawProceeds_success() external {
        vm.prank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);

        vm.deal(testBidder1, testStartingBid);
        vm.prank(testBidder1);
        auction.makeBid{value: testStartingBid}(auctionId);

        vm.warp(block.timestamp + ((testMinutesAuction + 1) * 1 minutes));
        auction.endAuction(auctionId);

        uint256 balanceBefore = testSeller.balance;
        vm.prank(testSeller);
        auction.withdrawProceeds();

        assertEq(testSeller.balance, balanceBefore + testStartingBid);
        assertEq(auction.pendingProceeds(testSeller), 0);
    }


    function test_withdrawBids_requireNotOpenOrFinished() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.expectRevert("Auction is still active");
        auction.withdrawBids(auctionId);
    }

    function test_withdrawBids_requireNotWinner() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testBidder1);
        vm.deal(testBidder1, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        uint256 bidValue = testStartingBid + (1 ether);
        auction.makeBid{value: bidValue}(auctionId);
        

        vm.warp(block.timestamp + ((testMinutesAuction + 1) * 1 minutes));
        auction.endAuction(auctionId);

        vm.expectRevert("Winner cannot withdraw");
        auction.withdrawBids(auctionId);
        vm.stopPrank();
    }

    function test_withdrawBids_requireHaveFunds() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testBidder1);
        vm.deal(testBidder1, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        uint256 bidValue = testStartingBid + (1 ether);
        auction.makeBid{value: bidValue}(auctionId);
        vm.stopPrank();
        

        vm.warp(block.timestamp + ((testMinutesAuction + 1) * 1 minutes));
        auction.endAuction(auctionId);

        vm.startPrank(testBidder2);
        vm.expectRevert("No funds to withdraw");
        auction.withdrawBids(auctionId);
        vm.stopPrank();
    }

    function test_withdrawBids_requireTransferSuccess() public {
        RejectEther rejectBidder = new RejectEther();
        vm.prank(testSeller);
        uint256 auctionId = auction.createAuction("Item", 10, 1 ether);

        vm.deal(address(rejectBidder), 2 ether);
        rejectBidder.bid{value: 1 ether}(auction, auctionId);

        vm.deal(testBidder2, 3 ether);
        vm.prank(testBidder2);
        auction.makeBid{value: 2 ether}(auctionId);

        vm.warp(block.timestamp + 11 minutes);
        auction.endAuction(auctionId);

        vm.expectRevert("Transfer failed");
        rejectBidder.withdraw(auction, auctionId);
    }

    function test_withdrawBids_success() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testBidder1);
        vm.deal(testBidder1, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        uint256 bidValue1 = testStartingBid + (1 ether);
        auction.makeBid{value: bidValue1}(auctionId);
        vm.stopPrank();

        vm.startPrank(testBidder2);
        vm.deal(testBidder2, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        uint256 bidValue2 = testStartingBid + (2 ether);
        auction.makeBid{value: bidValue2}(auctionId);
        vm.stopPrank();
        

        vm.warp(block.timestamp + ((testMinutesAuction + 1) * 1 minutes));
        auction.endAuction(auctionId);

        vm.startPrank(testBidder1);
        uint256 bidder1BalanceBefore = testBidder1.balance;
        auction.withdrawBids(auctionId);
        uint256 bidder1BalanceAfter = testBidder1.balance;

        assertEq(bidder1BalanceBefore+bidValue1, bidder1BalanceAfter);
        assertEq(0, auction.bids(auctionId, testBidder1));
    }

    function test_getWinner_requireAuctionFinished() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.expectRevert("Auction is not finished");
        auction.getWinner(auctionId);
    }

    function test_getWinner_success() external {
        vm.startPrank(testSeller);
        uint256 auctionId = auction.createAuction(testProductName, testMinutesAuction, testStartingBid);
        vm.stopPrank();

        vm.startPrank(testBidder1);
        vm.deal(testBidder1, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        uint256 bidValue1 = testStartingBid + (1 ether);
        auction.makeBid{value: bidValue1}(auctionId);
        vm.stopPrank();

        vm.startPrank(testBidder2);
        vm.deal(testBidder2, 5 * testStartingBid); // 1 ether = 1 BNB in BSC/EVM
        uint256 bidValue2 = testStartingBid + (2 ether);
        auction.makeBid{value: bidValue2}(auctionId);
        vm.stopPrank();

        vm.warp(block.timestamp + ((testMinutesAuction + 1) * 1 minutes));
        auction.endAuction(auctionId);

        address winner = auction.getWinner(auctionId);
        assertEq(winner, testBidder2);
    }

}