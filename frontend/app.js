// TokenSwap AMM Frontend JavaScript

// Contract addresses - update these after deployment
const TOKEN_SWAP_ADDRESS = '0xf6409bf7B6f0AD04eA0299a00b143c208166b8A7';
const TOKEN_A_ADDRESS = '0x186856b5B97Caf654dc51aE46c33757304b5BdFE';
const TOKEN_B_ADDRESS = '0x14974761C8e06ACf6906bf7efC90B608EbFfb058';

// ABIs - will be loaded from JSON files
let TOKEN_SWAP_ABI;
let ERC20_ABI;

// Load ABIs from JSON files
async function loadAbis() {
    try {
        const [tokenSwapResponse, erc20Response] = await Promise.all([
            fetch('./abi/TokenSwap.json'),
            fetch('./abi/ERC20.json')
        ]);
        
        TOKEN_SWAP_ABI = await tokenSwapResponse.json();
        ERC20_ABI = await erc20Response.json();
        
        console.log('ABIs loaded successfully');
    } catch (error) {
        console.error('Error loading ABIs:', error);
        alert('Failed to load contract ABIs. Please check the console for details.');
    }
}

// Global variables
let web3;
let accounts = [];
let tokenSwapContract;
let tokenAContract;
let tokenBContract;

// Track token approval status
let tokenAApproved = false;
let tokenBApproved = false;
let swapApproved = false;

// Function to update Add Liquidity button state
function updateAddLiquidityButtonState() {
    const addLiquidityButton = document.getElementById('addLiquidity');
    if (tokenAApproved && tokenBApproved) {
        addLiquidityButton.disabled = false;
        addLiquidityButton.style.opacity = '1';
    } else {
        addLiquidityButton.disabled = true;
        addLiquidityButton.style.opacity = '0.5';
    }
}

// Function to update Swap button state
function updateSwapButtonState() {
    const executeSwapButton = document.getElementById('executeSwap');
    if (swapApproved) {
        executeSwapButton.disabled = false;
        executeSwapButton.style.opacity = '1';
    } else {
        executeSwapButton.disabled = true;
        executeSwapButton.style.opacity = '0.5';
    }
}
let tokenADecimals = 18;
let tokenBDecimals = 18;

// Elements
const connectWalletBtn = document.getElementById('connectWallet');
const walletInfo = document.getElementById('walletInfo');
const userAddressSpan = document.getElementById('userAddress');
const poolInfoContainer = document.getElementById('poolInfoContainer');
const swapContainer = document.getElementById('swapContainer');
const liquidityContainer = document.getElementById('liquidityContainer');

// Connect to MetaMask
async function connectWallet() {
    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum);
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (accounts.length > 0) {
                userAddressSpan.textContent = accounts[0];
                walletInfo.classList.remove('hidden');
                
                // Initialize contracts
                tokenSwapContract = new web3.eth.Contract(TOKEN_SWAP_ABI, TOKEN_SWAP_ADDRESS);
                tokenAContract = new web3.eth.Contract(ERC20_ABI, TOKEN_A_ADDRESS);
                tokenBContract = new web3.eth.Contract(ERC20_ABI, TOKEN_B_ADDRESS);
                
                // We know both tokens have 18 decimals
                tokenADecimals = 18;
                tokenBDecimals = 18;
                
                // Show other containers
                poolInfoContainer.classList.remove('hidden');
                swapContainer.classList.remove('hidden');
                liquidityContainer.classList.remove('hidden');
                
                // Load initial data
                updatePoolInfo();
            }
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Failed to connect to MetaMask. Please make sure it's installed and unlocked.");
        }
    } else {
        alert("MetaMask is not installed. Please install MetaMask to use this application.");
    }
}

// Update pool information
async function updatePoolInfo() {
    try {
        // Get reserves
        const reserves = await tokenSwapContract.methods.getReserves().call();
        const reserveA = web3.utils.fromWei(reserves[0], 'ether');
        const reserveB = web3.utils.fromWei(reserves[1], 'ether');
        document.getElementById('reserveA').textContent = parseFloat(reserveA).toFixed(6);
        document.getElementById('reserveB').textContent = parseFloat(reserveB).toFixed(6);
        
        // Get user balances
        if (accounts && accounts.length > 0) {
            // Get LP token balance
            const lpBalance = await tokenSwapContract.methods.balanceOf(accounts[0]).call();
            document.getElementById('lpBalance').textContent = parseFloat(web3.utils.fromWei(lpBalance, 'ether')).toFixed(6);
            
            // Get token A balance
            const tokenABalance = await tokenAContract.methods.balanceOf(accounts[0]).call();
            document.getElementById('tokenABalance').textContent = parseFloat(web3.utils.fromWei(tokenABalance, 'ether')).toFixed(6);
            
            // Get token B balance
            const tokenBBalance = await tokenBContract.methods.balanceOf(accounts[0]).call();
            document.getElementById('tokenBBalance').textContent = parseFloat(web3.utils.fromWei(tokenBBalance, 'ether')).toFixed(6);
        }
    } catch (error) {
        console.error("Error updating pool info:", error);
    }
}

// Calculate estimated output amount for swap
async function calculateEstimatedOutput() {
    try {
        const swapDirection = document.getElementById('swapDirection').value;
        const swapAmount = document.getElementById('swapAmount').value;
        
        if (!swapAmount || parseFloat(swapAmount) <= 0) {
            document.getElementById('estimatedOutput').textContent = '0';
            return;
        }
        
        const amountIn = web3.utils.toWei(swapAmount, 'ether');
        const reserves = await tokenSwapContract.methods.getReserves().call();
        
        let amountOut;
        if (swapDirection === 'AtoB') {
            amountOut = await tokenSwapContract.methods.getAmountOut(amountIn, reserves[0], reserves[1]).call();
        } else {
            amountOut = await tokenSwapContract.methods.getAmountOut(amountIn, reserves[1], reserves[0]).call();
        }
        
        document.getElementById('estimatedOutput').textContent = parseFloat(web3.utils.fromWei(amountOut, 'ether')).toFixed(6);
    } catch (error) {
        console.error("Error calculating estimated output:", error);
        document.getElementById('estimatedOutput').textContent = 'Error';
    }
}

// Approve token for swap
async function approveSwap() {
    try {
        const swapDirection = document.getElementById('swapDirection').value;
        const swapAmount = document.getElementById('swapAmount').value;
        
        if (!swapAmount || parseFloat(swapAmount) <= 0) {
            alert("Please enter a valid amount to swap");
            return;
        }
        
        const amountIn = web3.utils.toWei(swapAmount, 'ether');
        const tokenContract = swapDirection === 'AtoB' ? tokenAContract : tokenBContract;
        
        document.getElementById('swapStatus').textContent = 'Approving...';
        document.getElementById('swapStatus').classList.remove('hidden');
        document.getElementById('swapStatus').classList.remove('error', 'success');
        
        await tokenContract.methods.approve(TOKEN_SWAP_ADDRESS, amountIn).send({ from: accounts[0] });
        
        // Set swap as approved and update button state
        swapApproved = true;
        updateSwapButtonState();
        
        document.getElementById('swapStatus').textContent = 'Approved! You can now execute the swap.';
        document.getElementById('swapStatus').classList.add('success');
    } catch (error) {
        console.error("Error approving token for swap:", error);
        document.getElementById('swapStatus').textContent = 'Error: ' + error.message;
        document.getElementById('swapStatus').classList.add('error');
    }
}

// Execute swap
async function executeSwap() {
    try {
        const swapDirection = document.getElementById('swapDirection').value;
        const swapAmount = document.getElementById('swapAmount').value;
        
        if (!swapAmount || parseFloat(swapAmount) <= 0) {
            alert("Please enter a valid amount to swap");
            return;
        }
        
        const amountIn = web3.utils.toWei(swapAmount, 'ether');
        
        document.getElementById('swapStatus').textContent = 'Swapping...';
        document.getElementById('swapStatus').classList.remove('hidden');
        document.getElementById('swapStatus').classList.remove('error', 'success');
        
        if (swapDirection === 'AtoB') {
            await tokenSwapContract.methods.swapAForB(amountIn).send({ from: accounts[0] });
        } else {
            await tokenSwapContract.methods.swapBForA(amountIn).send({ from: accounts[0] });
        }
        
        document.getElementById('swapStatus').textContent = 'Swap executed successfully!';
        document.getElementById('swapStatus').classList.add('success');
        
        // Reset approval status after successful swap
        swapApproved = false;
        updateSwapButtonState();
        
        // Update pool info after swap
        updatePoolInfo();
    } catch (error) {
        console.error("Error executing swap:", error);
        document.getElementById('swapStatus').textContent = 'Error: ' + error.message;
        document.getElementById('swapStatus').classList.add('error');
    }
}

// Approve token A for adding liquidity
async function approveTokenA() {
    try {
        const amountA = document.getElementById('addAmountA').value;
        
        if (!amountA || parseFloat(amountA) <= 0) {
            alert("Please enter a valid amount for Token A");
            return;
        }
        
        const amountAWei = web3.utils.toWei(amountA, 'ether');
        
        document.getElementById('addLiquidityStatus').textContent = 'Approving Token A...';
        document.getElementById('addLiquidityStatus').classList.remove('hidden');
        document.getElementById('addLiquidityStatus').classList.remove('error', 'success');
        
        await tokenAContract.methods.approve(TOKEN_SWAP_ADDRESS, amountAWei).send({ from: accounts[0] });
        
        // Set token A as approved and update button state
        tokenAApproved = true;
        updateAddLiquidityButtonState();
        
        document.getElementById('addLiquidityStatus').textContent = 'Token A approved! Now approve Token B.';
        document.getElementById('addLiquidityStatus').classList.add('success');
    } catch (error) {
        console.error("Error approving Token A:", error);
        document.getElementById('addLiquidityStatus').textContent = 'Error: ' + error.message;
        document.getElementById('addLiquidityStatus').classList.add('error');
    }
}

// Approve token B for adding liquidity
async function approveTokenB() {
    try {
        const amountB = document.getElementById('addAmountB').value;
        
        if (!amountB || parseFloat(amountB) <= 0) {
            alert("Please enter a valid amount for Token B");
            return;
        }
        
        const amountBWei = web3.utils.toWei(amountB, 'ether');
        
        document.getElementById('addLiquidityStatus').textContent = 'Approving Token B...';
        document.getElementById('addLiquidityStatus').classList.remove('hidden');
        document.getElementById('addLiquidityStatus').classList.remove('error', 'success');
        
        await tokenBContract.methods.approve(TOKEN_SWAP_ADDRESS, amountBWei).send({ from: accounts[0] });
        
        // Set token B as approved and update button state
        tokenBApproved = true;
        updateAddLiquidityButtonState();
        
        document.getElementById('addLiquidityStatus').textContent = 'Token B approved! You can now add liquidity.';
        document.getElementById('addLiquidityStatus').classList.add('success');
    } catch (error) {
        console.error("Error approving Token B:", error);
        document.getElementById('addLiquidityStatus').textContent = 'Error: ' + error.message;
        document.getElementById('addLiquidityStatus').classList.add('error');
    }
}

// Add liquidity
async function addLiquidity() {
    try {
        const amountA = document.getElementById('addAmountA').value;
        const amountB = document.getElementById('addAmountB').value;
        
        if (!amountA || parseFloat(amountA) <= 0 || !amountB || parseFloat(amountB) <= 0) {
            alert("Please enter valid amounts for both tokens");
            return;
        }
        
        const amountAWei = web3.utils.toWei(amountA, 'ether');
        const amountBWei = web3.utils.toWei(amountB, 'ether');
        
        document.getElementById('addLiquidityStatus').textContent = 'Adding liquidity...';
        document.getElementById('addLiquidityStatus').classList.remove('hidden');
        document.getElementById('addLiquidityStatus').classList.remove('error', 'success');
        
        await tokenSwapContract.methods.addLiquidity(amountAWei, amountBWei).send({ from: accounts[0] });
        
        document.getElementById('addLiquidityStatus').textContent = 'Liquidity added successfully!';
        document.getElementById('addLiquidityStatus').classList.add('success');
        
        // Reset approval status after successful liquidity addition
        tokenAApproved = false;
        tokenBApproved = false;
        updateAddLiquidityButtonState();
        
        // Update pool info
        updatePoolInfo();
    } catch (error) {
        console.error("Error adding liquidity:", error);
        document.getElementById('addLiquidityStatus').textContent = 'Error: ' + error.message;
        document.getElementById('addLiquidityStatus').classList.add('error');
    }
}

// Remove liquidity
async function removeLiquidity() {
    try {
        const removeAmount = document.getElementById('removeAmount').value;
        
        if (!removeAmount || parseFloat(removeAmount) <= 0) {
            alert("Please enter a valid amount of LP tokens to burn");
            return;
        }
        
        const removeAmountWei = web3.utils.toWei(removeAmount, 'ether');
        
        document.getElementById('removeLiquidityStatus').textContent = 'Removing liquidity...';
        document.getElementById('removeLiquidityStatus').classList.remove('hidden');
        document.getElementById('removeLiquidityStatus').classList.remove('error', 'success');
        
        const tx = await tokenSwapContract.methods.removeLiquidity(removeAmountWei).send({ from: accounts[0] });
        
        document.getElementById('removeLiquidityStatus').textContent = 'Liquidity removed successfully! Transaction hash: ' + tx.transactionHash;
        document.getElementById('removeLiquidityStatus').classList.add('success');
        
        // Update pool info after removing liquidity
        updatePoolInfo();
    } catch (error) {
        console.error("Error removing liquidity:", error);
        document.getElementById('removeLiquidityStatus').textContent = 'Error: ' + error.message;
        document.getElementById('removeLiquidityStatus').classList.add('error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Load ABIs first
    await loadAbis();
    // Connect wallet
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Refresh pool data
    document.getElementById('refreshPool').addEventListener('click', updatePoolInfo);
    
    // Swap
    document.getElementById('swapDirection').addEventListener('change', () => {
        calculateEstimatedOutput();
        // Reset swap approval when direction changes
        swapApproved = false;
        updateSwapButtonState();
    });
    document.getElementById('swapAmount').addEventListener('input', () => {
        calculateEstimatedOutput();
        // Reset swap approval when amount changes
        swapApproved = false;
        updateSwapButtonState();
    });
    document.getElementById('approveSwap').addEventListener('click', approveSwap);
    document.getElementById('executeSwap').addEventListener('click', executeSwap);
    
    // Liquidity
    document.getElementById('approveTokenA').addEventListener('click', approveTokenA);
    document.getElementById('approveTokenB').addEventListener('click', approveTokenB);
    document.getElementById('addLiquidity').addEventListener('click', addLiquidity);
    
    // Reset approval status when input amounts change
    document.getElementById('addAmountA').addEventListener('input', () => {
        tokenAApproved = false;
        updateAddLiquidityButtonState();
    });
    document.getElementById('addAmountB').addEventListener('input', () => {
        tokenBApproved = false;
        updateAddLiquidityButtonState();
    });
    
    // Initialize buttons as disabled
    updateAddLiquidityButtonState();
    updateSwapButtonState();
    document.getElementById('removeLiquidity').addEventListener('click', removeLiquidity);
    
    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (newAccounts) => {
            accounts = newAccounts;
            if (accounts.length > 0) {
                userAddressSpan.textContent = accounts[0];
                updatePoolInfo();
            } else {
                walletInfo.classList.add('hidden');
                poolInfoContainer.classList.add('hidden');
                swapContainer.classList.add('hidden');
                liquidityContainer.classList.add('hidden');
            }
        });
    }
});
