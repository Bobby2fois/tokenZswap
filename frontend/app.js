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

// Store user balances
let userTokenABalance = '0';
let userTokenBBalance = '0';
let userLPBalance = '0';

// Store pool reserves
let reserveA = '0';
let reserveB = '0';

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

// Validate swap amount input
function validateSwapAmount() {
    const swapDirection = document.getElementById('swapDirection').value;
    const swapAmount = document.getElementById('swapAmount').value;
    const approveSwapButton = document.getElementById('approveSwap');
    
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
        return; // Empty or zero input, no validation needed yet
    }
    
    const amountWei = web3.utils.toWei(swapAmount, 'ether');
    
    // Check if amount exceeds 10% of pool reserves
    const relevantReserve = swapDirection === 'AtoB' ? reserveA : reserveB;
    const tenPercentOfReserve = web3.utils.toBN(relevantReserve).div(web3.utils.toBN('10')); // 10% of reserve
    
    if (web3.utils.toBN(amountWei).gt(tenPercentOfReserve)) {
        // Amount exceeds 10% of pool reserves
        document.getElementById('swapStatus').textContent = 
            `Amount exceeds 10% of pool reserves. Maximum allowed: ${parseFloat(web3.utils.fromWei(tenPercentOfReserve.toString(), 'ether')).toFixed(6)} tokens.`;
        document.getElementById('swapStatus').classList.remove('hidden');
        document.getElementById('swapStatus').classList.add('error');
        approveSwapButton.disabled = true;
        approveSwapButton.style.opacity = '0.5';
    } else {
        // Amount is valid
        document.getElementById('swapStatus').classList.add('hidden');
        approveSwapButton.disabled = false;
        approveSwapButton.style.opacity = '1';
    }
}

// Validate add liquidity amounts
function validateAddLiquidityAmounts() {
    const amountA = document.getElementById('addAmountA').value;
    const amountB = document.getElementById('addAmountB').value;
    const approveTokenAButton = document.getElementById('approveTokenA');
    const approveTokenBButton = document.getElementById('approveTokenB');
    
    // Validate Token A amount
    if (amountA && parseFloat(amountA) > 0) {
        const amountAWei = web3.utils.toWei(amountA, 'ether');
        if (web3.utils.toBN(amountAWei).gt(web3.utils.toBN(userTokenABalance))) {
            document.getElementById('addLiquidityStatus').textContent = 
                `Insufficient Token A balance. You have ${parseFloat(web3.utils.fromWei(userTokenABalance, 'ether')).toFixed(6)} tokens available.`;
            document.getElementById('addLiquidityStatus').classList.remove('hidden');
            document.getElementById('addLiquidityStatus').classList.add('error');
            approveTokenAButton.disabled = true;
            approveTokenAButton.style.opacity = '0.5';
        } else {
            approveTokenAButton.disabled = false;
            approveTokenAButton.style.opacity = '1';
            // Only hide the error if Token B is also valid or empty
            if (!amountB || parseFloat(amountB) <= 0 || 
                !web3.utils.toBN(web3.utils.toWei(amountB, 'ether')).gt(web3.utils.toBN(userTokenBBalance))) {
                document.getElementById('addLiquidityStatus').classList.add('hidden');
            }
        }
    }
    
    // Validate Token B amount
    if (amountB && parseFloat(amountB) > 0) {
        const amountBWei = web3.utils.toWei(amountB, 'ether');
        if (web3.utils.toBN(amountBWei).gt(web3.utils.toBN(userTokenBBalance))) {
            document.getElementById('addLiquidityStatus').textContent = 
                `Insufficient Token B balance. You have ${parseFloat(web3.utils.fromWei(userTokenBBalance, 'ether')).toFixed(6)} tokens available.`;
            document.getElementById('addLiquidityStatus').classList.remove('hidden');
            document.getElementById('addLiquidityStatus').classList.add('error');
            approveTokenBButton.disabled = true;
            approveTokenBButton.style.opacity = '0.5';
        } else {
            approveTokenBButton.disabled = false;
            approveTokenBButton.style.opacity = '1';
            // Only hide the error if Token A is also valid or empty
            if (!amountA || parseFloat(amountA) <= 0 || 
                !web3.utils.toBN(web3.utils.toWei(amountA, 'ether')).gt(web3.utils.toBN(userTokenABalance))) {
                document.getElementById('addLiquidityStatus').classList.add('hidden');
            }
        }
    }
}

// Validate remove liquidity amount
function validateRemoveLiquidityAmount() {
    const lpAmount = document.getElementById('removeAmount').value;
    const removeLiquidityButton = document.getElementById('removeLiquidity');
    
    if (!lpAmount || parseFloat(lpAmount) <= 0) {
        return; // Empty or zero input, no validation needed yet
    }
    
    const lpAmountWei = web3.utils.toWei(lpAmount, 'ether');
    
    if (web3.utils.toBN(lpAmountWei).gt(web3.utils.toBN(userLPBalance))) {
        // Amount exceeds balance
        document.getElementById('removeLiquidityStatus').textContent = 
            `Insufficient LP token balance. You have ${parseFloat(web3.utils.fromWei(userLPBalance, 'ether')).toFixed(6)} LP tokens available.`;
        document.getElementById('removeLiquidityStatus').classList.remove('hidden');
        document.getElementById('removeLiquidityStatus').classList.add('error');
        removeLiquidityButton.disabled = true;
        removeLiquidityButton.style.opacity = '0.5';
    } else {
        // Amount is valid
        document.getElementById('removeLiquidityStatus').classList.add('hidden');
        removeLiquidityButton.disabled = false;
        removeLiquidityButton.style.opacity = '1';
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
        // Store raw reserves in wei
        reserveA = reserves[0];
        reserveB = reserves[1];
        
        // Display formatted reserves
        const reserveAFormatted = web3.utils.fromWei(reserves[0], 'ether');
        const reserveBFormatted = web3.utils.fromWei(reserves[1], 'ether');
        document.getElementById('reserveA').textContent = parseFloat(reserveAFormatted).toFixed(6);
        document.getElementById('reserveB').textContent = parseFloat(reserveBFormatted).toFixed(6);
        
        // Get user balances
        if (accounts && accounts.length > 0) {
            // Get LP token balance
            const lpBalance = await tokenSwapContract.methods.balanceOf(accounts[0]).call();
            userLPBalance = lpBalance;
            document.getElementById('lpBalance').textContent = parseFloat(web3.utils.fromWei(lpBalance, 'ether')).toFixed(6);
            
            // Get token A balance
            const tokenABalance = await tokenAContract.methods.balanceOf(accounts[0]).call();
            userTokenABalance = tokenABalance;
            document.getElementById('tokenABalance').textContent = parseFloat(web3.utils.fromWei(tokenABalance, 'ether')).toFixed(6);
            
            // Get token B balance
            const tokenBBalance = await tokenBContract.methods.balanceOf(accounts[0]).call();
            userTokenBBalance = tokenBBalance;
            document.getElementById('tokenBBalance').textContent = parseFloat(web3.utils.fromWei(tokenBBalance, 'ether')).toFixed(6);
            
            // Validate all input fields after balance update
            validateSwapAmount();
            validateAddLiquidityAmounts();
            validateRemoveLiquidityAmount();
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
        
        // First try to use the global reserves we already have
        let currentReserveA = reserveA;
        let currentReserveB = reserveB;
        
        // If we don't have reserves yet, try to fetch them
        if (currentReserveA === '0' || currentReserveB === '0') {
            try {
                const reserves = await tokenSwapContract.methods.getReserves().call();
                currentReserveA = reserves[0];
                currentReserveB = reserves[1];
            } catch (reserveError) {
                console.error("Error fetching reserves:", reserveError);
                document.getElementById('estimatedOutput').textContent = 'Calculating...';
                // Don't return here, try to use the getAmountOut function directly
            }
        }
        
        // Try to calculate the output amount
        let amountOut;
        try {
            if (swapDirection === 'AtoB') {
                amountOut = await tokenSwapContract.methods.getAmountOut(amountIn, currentReserveA, currentReserveB).call();
            } else {
                amountOut = await tokenSwapContract.methods.getAmountOut(amountIn, currentReserveB, currentReserveA).call();
            }
            
            document.getElementById('estimatedOutput').textContent = parseFloat(web3.utils.fromWei(amountOut, 'ether')).toFixed(6);
            
            // Clear any previous error status
            document.getElementById('swapStatus').classList.add('hidden');
        } catch (calcError) {
            console.error("Error calculating amount out:", calcError);
            
            // Show a more user-friendly error message
            document.getElementById('estimatedOutput').textContent = 'Calculating...';
            document.getElementById('swapStatus').textContent = 'Network issue: Estimated output temporarily unavailable. You can still proceed with the swap.';
            document.getElementById('swapStatus').classList.remove('hidden');
            document.getElementById('swapStatus').classList.add('warning');
        }
    } catch (error) {
        console.error("Error calculating estimated output:", error);
        document.getElementById('estimatedOutput').textContent = 'Calculating...';
        document.getElementById('swapStatus').textContent = 'Network issue: Estimated output temporarily unavailable. You can still proceed with the swap.';
        document.getElementById('swapStatus').classList.remove('hidden');
        document.getElementById('swapStatus').classList.add('warning');
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
        
        // Check if amount exceeds 10% of pool reserves
        const amountIn = web3.utils.toWei(swapAmount, 'ether');
        const relevantReserve = swapDirection === 'AtoB' ? reserveA : reserveB;
        const tenPercentOfReserve = web3.utils.toBN(relevantReserve).div(web3.utils.toBN('10')); // 10% of reserve
        
        if (web3.utils.toBN(amountIn).gt(tenPercentOfReserve)) {
            alert(`Amount exceeds 10% of pool reserves. Maximum allowed: ${parseFloat(web3.utils.fromWei(tenPercentOfReserve.toString(), 'ether')).toFixed(6)} tokens.`);
            return;
        }
        
        // Also check user balance
        const userBalance = swapDirection === 'AtoB' ? userTokenABalance : userTokenBBalance;
        if (web3.utils.toBN(amountIn).gt(web3.utils.toBN(userBalance))) {
            alert(`Insufficient balance. You have ${parseFloat(web3.utils.fromWei(userBalance, 'ether')).toFixed(6)} tokens available.`);
            return;
        }
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
        
        // Validate that user has enough tokens before approving
        const amountAWei = web3.utils.toWei(amountA, 'ether');
        
        if (web3.utils.toBN(amountAWei).gt(web3.utils.toBN(userTokenABalance))) {
            alert(`Insufficient Token A balance. You have ${parseFloat(web3.utils.fromWei(userTokenABalance, 'ether')).toFixed(6)} tokens available.`);
            return;
        }
        
        document.getElementById('addLiquidityStatus').textContent = 'Approving Token A...';
        document.getElementById('addLiquidityStatus').classList.remove('hidden');
        document.getElementById('addLiquidityStatus').classList.remove('error', 'success');
        
        await tokenAContract.methods.approve(TOKEN_SWAP_ADDRESS, amountAWei).send({ from: accounts[0] });
        
        // Set token A as approved and update button state
        tokenAApproved = true;
        updateAddLiquidityButtonState();
        
        document.getElementById('addLiquidityStatus').textContent = 'Token A approved!';
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
        
        // Validate that user has enough tokens before approving
        const amountBWei = web3.utils.toWei(amountB, 'ether');
        
        if (web3.utils.toBN(amountBWei).gt(web3.utils.toBN(userTokenBBalance))) {
            alert(`Insufficient Token B balance. You have ${parseFloat(web3.utils.fromWei(userTokenBBalance, 'ether')).toFixed(6)} tokens available.`);
            return;
        }
        
        document.getElementById('addLiquidityStatus').textContent = 'Approving Token B...';
        document.getElementById('addLiquidityStatus').classList.remove('hidden');
        document.getElementById('addLiquidityStatus').classList.remove('error', 'success');
        
        await tokenBContract.methods.approve(TOKEN_SWAP_ADDRESS, amountBWei).send({ from: accounts[0] });
        
        // Set token B as approved and update button state
        tokenBApproved = true;
        updateAddLiquidityButtonState();
        
        document.getElementById('addLiquidityStatus').textContent = 'Token B approved!';
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
        const lpAmount = document.getElementById('removeAmount').value;
        
        if (!lpAmount || parseFloat(lpAmount) <= 0) {
            alert("Please enter a valid amount of LP tokens to burn");
            return;
        }
        
        // Validate that user has enough LP tokens before removing liquidity
        const lpAmountWei = web3.utils.toWei(lpAmount, 'ether');
        
        if (web3.utils.toBN(lpAmountWei).gt(web3.utils.toBN(userLPBalance))) {
            alert(`Insufficient LP token balance. You have ${parseFloat(web3.utils.fromWei(userLPBalance, 'ether')).toFixed(6)} LP tokens available.`);
            return;
        }
        
        const removeAmountWei = web3.utils.toWei(lpAmount, 'ether');
        
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
        // Validate swap amount after direction change
        validateSwapAmount();
    });
    document.getElementById('swapAmount').addEventListener('input', () => {
        calculateEstimatedOutput();
        // Reset swap approval when amount changes
        swapApproved = false;
        updateSwapButtonState();
        // Validate swap amount as user types
        validateSwapAmount();
    });
    document.getElementById('approveSwap').addEventListener('click', approveSwap);
    document.getElementById('executeSwap').addEventListener('click', executeSwap);
    
    // Liquidity
    document.getElementById('approveTokenA').addEventListener('click', approveTokenA);
    document.getElementById('approveTokenB').addEventListener('click', approveTokenB);
    document.getElementById('addLiquidity').addEventListener('click', addLiquidity);
    
    // Reset approval status and validate when input amounts change
    document.getElementById('addAmountA').addEventListener('input', () => {
        tokenAApproved = false;
        updateAddLiquidityButtonState();
        validateAddLiquidityAmounts();
    });
    document.getElementById('addAmountB').addEventListener('input', () => {
        tokenBApproved = false;
        updateAddLiquidityButtonState();
        validateAddLiquidityAmounts();
    });
    
    // Validate remove liquidity amount as user types
    document.getElementById('removeAmount').addEventListener('input', validateRemoveLiquidityAmount);
    
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
