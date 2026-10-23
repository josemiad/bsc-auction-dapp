import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { AUCTION_CONTRACT_ADDRESS, AuctionABI, BSC_TESTNET_CONFIG } from '../contracts/contractConfig';

export function useAuctionContract(account) {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionPending, setActionPending] = useState(false);
    const [lastTxHash, setLastTxHash] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [pendingProceeds, setPendingProceeds] = useState(0n);

    // 1. Read-Only Contract instance (using public BSC Testnet RPC)
    const getReadOnlyContract = useCallback(() => {
        if (!AUCTION_CONTRACT_ADDRESS || AUCTION_CONTRACT_ADDRESS === ethers.ZeroAddress) {
            return null;
        }
        const rpcUrl = BSC_TESTNET_CONFIG.rpcUrls[0];
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        return new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AuctionABI, provider);
    }, []);

    // 2. Signer Contract instance (via MetaMask)
    const getSignerContract = useCallback(async () => {
        if (!window.ethereum) throw new Error('MetaMask is not available');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AuctionABI, signer);
    }, []);

    // 3. Fetch all auctions from the blockchain
    const fetchAuctions = useCallback(async () => {
    try {
        const contract = getReadOnlyContract();
        if (!contract) {
        setAuctions([]);
        setLoading(false);
        return;
        }

        const totalCountBn = await contract.currentAuctionId();
        const totalCount = Number(totalCountBn);
        const items = [];

        for (let i = 0; i < totalCount; i++) {
        const item = await contract.getAuction(i);
        let userBid = 0n;
        if (account) {
            userBid = await contract.bids(i, account);
        }

        items.push({
            id: i,
            productName: item.productName,
            deadline: Number(item.deadline),
            open: item.open,
            winner: item.winner,
            maxBidAddress: item.maxBidAddress,
            maxCurrentBid: item.maxCurrentBid,
            seller: item.seller,
            userBid: userBid,
        });
        }

        // Newest auctions first
        setAuctions(items.reverse());

        // Fetch seller pending proceeds if account is connected
        if (account) {
          try {
            const proceeds = await contract.pendingProceeds(account);
            setPendingProceeds(proceeds);
          } catch (proceedsErr) {
            console.error('Error fetching pending proceeds:', proceedsErr);
          }
        } else {
          setPendingProceeds(0n);
        }
    } catch (err) {
        console.error('Error fetching auctions:', err);
    } finally {
        setLoading(false);
    }
    }, [getReadOnlyContract, account]);

    // Extract clean error message from Solidity revert reasons
    const handleContractError = (err) => {
        console.error('Contract execution error:', err);
        let reason = 'Transaction failed';
        if (err.reason) {
            reason = err.reason;
        } else if (err.data && err.data.message) {
            reason = err.data.message;
        } else if (err.message && err.message.includes('user rejected action')) {
            reason = 'Transaction was rejected in MetaMask';
        } else if (err.message) {
            reason = err.message;
        }
        setErrorMsg(reason);
    };

    // --- Contract Actions ---

    // Create a new auction
    const createAuction = async (productName, minutesDuration, startingBidBnb) => {
        setActionPending(true);
        setErrorMsg(null);
        try {
            const contract = await getSignerContract();
            const startingBidWei = ethers.parseEther(startingBidBnb.toString());
            const tx = await contract.createAuction(productName, minutesDuration, startingBidWei);
            setLastTxHash(tx.hash);
            await tx.wait(); // wait for BSC Testnet block confirmation
            await fetchAuctions();
            return tx;
        } catch (err) {
            handleContractError(err);
            throw err;
        } finally {
            setActionPending(false);
        }
    };

    // Place a bid
    const makeBid = async (auctionId, bidAmountBnb) => {
        setActionPending(true);
        setErrorMsg(null);
        try {
            const contract = await getSignerContract();
            const bidWei = ethers.parseEther(bidAmountBnb.toString());
            // Sending native BNB requires passing { value: bidWei } in ethers.js
            const tx = await contract.makeBid(auctionId, { value: bidWei });
            setLastTxHash(tx.hash);
            await tx.wait();
            await fetchAuctions();
            return tx;
        } catch (err) {
            handleContractError(err);
            throw err;
        } finally {
            setActionPending(false);
        }
    };

    // Finalize/End an auction
    const endAuction = async (auctionId) => {
        setActionPending(true);
        setErrorMsg(null);
        try {
            const contract = await getSignerContract();
            const tx = await contract.endAuction(auctionId);
            setLastTxHash(tx.hash);
            await tx.wait();
            await fetchAuctions();
            return tx;
        } catch (err) {
            handleContractError(err);
            throw err;
        } finally {
            setActionPending(false);
        }
    };

    // Non-winner refund withdrawal
    const withdrawBids = async (auctionId) => {
        setActionPending(true);
        setErrorMsg(null);
        try {
            const contract = await getSignerContract();
            const tx = await contract.withdrawBids(auctionId);
            setLastTxHash(tx.hash);
            await tx.wait();
            await fetchAuctions();
            return tx;
        } catch (err) {
            handleContractError(err);
            throw err;
        } finally {
            setActionPending(false);
        }
    };

    // Seller proceeds withdrawal
    const withdrawProceeds = async () => {
        setActionPending(true);
        setErrorMsg(null);
        try {
            const contract = await getSignerContract();
            const tx = await contract.withdrawProceeds();
            setLastTxHash(tx.hash);
            await tx.wait();
            await fetchAuctions();
            return tx;
        } catch (err) {
            handleContractError(err);
            throw err;
        } finally {
            setActionPending(false);
        }
    };

    // 4. Real-Time Blockchain Event Subscriptions
    useEffect(() => {
    fetchAuctions();

    const contract = getReadOnlyContract();
        if (!contract) return;

        const onAuctionCreated = () => fetchAuctions();
        const onBidPlaced = () => fetchAuctions();
        const onAuctionEnded = () => fetchAuctions();
        const onFundsWithdrawn = () => fetchAuctions();

        contract.on('AuctionCreated', onAuctionCreated);
        contract.on('BidPlaced', onBidPlaced);
        contract.on('AuctionEnded', onAuctionEnded);
        contract.on('FundsWithdrawn', onFundsWithdrawn);

        return () => {
            contract.off('AuctionCreated', onAuctionCreated);
            contract.off('BidPlaced', onBidPlaced);
            contract.off('AuctionEnded', onAuctionEnded);
            contract.off('FundsWithdrawn', onFundsWithdrawn);
        };
    }, [fetchAuctions, getReadOnlyContract]);

    return {
        auctions,
        loading,
        actionPending,
        lastTxHash,
        errorMsg,
        clearError: () => setErrorMsg(null),
        clearTx: () => setLastTxHash(null),
        fetchAuctions,
        createAuction,
        makeBid,
        endAuction,
        withdrawBids,
        pendingProceeds,
        withdrawProceeds,
    };
}