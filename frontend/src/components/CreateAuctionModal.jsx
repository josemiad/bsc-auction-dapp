import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function CreateAuctionModal({ isOpen, onClose, onCreateAuction }) {
    const [productName, setProductName] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(10);
    const [startingBidBnb, setStartingBidBnb] = useState('0.01');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (productName.trim().length < 3) {
        setError('Product name must have at least 3 characters.');
        return;
    }
    if (Number(durationMinutes) <= 0) {
        setError('Duration must be at least 1 minute.');
        return;
    }
    if (Number(startingBidBnb) <= 0) {
        setError('Starting bid must be greater than 0 BNB.');
        return;
    }

    try {
        setIsSubmitting(true);
        await onCreateAuction(productName.trim(), Number(durationMinutes), startingBidBnb);
        onClose();
        setProductName('');
        setDurationMinutes(10);
        setStartingBidBnb('0.01');
    } catch (err) {
        setError(err.reason || err.message || 'Failed to create auction');
    } finally {
        setIsSubmitting(false);
    }
    };

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/80 p-4 backdrop-blur-sm" onClick={onClose}>
        <div role="dialog" aria-modal="true" aria-labelledby="create-title" className="card relative w-full max-w-md bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <X className="h-5 w-5" />
        </button>

        <p className="eyebrow mb-1">New listing</p>
        <h2 id="create-title" className="mb-1 text-xl font-semibold tracking-tight">List an item</h2>
        <p className="mb-5 text-sm text-muted">Deploys a new lot to the auction contract.</p>

        {error && <div className="alert mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label htmlFor="product-name" className="label">Product name</label>
            <input
                id="product-name"
                type="text"
                required
                autoFocus
                placeholder="e.g. Vintage watch"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="input font-sans"
            />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
                <label htmlFor="duration" className="label">Duration (minutes)</label>
                <input
                id="duration"
                type="number"
                min="1"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input"
                />
            </div>
            <div>
                <label htmlFor="start-bid" className="label">Starting bid (tBNB)</label>
                <input
                id="start-bid"
                type="number"
                step="any"
                min="0.000001"
                required
                value={startingBidBnb}
                onChange={(e) => setStartingBidBnb(e.target.value)}
                className="input"
                />
            </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Confirm in wallet…' : 'Create auction'}
            </button>
            </div>
        </form>
        </div>
    </div>
    );
}
