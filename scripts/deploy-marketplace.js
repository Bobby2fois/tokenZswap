require ('dotenv').config();
const hre = require("hardhat");

async function main() {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    
    
    // Replace these with your actual token addresses
    let TOKEN_A_ADDRESS = process.env.TOKEN_A_ADDRESS;
    let TOKEN_B_ADDRESS = process.env.TOKEN_B_ADDRESS;
    
    
    if (!TOKEN_A_ADDRESS || !TOKEN_B_ADDRESS) {
      console.log("\nWARNING: You need to set valid TOKEN_A_ADDRESS and TOKEN_B_ADDRESS in your .env file.");
      process.exit(1);
    }
    
    // Deploy NFTMarketplace
    console.log("Deploying NFTMarketplace...");
    // Get the contract factory
    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);

    await nftMarketplace.waitForDeployment();

    const nftMarketplaceAddress = await nftMarketplace.getAddress();

    console.log("NFTMarketplace deployed to:", nftMarketplaceAddress);
    
    console.log("\n=== Deployment Summary ===");
    console.log("NFTMarketplace address:", nftMarketplaceAddress);
    console.log("Token A address:", TOKEN_A_ADDRESS);
    console.log("Token B address:", TOKEN_B_ADDRESS);
    console.log("\nUpdate this address in your frontend marketplace.js file:");
    console.log(`const NFT_MARKETPLACE_ADDRESS = "${nftMarketplaceAddress}";`);
    console.log(`const NFT_CONTRACT_ADDRESS = "YOUR_NFT_CONTRACT_ADDRESS";`);
    console.log("\nDon't forget to update your NFT contract address too!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
