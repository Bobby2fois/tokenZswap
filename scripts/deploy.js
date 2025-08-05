// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
require('dotenv').config();
const hre = require("hardhat");

async function main() {
  // Get the network from Hardhat config
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  
  console.log("Deploying contracts with the account:", deployer.address);

  // Replace these with your actual token addresses
  let TOKEN_A_ADDRESS = process.env.TOKEN_A_ADDRESS;
  let TOKEN_B_ADDRESS = process.env.TOKEN_B_ADDRESS;
    
    
  if (!TOKEN_A_ADDRESS || !TOKEN_B_ADDRESS) {
    console.log("\nWARNING: You need to set valid TOKEN_A_ADDRESS and TOKEN_B_ADDRESS in your .env file.");
    process.exit(1);
  }

  // Deploy the TokenSwap AMM contract
  console.log("\nDeploying TokenSwap contract...");
  const TokenSwap = await hre.ethers.getContractFactory("TokenSwap");
  const tokenSwap = await TokenSwap.deploy(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);

  await tokenSwap.waitForDeployment();
  
  const tokenSwapAddress = await tokenSwap.getAddress();

  // Deploying Marketplace contract
  console.log("Deploying NFTMarketplace...");
  // Get the contract factory
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);

  await nftMarketplace.waitForDeployment();

  const nftMarketplaceAddress = await nftMarketplace.getAddress();

  // Minting NFTs
  const simpleNFTAddress = process.env.NFT_ADDRESS;
  if (!simpleNFTAddress) {
    console.error("Please set the NFT_ADDRESS in your .env file");
    return;
  }
  
  const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
  const simpleNFT = SimpleNFT.attach(simpleNFTAddress);

  const count = 5;
  console.log(`Minting ${count} NFTs...`);
      
  const tx = await simpleNFT.mintBatch(deployer.address, count);
  await tx.wait();

  // Output for updating frontend
  console.log("\n=== Deployment Summary ===");
  console.log("\nUpdate this address in your frontend marketplace.js file:");
  console.log("\nUpdate frontend/app.js and frontend/marketplace.js with these addresses:");
  console.log(`const NFT_MARKETPLACE_ADDRESS = '${nftMarketplaceAddress}';`);
  console.log(`const TOKEN_SWAP_ADDRESS = '${tokenSwapAddress}';`);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment", error);
    process.exit(1);
  });
