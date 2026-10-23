import React, { useState } from 'react';
import AuctionCard from './AuctionCard';
import { Loader2 } from 'lucide-react';

const isEndedAuction = (a) => !a.open || Math.floor(Date.now() / 1000) > a.deadline;

export default function AuctionGrid({
    auctions,
    loading,
    userAccount,
    onOpenBid,
    onEndAuction,
    onWithdrawRefund,
}) {
    const [filter, setFilter] = useState('all');

    const liveCount = auctions.filter((a) => !isEndedAuction(a)).length;
    const counts = { all: auctions.length, active: liveCount, ended: auctions.length - liveCount };

    const filteredAuctions = auctions.filter((a) => {
        if (filter === 'active') return !isEndedAuction(a);
        if (filter === 'ended') return isEndedAuction(a);
        return true;
    });

    const tabs = [['all', 'All'], ['active', 'Live'], ['ended', 'Closed']];

    return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
            <p className="eyebrow mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Reading from BSC Testnet
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Open auctions</h1>
            <p className="mt-3 max-w-md text-muted">
            Bids are escrowed in the contract. Outbid? Withdraw your tBNB once the lot closes.
            </p>
        </div>

        <div role="tablist" className="flex shrink-0 gap-1 self-start rounded-full border border-line bg-surface/80 p-1 text-sm md:self-auto">
            {tabs.map(([key, label]) => (
            <button
                key={key}
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${filter === key ? 'bg-raised text-ink' : 'text-muted hover:text-ink'}`}
            >
                {label} <span className="ml-1 font-mono text-xs text-muted">{counts[key]}</span>
            </button>
            ))}
        </div>
        </div>

        {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-sm">Fetching auctions from the contract…</p>
        </div>
        ) : filteredAuctions.length === 0 ? (
        <div className="card border-dashed px-6 py-16 text-center">
            <p className="mb-1 font-medium">Nothing here yet</p>
            <p className="text-sm text-muted">Connect your wallet and list the first lot with “New auction”.</p>
        </div>
        ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredAuctions.map((auction) => (
            <AuctionCard
                key={auction.id}
                auction={auction}
                userAccount={userAccount}
                onOpenBid={onOpenBid}
                onEndAuction={onEndAuction}
                onWithdrawRefund={onWithdrawRefund}
            />
            ))}
        </div>
        )}
    </section>
    );
}
