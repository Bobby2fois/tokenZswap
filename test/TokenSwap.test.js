const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSwap", function () {
  let tokenA;
  let tokenB;
  let tokenSwap;
  let owner;
  let user1;
  let user2;
  
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  
  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy test tokens
    const TestToken = await ethers.getContractFactory("TestToken");
    tokenA = await TestToken.deploy("Token A", "TKA", 1000000);
    tokenB = await TestToken.deploy("Token B", "TKB", 1000000);
    
    // Deploy TokenSwap
    const TokenSwap = await ethers.getContractFactory("TokenSwap");
    tokenSwap = await TokenSwap.deploy(await tokenA.getAddress(), await tokenB.getAddress());
    
    // Transfer tokens to users for testing
    await tokenA.transfer(user1.address, ethers.parseEther("10000"));
    await tokenB.transfer(user1.address, ethers.parseEther("10000"));
    await tokenA.transfer(user2.address, ethers.parseEther("10000"));
    await tokenB.transfer(user2.address, ethers.parseEther("10000"));
  });
  
  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await tokenSwap.tokenA()).to.equal(await tokenA.getAddress());
      expect(await tokenSwap.tokenB()).to.equal(await tokenB.getAddress());
    });
  });
  
  describe("Liquidity", function () {
    it("Should add initial liquidity correctly", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("1000");
      
      // Approve tokens
      await tokenA.connect(user1).approve(await tokenSwap.getAddress(), amountA);
      await tokenB.connect(user1).approve(await tokenSwap.getAddress(), amountB);
      
      // Add liquidity
      const tx = await tokenSwap.connect(user1).addLiquidity(amountA, amountB);
      await tx.wait();
      
      // Check reserves
      const [reserveA, reserveB] = await tokenSwap.getReserves();
      expect(reserveA).to.equal(amountA);
      expect(reserveB).to.equal(amountB);
      
      // Check LP tokens
      const lpBalance = await tokenSwap.balanceOf(user1.address);
      expect(lpBalance).to.be.gt(0);
    });
    
    it("Should remove liquidity correctly", async function () {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("1000");
      
      // Add liquidity first
      await tokenA.connect(user1).approve(await tokenSwap.getAddress(), amountA);
      await tokenB.connect(user1).approve(await tokenSwap.getAddress(), amountB);
      await tokenSwap.connect(user1).addLiquidity(amountA, amountB);
      
      // Get LP balance
      const lpBalance = await tokenSwap.balanceOf(user1.address);
      
      // Get initial token balances
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);
      
      // Remove liquidity
      await tokenSwap.connect(user1).removeLiquidity(lpBalance);
      
      // Check if tokens were returned
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);
      
      expect(finalTokenABalance).to.be.gt(initialTokenABalance);
      expect(finalTokenBBalance).to.be.gt(initialTokenBBalance);
      
      // LP tokens should be burned
      expect(await tokenSwap.balanceOf(user1.address)).to.equal(0);
    });
  });
  
  describe("Swaps", function () {
    beforeEach(async function () {
      // Add initial liquidity
      const amountA = ethers.parseEther("10000");
      const amountB = ethers.parseEther("10000");
      
      await tokenA.approve(await tokenSwap.getAddress(), amountA);
      await tokenB.approve(await tokenSwap.getAddress(), amountB);
      await tokenSwap.addLiquidity(amountA, amountB);
    });
    
    it("Should swap token A for token B correctly", async function () {
      const swapAmount = ethers.parseEther("100");
      
      // Get initial balances
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);
      
      // Approve and swap
      await tokenA.connect(user1).approve(await tokenSwap.getAddress(), swapAmount);
      await tokenSwap.connect(user1).swapAForB(swapAmount);
      
      // Check final balances
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);
      
      expect(finalTokenABalance).to.equal(initialTokenABalance - swapAmount);
      expect(finalTokenBBalance).to.be.gt(initialTokenBBalance);
    });
    
    it("Should swap token B for token A correctly", async function () {
      const swapAmount = ethers.parseEther("100");
      
      // Get initial balances
      const initialTokenABalance = await tokenA.balanceOf(user1.address);
      const initialTokenBBalance = await tokenB.balanceOf(user1.address);
      
      // Approve and swap
      await tokenB.connect(user1).approve(await tokenSwap.getAddress(), swapAmount);
      await tokenSwap.connect(user1).swapBForA(swapAmount);
      
      // Check final balances
      const finalTokenABalance = await tokenA.balanceOf(user1.address);
      const finalTokenBBalance = await tokenB.balanceOf(user1.address);
      
      expect(finalTokenBBalance).to.equal(initialTokenBBalance - swapAmount);
      expect(finalTokenABalance).to.be.gt(initialTokenABalance);
    });
  });
});
