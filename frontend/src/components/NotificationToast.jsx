import React from 'react';
import { shortenTx } from '../utils/formatters';
import { ExternalLink, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NotificationToast({ txHash, error, onClearError, onClearTx }) {
    if (!txHash && !error) return null;

    const closeBtn = 'shrink-0 rounded-full p-0.5 text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

    return (
    <div aria-live="polite" className="fixed inset-x-4 bottom-4 z-50 space-y-2 sm:inset-x-auto sm:right-5 sm:w-96">
        {txHash && (
        <div className="card flex items-start gap-3 bg-surface p-4 text-sm shadow-xl">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
            <div className="min-w-0 flex-1">
            <p className="font-medium">Transaction sent</p>
            <a
                href={`https://testnet.bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
            >
                {shortenTx(txHash)} on BscScan
                <ExternalLink className="h-3 w-3" />
            </a>
            </div>
            <button onClick={onClearTx} aria-label="Dismiss" className={closeBtn}><X className="h-4 w-4" /></button>
        </div>
        )}

        {error && (
        <div role="alert" className="card flex items-start gap-3 border-danger/40 bg-surface p-4 text-sm shadow-xl">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
            <p className="font-medium">Transaction failed</p>
            <p className="mt-0.5 text-xs text-muted [overflow-wrap:anywhere]">{error}</p>
            </div>
            <button onClick={onClearError} aria-label="Dismiss" className={closeBtn}><X className="h-4 w-4" /></button>
        </div>
        )}
    </div>
    );
}
