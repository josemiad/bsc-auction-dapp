import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { BSC_TESTNET_CHAIN_ID, BSC_TESTNET_CONFIG, BSC_TESTNET_HEX_ID } from '../contracts/contractConfig';
import { formatBnb } from '../utils/formatters';

export function useWallet() {
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [balance, setBalance] = useState('0.0000');
    const [isConnecting, setIsConnecting] = useState(false);

    // Check if connected network is BSC Testnet (Chain ID 97)
    const isCorrectNetwork = Number(chainId) === BSC_TESTNET_CHAIN_ID;

    // Fetch BNB balance for the connected address
    const updateBalance = useCallback(async (userAddress, provider) => {
    try {
        const bal = await provider.getBalance(userAddress);
        setBalance(formatBnb(bal));
    } catch (err) {
        console.error('Failed to get balance:', err);
    }
    }, []);

    // Check if wallet is already connected on page load
    const checkConnection = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));

        const accounts = await provider.send('eth_accounts', []);
        if (accounts.length > 0) {
        setAccount(ethers.getAddress(accounts[0]));
        updateBalance(accounts[0], provider);
        } else {
        setAccount(null);
        }
    } catch (err) {
        console.error('Error checking wallet connection:', err);
    }
    }, [updateBalance]);

    // Request user to connect MetaMask
    const connectWallet = async () => {
    if (!window.ethereum) {
        alert('MetaMask is not installed. Please install MetaMask to use this DApp.');
        return;
    }
    setIsConnecting(true);
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
            setAccount(ethers.getAddress(accounts[0]));
            const network = await provider.getNetwork();
            setChainId(Number(network.chainId));
            updateBalance(accounts[0], provider);
        }
    } catch (err) {
        console.error('User rejected connection:', err);
    } finally {
        setIsConnecting(false);
    }
    };

    // Prompt MetaMask to switch to BSC Testnet (Chain 97)
    const switchToBscTestnet = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_TESTNET_HEX_ID }],
            });
        } catch (switchError) {
            // 4902 means the chain hasn't been added to MetaMask yet
            if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [BSC_TESTNET_CONFIG],
                });
            } catch (addError) {
                console.error('Failed to add BSC Testnet chain:', addError);
            }
            } else {
            console.error('Failed to switch network:', switchError);
            }
        }
    };

    // Listen to MetaMask account or network changes
    useEffect(() => {
        checkConnection();

        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                setAccount(null);
                setBalance('0.0000');
            } else {
                setAccount(ethers.getAddress(accounts[0]));
                const provider = new ethers.BrowserProvider(window.ethereum);
                updateBalance(accounts[0], provider);
            }
            };

            const handleChainChanged = (newChainId) => {
                setChainId(parseInt(newChainId, 16));
                checkConnection();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [checkConnection, updateBalance]);

    return {
        account,
        chainId,
        isCorrectNetwork,
        balance,
        isConnecting,
        connectWallet,
        switchToBscTestnet,
        refreshBalance: () => {
            if (account && window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            updateBalance(account, provider);
            }
        }
    };
}