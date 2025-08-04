require ('dotenv').config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Minting NFTs with account:", deployer.address);
  
  // Get the SimpleNFT contract
  const simpleNFTAddress = process.env.NFT_ADDRESS;
  if (!simpleNFTAddress) {
    console.error("Please set the NFT_ADDRESS in your .env file");
    return;
  }
  
  console.log(`Using SimpleNFT contract at: ${simpleNFTAddress}`);
  
  const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
  const simpleNFT = SimpleNFT.attach(simpleNFTAddress);
  
  const count = 5;
  console.log(`Minting ${count} NFTs...`);
  
  try {
    // Mint NFTs
    const tx = await simpleNFT.mintBatch(deployer.address, count);
    await tx.wait();
    
    console.log(`Successfully minted ${count} NFTs to ${deployer.address}`);
    
    // Get the current token count
    const balance = await simpleNFT.balanceOf(deployer.address);
    console.log(`Current NFT balance: ${balance.toString()}`);
    
    // List NFTs the user now owns
    console.log("\nYour NFTs:");
    const tokenCount = 5;
    
    for (let i = 0; i < tokenCount; i++) {
      const tokenId = await simpleNFT.tokenOfOwnerByIndex(deployer.address, i);
      const tokenURI = await simpleNFT.tokenURI(tokenId);
      const tokenType = await simpleNFT.getTokenTypeName(tokenId);
      
      console.log(`- NFT #${tokenId}: Type: ${tokenType}, URI: ${tokenURI.substring(0, 50)}...`);
    }
    
    console.log("\nYou can now use these NFTs in the marketplace!");
    
  } catch (error) {
    console.error("Error minting NFTs:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
