// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
require('dotenv').config();
const hre = require("hardhat");

async function main() {
  // Get the network from Hardhat config
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  
  console.log("Deploying contracts with the account:", deployer.address);

  // Check if we have token addresses in environment variables
  let tokenAAddress = process.env.TOKEN_A_ADDRESS;
  let tokenBAddress = process.env.TOKEN_B_ADDRESS;
  
  if (!tokenAAddress || !tokenBAddress) {
    console.log("\nWARNING: You need to set valid TOKEN_A_ADDRESS and TOKEN_B_ADDRESS in your .env file.");
    process.exit(1);
  }

  // Deploy the TokenSwap contract
  console.log("\nDeploying TokenSwap contract...");
  const TokenSwap = await hre.ethers.getContractFactory("TokenSwap");
  const tokenSwap = await TokenSwap.deploy(tokenAAddress, tokenBAddress);

  await tokenSwap.waitForDeployment();
  
  const tokenSwapAddress = await tokenSwap.getAddress();
  console.log("TokenSwap deployed to:", tokenSwapAddress);

  console.log("\nConfiguration:");
  console.log("- Token A Address:", tokenAAddress);
  console.log("- Token B Address:", tokenBAddress);
  console.log("- TokenSwap Address:", tokenSwapAddress);

  // For easier verification later
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network bnbTestnet ${tokenSwapAddress} ${tokenAAddress} ${tokenBAddress}`);
  
  // Output for updating frontend
  console.log("\nUpdate your frontend/app.js with these addresses:");
  console.log(`const TOKEN_SWAP_ADDRESS = '${tokenSwapAddress}';`);
  console.log(`const TOKEN_A_ADDRESS = '${tokenAAddress}';`);
  console.log(`const TOKEN_B_ADDRESS = '${tokenBAddress}';`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
