// Script to deploy and set up contracts on a local Hardhat network for testing
const hre = require("hardhat");

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Deploy test tokens first
  console.log("Deploying test tokens...");
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  
  const tokenA = await TestToken.deploy("Token A", "TKA", 1000000);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("Token A deployed to:", tokenAAddress);
  
  const tokenB = await TestToken.deploy("Token B", "TKB", 1000000);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("Token B deployed to:", tokenBAddress);
  
  // Deploy TokenSwap contract
  console.log("Deploying TokenSwap contract...");
  const TokenSwap = await hre.ethers.getContractFactory("TokenSwap");
  const tokenSwap = await TokenSwap.deploy(tokenAAddress, tokenBAddress);
  await tokenSwap.waitForDeployment();
  const tokenSwapAddress = await tokenSwap.getAddress();
  console.log("TokenSwap deployed to:", tokenSwapAddress);
  
  // Transfer some tokens to user1 and user2 for testing
  console.log("Transferring tokens to test users...");
  const amount = ethers.parseEther("10000");
  
  await tokenA.transfer(user1.address, amount);
  await tokenB.transfer(user1.address, amount);
  await tokenA.transfer(user2.address, amount);
  await tokenB.transfer(user2.address, amount);
  
  console.log("Tokens transferred to:", user1.address);
  console.log("Tokens transferred to:", user2.address);
  
  // Add initial liquidity
  console.log("Adding initial liquidity...");
  const initialLiquidity = ethers.parseEther("5000");
  
  await tokenA.approve(tokenSwapAddress, initialLiquidity);
  await tokenB.approve(tokenSwapAddress, initialLiquidity);
  
  await tokenSwap.addLiquidity(initialLiquidity, initialLiquidity);
  
  // Get pool reserves
  const reserves = await tokenSwap.getReserves();
  console.log("Pool reserves after initial liquidity:");
  console.log("Reserve A:", ethers.formatEther(reserves[0]));
  console.log("Reserve B:", ethers.formatEther(reserves[1]));
  
  // Generate ABI files for frontend
  console.log("\nContract addresses for frontend:");
  console.log(`TOKEN_SWAP_ADDRESS = '${tokenSwapAddress}';`);
  console.log(`TOKEN_A_ADDRESS = '${tokenAAddress}';`);
  console.log(`TOKEN_B_ADDRESS = '${tokenBAddress}';`);
  
  console.log("\nSetup complete! Your local AMM is ready for testing.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
