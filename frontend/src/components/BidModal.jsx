import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { formatBnb } from '../utils/formatters';

export default function BidModal({ isOpen, onClose, auction, onMakeBid }) {
    const [bidAmount, setBidAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !auction) return null;

    const currentHighest = formatBnb(auction.maxCurrentBid);
    const minRequired = (parseFloat(currentHighest) + 0.001).toFixed(4);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(bidAmount);
    if (isNaN(parsed) || parsed <= parseFloat(currentHighest)) {
        setError(`Your bid must be greater than current highest bid (${currentHighest} tBNB).`);
        return;
    }

    try {
        setIsSubmitting(true);
        await onMakeBid(auction.id, bidAmount);
        onClose();
        setBidAmount('');
    } catch (err) {
        setError(err.reason || err.message || 'Bid failed');
    } finally {
        setIsSubmitting(false);
    }
    };

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/80 p-4 backdrop-blur-sm" onClick={onClose}>
        <div role="dialog" aria-modal="true" aria-labelledby="bid-title" className="card relative w-full max-w-sm bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <X className="h-5 w-5" />
        </button>

        <p className="eyebrow mb-1">Lot #{String(auction.id).padStart(3, '0')}</p>
        <h2 id="bid-title" className="mb-5 pr-8 text-xl font-semibold tracking-tight [overflow-wrap:anywhere]">{auction.productName}</h2>

        <dl className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
            <div className="bg-paper p-3">
            <dt className="eyebrow mb-1">Highest</dt>
            <dd className="font-mono text-accent">{currentHighest}</dd>
            </div>
            <div className="bg-paper p-3">
            <dt className="eyebrow mb-1">Min. bid</dt>
            <dd className="font-mono">{minRequired}</dd>
            </div>
        </dl>

        {error && <div className="alert mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
            <label htmlFor="bid-amount" className="label">Your bid (tBNB)</label>
            <input
                id="bid-amount"
                type="number"
                step="any"
                required
                autoFocus
                placeholder={minRequired}
                value={bidAmount}
                aria-invalid={Boolean(error)}
                onChange={(e) => setBidAmount(e.target.value)}
                className="input"
            />
            </div>

            <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Confirm in wallet…' : 'Place bid'}
            </button>
            </div>
        </form>
        </div>
    </div>
    );
}
