require ('dotenv').config();
const hre = require("hardhat");

async function main() {
    //Token A
    console.log("Deploying SimpleERC20 contracts...")
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment", error);
    process.exit(1);
  });
