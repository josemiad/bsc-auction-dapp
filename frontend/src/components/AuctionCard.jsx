import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { formatBnb, shortenAddress } from '../utils/formatters';
import { getCountdown } from '../utils/time';
import { Trophy, ArrowDownLeft, Gavel, CheckCircle2 } from 'lucide-react';

export default function AuctionCard({
    auction,
    userAccount,
    onOpenBid,
    onEndAuction,
    onWithdrawRefund,
}) {
    const [countdown, setCountdown] = useState(() => getCountdown(auction.deadline));
    const [actionLoading, setActionLoading] = useState(false);

    // Live countdown timer ticking every second
    useEffect(() => {
    const timer = setInterval(() => {
        setCountdown(getCountdown(auction.deadline));
    }, 1000);
    return () => clearInterval(timer);
    }, [auction.deadline]);

    const isSeller = userAccount && auction.seller.toLowerCase() === userAccount.toLowerCase();
    const isHighestBidder = userAccount && auction.maxBidAddress.toLowerCase() === userAccount.toLowerCase();
    const hasUserBid = auction.userBid > 0n;
    const canWithdraw = userAccount && !isHighestBidder && hasUserBid && (!auction.open || countdown.isEnded);
    const canEnd = auction.open && countdown.isEnded;
    const isLive = auction.open && !countdown.isEnded;
    const hasBidder = auction.maxBidAddress !== ethers.ZeroAddress;

    const handleEnd = async () => {
    try {
        setActionLoading(true);
        await onEndAuction(auction.id);
    } finally {
        setActionLoading(false);
    }
    };

    const handleWithdraw = async () => {
    try {
        setActionLoading(true);
        await onWithdrawRefund(auction.id);
    } finally {
        setActionLoading(false);
    }
    };

    const you = <span className="ml-1.5 rounded bg-accent/15 px-1 py-px text-[10px] text-accent">YOU</span>;

    return (
    <article className="card group flex flex-col p-5 transition-[border-color,transform] duration-300 ease-brand hover:-translate-y-0.5 hover:border-accent/40">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
            <p className="eyebrow mb-1">Lot #{String(auction.id).padStart(3, '0')}</p>
            <h3 className="text-lg font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]">{auction.productName}</h3>
        </div>
        {isLive ? (
            <span className="chip border-ok/30 bg-ok/10 text-ok">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Live
            </span>
        ) : (
            <span className="chip border-line text-muted">Closed</span>
        )}
        </div>

        {/* Price + clock */}
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 rounded-xl border border-line bg-paper/70 p-4">
        <div className="min-w-0">
            <p className="eyebrow mb-1">{hasBidder ? 'Highest bid' : 'Starting bid'}</p>
            <p className="truncate font-mono text-2xl font-semibold text-accent">
            {formatBnb(auction.maxCurrentBid)}<span className="ml-1.5 text-sm font-normal text-muted">tBNB</span>
            </p>
        </div>
        <div className="text-right">
            <p className="eyebrow mb-1">{isLive ? 'Ends in' : 'Status'}</p>
            <p className={`font-mono text-sm tabular-nums ${isLive ? 'text-ink' : 'text-muted'}`}>
            {countdown.isEnded ? 'Ended' : countdown.text}
            </p>
        </div>
        </div>

        {/* Details */}
        <dl className="mb-5 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Leading bidder</dt>
            <dd className="font-mono text-xs text-ink">{shortenAddress(auction.maxBidAddress)}{isHighestBidder && you}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Seller</dt>
            <dd className="font-mono text-xs text-muted">{shortenAddress(auction.seller)}{isSeller && you}</dd>
        </div>
        {hasUserBid && (
            <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Your bid</dt>
            <dd className="font-mono text-xs text-accent">{formatBnb(auction.userBid)} tBNB</dd>
            </div>
        )}
        </dl>

        {!isLive && hasBidder && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-sm text-accent">
            <Trophy className="h-4 w-4 shrink-0" />
            <span>Winner <span className="font-mono text-xs">{shortenAddress(auction.maxBidAddress)}</span></span>
        </div>
        )}

        {/* Contextual actions */}
        <div className="mt-auto space-y-2">
        {isLive && (
            <button
            onClick={() => onOpenBid(auction)}
            disabled={isSeller || hasUserBid || !userAccount}
            className="btn-primary w-full"
            >
            <Gavel className="h-4 w-4" />
            {!userAccount ? 'Connect wallet to bid' : isSeller ? 'Your listing' : hasUserBid ? 'Bid placed' : 'Place bid'}
            </button>
        )}

        {canEnd && (
            <button onClick={handleEnd} disabled={actionLoading} className="btn-ok w-full">
            <CheckCircle2 className="h-4 w-4" />
            {actionLoading ? 'Finalizing…' : 'Finalize auction'}
            </button>
        )}

        {canWithdraw && (
            <button onClick={handleWithdraw} disabled={actionLoading} className="btn-ghost w-full">
            <ArrowDownLeft className="h-4 w-4" />
            {actionLoading ? 'Claiming…' : `Withdraw ${formatBnb(auction.userBid)} tBNB`}
            </button>
        )}
        </div>
    </article>
    );
}
