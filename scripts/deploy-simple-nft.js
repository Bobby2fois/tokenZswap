require ('dotenv').config();
const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleNFT contract...");

  // Get the contract factory
  const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
  
  // Deploy the contract
  const simpleNFT = await SimpleNFT.deploy();
  
  // Wait for deployment to complete
  await simpleNFT.waitForDeployment();
  
  // Get the contract address
  const simpleNFTAddress = await simpleNFT.getAddress();
  
  console.log(`SimpleNFT deployed to: ${simpleNFTAddress}`);
  console.log("Add this address to your frontend configuration.");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
