// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Auction is Ownable {


    event AuctionCreated(uint256 indexed auctionId, address indexed seller, string productName, uint256 startingBid, uint256 deadline);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 highestBid);
    event FundsWithdrawn(address indexed user, uint256 amount);
    event AuctionCancelled(uint256 indexed auctionId);

    struct auctionItem {
        string productName;
        uint256 deadline;
        bool open;
        address winner;
        address maxBidAddress;
        uint256 maxCurrentBid;
        address seller;
    }

    mapping ( uint256 => mapping (address => uint256)) public bids;
    mapping(uint256 => auctionItem) public auctionList;
    uint256 public currentAuctionId;
    // Pull payments: seller proceeds are credited here, never pushed (a reverting seller can't block endAuction)
    mapping(address => uint256) public pendingProceeds;

    constructor() Ownable(msg.sender) {}

    function getAuction(uint256 _auctionId) external view returns (auctionItem memory) {
        return auctionList[_auctionId];
    }

    function forceCloseAuction(uint256 _auctionId) external onlyOwner {
        auctionItem storage aItem = auctionList[_auctionId];

        require(aItem.open, "Auction is not open");
        // forge-lint: disable-next-line(block-timestamp)
        require(block.timestamp <= aItem.deadline, "Auction is finished");

        aItem.open = false;
        aItem.winner = address(0);
        aItem.maxBidAddress = address(0);

        emit AuctionCancelled(_auctionId);
    }

    function createAuction (string calldata _productName, uint256  _minutesAuction, uint256 _startingBid) public returns(uint256) {
        require(bytes(_productName).length > 2, "Product name cannot be empty");
        require(_minutesAuction > 0, "Auction duration must be at least 1 minute");
        require(_startingBid > 0, "Starting bid must be greater than 0");
        
        uint256 auctionId = currentAuctionId++;
        auctionItem storage aItem = auctionList[auctionId];

        aItem.productName = _productName;
        aItem.deadline = block.timestamp + (_minutesAuction * 1 minutes);
        aItem.open = true;
        aItem.maxCurrentBid = _startingBid;
        aItem.seller = msg.sender;

        emit AuctionCreated(auctionId, aItem.seller, aItem.productName, aItem.maxCurrentBid, aItem.deadline);

        return auctionId;
    }

    function makeBid(uint256 _auctionId) external payable {
        auctionItem storage aItem = auctionList[_auctionId];

        require(aItem.open, "Auction is not open");
        // forge-lint: disable-next-line(block-timestamp)
        require(block.timestamp <= aItem.deadline, "Auction is finished");
        require(msg.sender != aItem.seller, "Seller cannot bid");
        if (aItem.maxBidAddress == address(0)) {
            require(msg.value >= aItem.maxCurrentBid, "Bid must be at least the starting bid");
        } else {
            require(msg.value > aItem.maxCurrentBid, "Bid must be greater than current highest bid");
        }
        require(bids[_auctionId][msg.sender] == 0, "You can not bid twice");

        aItem.maxBidAddress = msg.sender;
        aItem.maxCurrentBid = msg.value;

        bids[_auctionId][msg.sender] = msg.value;

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }


    function endAuction(uint256 _auctionId) external {
        auctionItem storage aItem = auctionList[_auctionId];
    
        require(aItem.open, "Auction already closed");
        // forge-lint: disable-next-line(block-timestamp)
        require(block.timestamp > aItem.deadline, "Auction is not finished");
    
        aItem.open = false;
        aItem.winner = aItem.maxBidAddress;
    
        emit AuctionEnded(_auctionId, aItem.winner, aItem.maxCurrentBid);
    
        // Credit the seller only if there was at least one bidder
        if (aItem.winner != address(0)) {
            pendingProceeds[aItem.seller] += aItem.maxCurrentBid;
        }
    }

    function withdrawProceeds() external {
        uint256 amount = pendingProceeds[msg.sender];
        require(amount > 0, "No proceeds to withdraw");

        pendingProceeds[msg.sender] = 0;

        emit FundsWithdrawn(msg.sender, amount);

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    function withdrawBids(uint256 _auctionId) external {
        auctionItem storage aItem = auctionList[_auctionId];
    
        // Bidders can withdraw if deadline passed OR if auction was force-closed
        // forge-lint: disable-next-line(block-timestamp)
        require(!aItem.open || block.timestamp > aItem.deadline, "Auction is still active");
        require(msg.sender != aItem.maxBidAddress, "Winner cannot withdraw");

        uint256 refundAmount = bids[_auctionId][msg.sender];
        require(refundAmount > 0, "No funds to withdraw");

        bids[_auctionId][msg.sender] = 0;

        emit FundsWithdrawn(msg.sender, refundAmount);

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Transfer failed");
    }

    function getWinner(uint256 _auctionId) external view returns (address) {
        auctionItem storage aItem = auctionList[_auctionId];
        // forge-lint: disable-next-line(block-timestamp)
        require(block.timestamp > aItem.deadline, "Auction is not finished");
        return aItem.maxBidAddress;
    }

    

}