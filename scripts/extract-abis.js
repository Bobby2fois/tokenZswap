// Script to extract ABIs from compiled contracts and save them to the frontend/abi directory
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Extracting ABIs for frontend...");
  
  // Create frontend/abi directory if it doesn't exist
  const abiDir = path.join(__dirname, '../frontend/abi');
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  try {
    // Extract TokenSwap ABI
    const tokenSwapPath = path.join(__dirname, '../artifacts/contracts/TokenSwap.sol/TokenSwap.json');
    const tokenSwapArtifact = JSON.parse(fs.readFileSync(tokenSwapPath, 'utf8'));
    fs.writeFileSync(
      path.join(abiDir, 'TokenSwap.json'),
      JSON.stringify(tokenSwapArtifact.abi, null, 2)
    );
    console.log("✓ TokenSwap ABI extracted");
    
    // Extract ERC20 ABI
    const erc20Path = path.join(__dirname, '../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json');
    const erc20Artifact = JSON.parse(fs.readFileSync(erc20Path, 'utf8'));
    fs.writeFileSync(
      path.join(abiDir, 'ERC20.json'),
      JSON.stringify(erc20Artifact.abi, null, 2)
    );
    console.log("✓ ERC20 ABI extracted");
    
    console.log("\nABIs extracted successfully to frontend/abi directory!");
  } catch (error) {
    console.error("Error extracting ABIs:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
