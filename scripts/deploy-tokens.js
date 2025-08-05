require ('dotenv').config();
const hre = require("hardhat");

async function main() {
console.log("Deploying SimpleNFT/ERC20 contracts...");

    //Deploy the SimpleNFT contract
    // Get the contract factory
    const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");

    // Deploy the contract
    const simpleNFT = await SimpleNFT.deploy();

    // Wait for deployment to complete
    await simpleNFT.waitForDeployment();

    // Get the contract address
    const simpleNFTAddress = await simpleNFT.getAddress();

    //Deploy the SimpleERC20 contract
    const SimpleTokenFactory = await ethers.getContractFactory("SimpleERC20");
    const token = await SimpleTokenFactory.deploy(
    "TokenA",
    "TKA",
    "1000000000"
    );
    await token.waitForDeployment();
    const tokenB = await SimpleTokenFactory.deploy(
    "TokenB",
    "TKB",
    "1000000"
    );
    await tokenB.waitForDeployment();
    // Get and print token addresses
    const tokenAddress = await token.getAddress();
    const tokenAddressB = await tokenB.getAddress();
    console.log("TokenA deployed to:", tokenAddress);
    console.log("TokenB deployed to:", tokenAddressB);
    console.log(`SimpleNFT deployed to: ${simpleNFTAddress}`);
    console.log("Add this addresses to .env and frontend configuration.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment", error);
    process.exit(1);
  });