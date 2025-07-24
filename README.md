# TokenSwap AMM

A minimal Automated Market Maker (AMM) implementation on BNB Chain for the 42 school project. This AMM allows users to swap between two tokens using the constant product formula (x*y=k), add and remove liquidity, and earn fees from swaps.

## Features

- Create and manage liquidity pools for token pairs (Token A / Token B)
- Add and remove liquidity with LP token issuance and burning
- Swap tokens using the constant product formula with a 0.3% fee
- Simple and clean frontend interface

## Smart Contracts

- **TokenSwap.sol**: The main AMM contract implementing the constant product formula
- **TestToken.sol**: A simple ERC20 token for testing purposes

## Getting Started

### Prerequisites

- Node.js and npm
- MetaMask wallet

### Installation

1. Clone the repository:
```shell
git clone https://github.com/yourusername/swap.git
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

### Local Development

1. Start a local Hardhat node:
```shell
npx hardhat node
```

2. In a new terminal, deploy the contracts to the local network:
```shell
npx hardhat run scripts/run-local.js --network localhost
```

3. Update the contract addresses in `frontend/app.js` with the addresses output from the deployment script.

4. Serve the frontend:
```shell
npx serve frontend
```

5. Open your browser and navigate to `http://localhost:3000`

### Testing

Run the test suite:
```shell
npx hardhat test
```

### Deployment to BNB Chain Testnet

1. Add your private key to the `.env` file:
```
PRIVATE_KEY=your_private_key_here
```

2. Deploy to the BNB Chain testnet:
```shell
npx hardhat run scripts/deploy.js --network bscTestnet
```

3. Verify the contract on BscScan:
```shell
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

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

## License

This project is licensed under the MIT License.
