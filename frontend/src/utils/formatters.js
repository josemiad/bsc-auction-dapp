import { ethers } from 'ethers';

// Converts Wei (BigInt) to formatted BNB string (e.g., "0.0500")
export function formatBnb(weiAmount) {
    if (weiAmount === undefined || weiAmount === null) return '0.0000';
    try {
        const formatted = ethers.formatEther(weiAmount);
        const num = parseFloat(formatted);
        return isNaN(num) ? '0.0000' : num.toFixed(4);
    } catch (err) {
        return '0.0000';
    }
}

// Shortens 0x517DD577A1596F8AB0C7b4347D766074e6F80976 to 0x517D...0976
export function shortenAddress(address) {
    if (!address || address === ethers.ZeroAddress) return 'None';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Shortens transaction hash
export function shortenTx(hash) {
    if (!hash) return '';
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}