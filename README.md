# BSC Auction DApp

A decentralized auction system on **BNB Smart Chain Testnet**: a Solidity smart contract that escrows bids in tBNB, and a React + ethers.js web app to create auctions, bid, finalize, and claim refunds from MetaMask.

Built as the final project of the UniOvi Blockchain Accelerator.

- **Live DApp (IPFS):** https://bafybeidyfdiwchs6m6kc4rszptt2ksjxncnchw3k53szbq6xqrw46g3zyy.ipfs.inbrowser.link/
- **IPFS CID:** `bafybeidyfdiwchs6m6kc4rszptt2ksjxncnchw3k53szbq6xqrw46g3zyy`
- **Contract (BSC Testnet):** [`0x517DD577A1596F8AB0C7b4347D766074e6F80976`](https://testnet.bscscan.com/address/0x517DD577A1596F8AB0C7b4347D766074e6F80976)
- **Chain ID:** 97

## Features

**Smart contract** (`auction-smart-contract/src/auction.sol`)
- Anyone can create an auction with a product name, a duration in minutes, and a starting bid.
- Bids are sent in tBNB and stored in a per-auction `mapping(address => uint256)`.
- Each address may bid only once per auction, and a bid must beat the current highest bid.
- `getWinner` returns the winning address once the auction is over.
- Outbid users withdraw their funds with `withdrawBids`; sellers collect earnings with `withdrawProceeds` (pull-payment pattern).
- Events: `AuctionCreated`, `BidPlaced`, `AuctionEnded`, `FundsWithdrawn`, `AuctionCancelled`.
- The owner can force-close an auction (`forceCloseAuction`, OpenZeppelin `Ownable`).

**DApp** (`frontend/`)
- Connects to MetaMask and prompts to add/switch to BSC Testnet.
- Lists all auctions with a live countdown, highest bid, leading bidder and winner.
- Place bids, finalize ended auctions, withdraw refunds and seller proceeds.
- Transaction toasts linking to BscScan.

## Project structure

```
.
├── auction-smart-contract/   Foundry project
│   ├── src/auction.sol       Auction contract
│   ├── test/auction.t.sol    Forge tests
│   └── script/               Deployment script
├── frontend/                 React + Vite + Tailwind + ethers.js
│   └── src/contracts/        ABI and contract address
└── docker-compose.yml        Runs the frontend dev server
```

## Smart contract

Requires [Foundry](https://book.getfoundry.sh/).

```sh
cd auction-smart-contract
forge build
forge test
```

### Deploy to BSC Testnet

Create `auction-smart-contract/.env` (never commit it) with a funded testnet key; you can get tBNB from the [BNB Chain faucet](https://www.bnbchain.org/en/testnet-faucet).

```sh
PRIVATE_KEY=0x...
```

```sh
source .env
forge script script/DeployAuction.s.sol:DeployAuction --rpc-url bsc_testnet --broadcast
```

After deploying, update `AUCTION_CONTRACT_ADDRESS` in `frontend/src/contracts/contractConfig.js` and, if the contract changed, copy the new ABI from `out/auction.sol/Auction.json` into `frontend/src/contracts/AuctionABI.json`.

## Frontend

Requires Node.js 20+ and MetaMask.

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, connect MetaMask, and switch to BSC Testnet when prompted.

Or with Docker:

```sh
docker compose up --build
```

### Deploy to IPFS

`vite.config.js` uses `base: './'`, so the build works from any IPFS gateway. Run `npm run build`, upload the `frontend/dist` folder to a pinning service (e.g. Pinata), and open `https://<CID>.ipfs.inbrowser.link/`. Each upload produces a new CID.

## Tech stack

Solidity 0.8.34 · Foundry · OpenZeppelin · React 19 · Vite · Tailwind CSS · ethers.js v6 · lucide-react
