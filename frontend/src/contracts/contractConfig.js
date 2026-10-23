import AuctionABI from './AuctionABI.json';
    
// BSC Testnet parameters
export const BSC_TESTNET_CHAIN_ID = 97;
export const BSC_TESTNET_HEX_ID = '0x61';

export const BSC_TESTNET_CONFIG = {
    chainId: BSC_TESTNET_HEX_ID,
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18,
    },
    rpcUrls: [
        'https://data-seed-prebsc-1-s1.binance.org:8545/',
        'https://bsc-testnet.publicnode.com'
    ],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
};

// Your deployed contract address
export const AUCTION_CONTRACT_ADDRESS = '0x517DD577A1596F8AB0C7b4347D766074e6F80976';

export { AuctionABI };