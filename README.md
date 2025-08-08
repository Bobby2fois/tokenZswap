# TokenSwap AMM with NFT Marketplace

A minimal Automated Market Maker (AMM) implementation on BNB Chain for the 42 school project. This AMM allows users to swap between two tokens using the constant product formula (x*y=k), add and remove liquidity, earn fees from swaps, and interact with an integrated NFT marketplace.

## Features

### AMM Features
- Create and manage liquidity pools for token pairs (Token A / Token B)
- Add and remove liquidity with LP token issuance and burning
- Swap tokens using the constant product formula with a 0.3% fee
- Simple and clean frontend interface

### NFT Marketplace Features
- List NFTs for sale with prices in Token A and/or Token B
- Buy NFTs using either token from the AMM
- Cancel listings (seller only)

## Smart Contracts

- **TokenSwap.sol**: The main AMM contract implementing the constant product formula
- **NFTMarketplace.sol**: NFT marketplace contract for listing and trading NFTs
- **SimpleNFT.sol**: ERC721 contract implementation for testing
- **SimpleERC20.sol**: ERC20 token implementation for testing

## Getting Started

### Prerequisites

- Node.js (v14+) and npm
- MetaMask wallet installed in your browser
- BNB testnet tokens for gas (get from [BNB Chain Faucet](https://www.bnbchain.org/en/testnet-faucet))
- Basic knowledge of blockchain interactions

### Installation

1. Clone the repository:
```shell
git clone https://github.com/bobby2fois/tokenZswap.git swap
cd swap
```

2. Install dependencies:
```shell
npm install
```

3. Compile the contracts:
```shell
npx hardhat compile
```

4. Create a `.env` file in the project root with your configuration (see Deployment section below)

### Deployment to BNB Chain Testnet

1. Create a `.env` file in the project root with the following structure:
```
# BSC Testnet RPC URL
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Private key for deployment (without 0x prefix)
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# BscScan API Key for contract verification (optional, for verifying contracts)
BSCSCAN_API_KEY=YOUR_BSCSCAN_API_KEY_HERE
```

2. Get your private key from MetaMask:
   - Open MetaMask and click on the three dots next to your account
   - Select "Account Details"
   - Click "Export Private Key"
   - Enter your password and copy the private key
   - Paste it in your `.env` file (without the 0x prefix)

3. Deploy the ERC20 tokens and NFT contract:
```shell
npx hardhat run scripts/deploy-tokens.js --network bscTestnet
```

4. After deployment, you'll see output with the contract addresses. Update your `.env` file with these addresses:
```
# Token addresses (from step 3 output)
TOKEN_A_ADDRESS=0x...your_token_a_address...
TOKEN_B_ADDRESS=0x...your_token_b_address...

# NFT contract address (from step 3 output)
NFT_ADDRESS=0x...your_nft_address...
```

5. Deploy the AMM and NFT Marketplace contracts:
```shell
npx hardhat run scripts/deploy.js --network bscTestnet
```

6. After deployment, you'll see output with the TokenSwap and NFTMarketplace contract addresses. Update your frontend configuration with these addresses (see Frontend Setup section below).

### Frontend Setup

1. Update the contract addresses in the frontend configuration files:

   Open `frontend/swap.js` and update the following constants with your deployed contract addresses:
   ```javascript
   // Update these with your deployed contract addresses
   const TOKEN_SWAP_ADDRESS = '0x...your_tokenswap_address...';
   const TOKEN_A_ADDRESS = '0x...your_token_a_address...';
   const TOKEN_B_ADDRESS = '0x...your_token_b_address...';
   ```
   Open `frontend/liquidity.js` and update the following constants:
   ```javascript
   // Update these with your deployed contract addresses
   const TOKEN_SWAP_ADDRESS = '0x...your_tokenswap_address...';
   const TOKEN_A_ADDRESS = '0x...your_token_a_address...';
   const TOKEN_B_ADDRESS = '0x...your_token_b_address...';
   ```

   Open `frontend/marketplace.js` and update the following constants:
   ```javascript
   // Update these with your deployed contract addresses
   const NFT_MARKETPLACE_ADDRESS = '0x...your_nft_marketplace_address...';
   const NFT_ADDRESS = '0x...your_nft_address...';
   const TOKEN_A_ADDRESS = '0x...your_token_a_address...';
   const TOKEN_B_ADDRESS = '0x...your_token_b_address...';
   ```

2. Serve the frontend locally:
   ```shell
   npx serve frontend
   ```

3. Open your browser and navigate to `http://localhost:3000` to access the TokenSwap AMM interface.

### MetaMask Configuration

1. Add BNB Chain Testnet to MetaMask:
   - Open MetaMask and click on the network dropdown at the top
   - Select "Add Network"
   - Fill in the following details:
     - Network Name: `BSC Testnet`
     - New RPC URL: `https://data-seed-prebsc-1-s1.binance.org:8545`
     - Chain ID: `97`
     - Currency Symbol: `BNB`
     - Block Explorer URL: `https://testnet.bscscan.com`

2. Get testnet BNB for gas:
   - Visit the [BNB Chain Faucet](https://www.bnbchain.org/en/testnet-faucet)
   - Enter your wallet address and request test BNB

3. Add your tokens to MetaMask:
   - In MetaMask, click "Import tokens" at the bottom
   - Enter the Token A and Token B addresses from your deployment
   - The token symbol and decimals should auto-fill
   - Click "Add Custom Token"

## Usage Guide

### Adding Liquidity
1. Navigate to the "Liquidity" tab
2. Enter the amounts of Token A and Token B you want to add
3. Click "Add Liquidity" to provide liquidity and receive LP tokens

### Swapping Tokens
1. Connect your wallet by clicking the "Connect Wallet" button
2. Enter the amount of tokens you want to swap in the "From" field
3. The "To" field will automatically calculate the expected output
4. Click "Swap" to execute the transaction

### Removing Liquidity
1. Navigate to the "Liquidity" tab
2. Enter the amount of LP tokens you want to burn
3. Click "Remove Liquidity" to withdraw your tokens

### NFT Marketplace
1. Navigate to the "NFT Marketplace" tab
2. Connect your wallet if not already connected
3. Browse available NFTs in the marketplace
4. To list an NFT for sale:
   - Go to "My NFTs" tab
   - Click "List for Sale" on an NFT you own
   - Set prices in Token A and/or Token B
   - Confirm the transaction
5. To buy an NFT:
   - Browse the marketplace
   - Click "Buy with Token A" or "Buy with Token B"
   - Confirm the transaction
6. To cancel a listing:
   - Go to "My Listings" tab
   - Click "Cancel Listing" on the NFT you want to delist
   - Confirm the transaction

## How It Works

### Constant Product Formula

The AMM uses the constant product formula `x * y = k` where:
- `x` is the reserve of Token A
- `y` is the reserve of Token B
- `k` is a constant that should remain the same before and after each swap (minus fees)

For swaps, the formula to calculate the output amount is:
```
amountOut = (reserveOut * amountIn * 997) / (reserveIn * 1000 + amountIn * 997)
```

### Liquidity Provision

When adding liquidity:
- First liquidity provider sets the initial price ratio
- Subsequent providers must add tokens in the same ratio as the current reserves
- LP tokens are minted proportionally to the share of the pool

When removing liquidity:
- LP tokens are burned
- Tokens are returned proportionally to the share of the pool

## NFT Marketplace

The project includes an NFT marketplace that allows users to:
- List NFTs for sale with prices in Token A and/or Token B
- Buy NFTs using either token from the AMM
- Cancel listings (seller only)
- Display NFTs with metadata