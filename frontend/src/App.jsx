import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AuctionGrid from './components/AuctionGrid';
import CreateAuctionModal from './components/CreateAuctionModal';
import BidModal from './components/BidModal';
import NotificationToast from './components/NotificationToast';
import { useWallet } from './hooks/useWallet';
import { useAuctionContract } from './hooks/useAuctionContract';
import { formatBnb } from './utils/formatters';
import { Coins, ArrowDownLeft } from 'lucide-react';

export default function App() {
  const wallet = useWallet();
  const auctionContract = useAuctionContract(wallet.account);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBidAuction, setSelectedBidAuction] = useState(null);
  const [withdrawingProceeds, setWithdrawingProceeds] = useState(false);

  // Wrapper handlers that trigger the transaction and refresh wallet balance
  const handleCreateAuction = async (name, duration, startBid) => {
    await auctionContract.createAuction(name, duration, startBid);
    wallet.refreshBalance();
  };

  const handleMakeBid = async (auctionId, amount) => {
    await auctionContract.makeBid(auctionId, amount);
    wallet.refreshBalance();
  };

  const handleEndAuction = async (auctionId) => {
    await auctionContract.endAuction(auctionId);
    wallet.refreshBalance();
  };

  const handleWithdrawRefund = async (auctionId) => {
    await auctionContract.withdrawBids(auctionId);
    wallet.refreshBalance();
  };

  const handleWithdrawProceeds = async () => {
    try {
      setWithdrawingProceeds(true);
      await auctionContract.withdrawProceeds();
      wallet.refreshBalance();
    } finally {
      setWithdrawingProceeds(false);
    }
  };

  const hasProceeds = auctionContract.pendingProceeds > 0n;

  return (
    <div className="flex min-h-screen flex-col pt-3">
      {/* Top Navbar */}
      <Navbar
        wallet={wallet}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* Seller Earnings Banner */}
      {hasProceeds && (
        <div className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6">
          <div className="card flex flex-col gap-3 border-accent/30 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm">
              <Coins className="h-5 w-5 shrink-0 text-accent" />
              <span>
                <strong className="font-mono font-semibold text-accent">{formatBnb(auctionContract.pendingProceeds)} tBNB</strong> in sales proceeds ready to claim.
              </span>
            </div>
            <button onClick={handleWithdrawProceeds} disabled={withdrawingProceeds} className="btn-primary self-start sm:self-auto">
              <ArrowDownLeft className="h-4 w-4" />
              {withdrawingProceeds ? 'Withdrawing…' : 'Withdraw earnings'}
            </button>
          </div>
        </div>
      )}

      {/* Main Auctions Marketplace */}
      <main className="flex-1">
        <AuctionGrid
          auctions={auctionContract.auctions}
          loading={auctionContract.loading}
          userAccount={wallet.account}
          onOpenBid={(auction) => setSelectedBidAuction(auction)}
          onEndAuction={handleEndAuction}
          onWithdrawRefund={handleWithdrawRefund}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-ink">Every bid is a transaction. Every winner is on-chain.</p>
          <p className="font-mono text-xs text-muted">UniOvi Blockchain Accelerator · BSC Testnet</p>
        </div>
      </footer>

      {/* Create Auction Modal */}
      <CreateAuctionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateAuction={handleCreateAuction}
      />

      {/* Place Bid Modal */}
      <BidModal
        isOpen={Boolean(selectedBidAuction)}
        auction={selectedBidAuction}
        onClose={() => setSelectedBidAuction(null)}
        onMakeBid={handleMakeBid}
      />

      {/* Real-time Notifications & Errors */}
      <NotificationToast
        txHash={auctionContract.lastTxHash}
        error={auctionContract.errorMsg}
        onClearError={auctionContract.clearError}
        onClearTx={auctionContract.clearTx}
      />
    </div>
  );
}