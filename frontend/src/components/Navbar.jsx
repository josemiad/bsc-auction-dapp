import React from 'react';
import { shortenAddress } from '../utils/formatters';
import { Plus, Wallet, AlertTriangle, Gavel } from 'lucide-react';

export default function Navbar({ wallet, onOpenCreate }) {
    const { account, isCorrectNetwork, balance, isConnecting, connectWallet, switchToBscTestnet } = wallet;

    return (
    <header className="sticky top-3 z-40 px-4 sm:px-6">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border border-line bg-surface/85 pl-3 pr-2 shadow-[0_8px_32px_-12px_oklch(0%_0_0/0.6)] backdrop-blur-md">
        {/* Wordmark */}
        <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
            <Gavel className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight">Auctions</span>
            <span className="hidden font-mono text-xs text-muted md:inline">/ bsc-testnet</span>
        </div>

        <div className="flex items-center gap-2">
            {account && !isCorrectNetwork && (
            <button onClick={switchToBscTestnet} className="btn border border-danger/40 bg-danger/10 px-3 text-danger hover:bg-danger/20">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Switch network</span>
            </button>
            )}

            {account && (
            <button onClick={onOpenCreate} className="btn-primary px-3 sm:px-4">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New auction</span>
            </button>
            )}

            {!account ? (
            <button onClick={connectWallet} disabled={isConnecting} className="btn-primary">
                <Wallet className="h-4 w-4" />
                <span>{isConnecting ? 'Connecting…' : 'Connect wallet'}</span>
            </button>
            ) : (
            <div className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-3 pr-1 font-mono text-xs">
                <span className="hidden text-muted sm:inline">{balance} tBNB</span>
                <span className="flex items-center gap-1.5 rounded-full bg-raised px-2.5 py-1.5 text-ink">
                <span className={`h-1.5 w-1.5 rounded-full ${isCorrectNetwork ? 'bg-ok' : 'bg-danger'}`} />
                {shortenAddress(account)}
                </span>
            </div>
            )}
        </div>
        </div>
    </header>
    );
}
