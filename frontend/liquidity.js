// TokenSwap AMM Liquidity Management JavaScript

// Function to validate numeric input - only allow digits and decimal point
function validateNumericInput(event) {
    // Allow: backspace, delete, tab, escape, enter
    if (event.keyCode === 8 || event.keyCode === 46 || event.keyCode === 9 || 
        event.keyCode === 27 || event.keyCode === 13 || 
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (event.keyCode === 65 && event.ctrlKey === true) || 
        (event.keyCode === 67 && event.ctrlKey === true) || 
        (event.keyCode === 86 && event.ctrlKey === true) || 
        (event.keyCode === 88 && event.ctrlKey === true) || 
        // Allow: home, end, left, right
        (event.keyCode >= 35 && event.keyCode <= 39)) {
        // let it happen, don't do anything
        return;
    }
    
    // Allow decimal point (.) but only if there isn't already one in the input
    if (event.key === '.' && event.target.value.indexOf('.') > -1) {
        event.preventDefault();
        return;
    }
    
    // Ensure that it is a number or decimal point and stop the keypress if not
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && 
        (event.keyCode < 96 || event.keyCode > 105) && event.key !== '.') {
        event.preventDefault();
    }
}

// Contract addresses - update these after deployment
const TOKEN_SWAP_ADDRESS = '0x3F3EE5C0aC30cCC0953f89ADf18D71D92828B5FB';
const TOKEN_A_ADDRESS = '0x20dE2Eb1aE8525F3ad0599faA2Bc46497c5B7249';
const TOKEN_B_ADDRESS = '0x2261d1Ba09a0e62887dcFf7C625098fdbE69fC5e';

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

// Store user balances
let userTokenABalance = '0';
let userTokenBBalance = '0';
let userLPBalance = '0';

// Store pool reserves
let reserveA = '0';
let reserveB = '0';

// Function to update liquidity action button state
function updateLiquidityActionButtonState() {
    const liquidityActionButton = document.getElementById('liquidityActionButton');
    
    // Check if the button exists before trying to update it
    if (!liquidityActionButton) {
        console.warn('Liquidity action button not found in the DOM');
        return;
    }
    
    // Check if there are values in the input fields
    const amountA = document.getElementById('addAmountA').value;
    const amountB = document.getElementById('addAmountB').value;
    
    // Disable button if no values are entered
    if (!amountA || !amountB) {
        liquidityActionButton.disabled = true;
        return;
    }
    
    // Enable button if values are entered
    liquidityActionButton.disabled = false;
    
    // Update button text based on approval status
    if (tokenAApproved && tokenBApproved) {
        liquidityActionButton.textContent = 'Add Liquidity';
    } else {
        liquidityActionButton.textContent = 'Approve Tokens';
    }
}

// Validate add liquidity amounts
function validateAddLiquidityAmounts() {
    const amountA = document.getElementById('addAmountA').value;
    const amountB = document.getElementById('addAmountB').value;
    const statusElement = document.getElementById('addLiquidityStatus');
    
    // If both fields are empty, don't show an error (user is just starting or cleared the form)
    if (!amountA && !amountB) {
        statusElement.classList.add('hidden');
        updateLiquidityActionButtonState(); // This will disable the button
        return;
    }
    
    // If any field has an invalid value (after user has started typing), show error
    if (parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
        statusElement.textContent = 'Please enter valid amounts for both tokens.';
        statusElement.classList.remove('hidden');
        statusElement.classList.add('error');
        updateLiquidityActionButtonState(); // This will disable the button
        return;
    }
    
    // If we get here, the values are valid
    statusElement.classList.add('hidden');
    updateLiquidityActionButtonState(); // This will enable the button if values are valid
    
    const amountAWei = web3.utils.toWei(amountA, 'ether');
    const amountBWei = web3.utils.toWei(amountB, 'ether');
    
    // Check if user has enough balance
    if (web3.utils.toBN(amountAWei).gt(web3.utils.toBN(userTokenABalance))) {
        statusElement.textContent = `Insufficient Token A balance. You have ${parseFloat(web3.utils.fromWei(userTokenABalance, 'ether')).toFixed(6)} tokens available.`;
        statusElement.classList.remove('hidden');
        statusElement.classList.add('error');
        liquidityActionButton.disabled = true;
        return;
    }
    
    if (web3.utils.toBN(amountBWei).gt(web3.utils.toBN(userTokenBBalance))) {
        statusElement.textContent = `Insufficient Token B balance. You have ${parseFloat(web3.utils.fromWei(userTokenBBalance, 'ether')).toFixed(6)} tokens available.`;
        statusElement.classList.remove('hidden');
        statusElement.classList.add('error');
        liquidityActionButton.disabled = true;
        return;
    }
    
    // All validations passed
    statusElement.classList.add('hidden');
    liquidityActionButton.disabled = false;
}

// Validate remove liquidity amount
function validateRemoveLiquidityAmount() {
    const removeAmount = document.getElementById('removeAmount').value;
    const statusElement = document.getElementById('removeLiquidityStatus');
    const removeLiquidityButton = document.getElementById('removeLiquidity');
    
    // If field is empty, don't show an error (user is just starting or cleared the form)
    if (!removeAmount) {
        statusElement.classList.add('hidden');
        removeLiquidityButton.disabled = true;
        return;
    }
    
    // If field has an invalid value (after user has started typing), show error
    if (parseFloat(removeAmount) <= 0) {
        statusElement.textContent = 'Please enter a valid amount of LP tokens to burn.';
        statusElement.classList.remove('hidden');
        statusElement.classList.add('error');
        removeLiquidityButton.disabled = true;
        return;
    }
    
    const removeAmountWei = web3.utils.toWei(removeAmount, 'ether');
    
    // Check if user has enough LP tokens
    if (web3.utils.toBN(removeAmountWei).gt(web3.utils.toBN(userLPBalance))) {
        statusElement.textContent = `Insufficient LP tokens. You have ${parseFloat(web3.utils.fromWei(userLPBalance, 'ether')).toFixed(6)} LP tokens available.`;
        statusElement.classList.remove('hidden');
        statusElement.classList.add('error');
        removeLiquidityButton.disabled = true;
        return;
    }
    
    // All validations passed
    statusElement.classList.add('hidden');
    removeLiquidityButton.disabled = false;
}

// Elements
const connectWalletBtn = document.getElementById('connectWallet');
const userAddressSpan = document.getElementById('userAddress');
const walletInfo = document.getElementById('walletInfo');
const addLiquidityContainer = document.getElementById('addLiquidityContainer');
const removeLiquidityContainer = document.getElementById('removeLiquidityContainer');

// Connect wallet function
async function connectWallet() {
    try {
        // Check if MetaMask is installed
        if (window.ethereum) {
            // Request account access
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Initialize Web3
            web3 = new Web3(window.ethereum);
            
            // Initialize contracts
            tokenSwapContract = new web3.eth.Contract(TOKEN_SWAP_ABI, TOKEN_SWAP_ADDRESS);
            tokenAContract = new web3.eth.Contract(ERC20_ABI, TOKEN_A_ADDRESS);
            tokenBContract = new web3.eth.Contract(ERC20_ABI, TOKEN_B_ADDRESS);
            
            // Show wallet info
            walletInfo.classList.remove('hidden');
            userAddressSpan.textContent = accounts[0];
            
            // Show liquidity containers
            addLiquidityContainer.classList.remove('hidden');
            removeLiquidityContainer.classList.remove('hidden');
            
            // Update connect button
            connectWalletBtn.textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            connectWalletBtn.disabled = true;
            connectWalletBtn.classList.add('connected');
            
            // Store connection status
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('lastConnectedAccount', accounts[0]);
            
            // Set up liquidity action button event listener now that the container is visible
            const liquidityActionButton = document.getElementById('liquidityActionButton');
            if (liquidityActionButton) {
                liquidityActionButton.addEventListener('click', handleLiquidityAction);
                console.log('Liquidity action button event listener added');
            } else {
                console.error('liquidityActionButton element not found after wallet connection');
            }
            
            // Update pool info
            updatePoolInfo();
            
            console.log('Wallet connected:', accounts[0]);
        } else {
            alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet: ' + error.message);
    }
}

// Update pool information
async function updatePoolInfo() {
    try {
        if (!web3 || !accounts.length) return;
        
        // Get pool reserves
        const reserves = await tokenSwapContract.methods.getReserves().call();
        reserveA = reserves[0];
        reserveB = reserves[1];
        
        // Get user balances
        const [tokenABalance, tokenBBalance, lpBalance] = await Promise.all([
            tokenAContract.methods.balanceOf(accounts[0]).call(),
            tokenBContract.methods.balanceOf(accounts[0]).call(),
            tokenSwapContract.methods.balanceOf(accounts[0]).call()
        ]);
        
        userTokenABalance = tokenABalance;
        userTokenBBalance = tokenBBalance;
        userLPBalance = lpBalance;
        
        // Update hidden elements for internal use
        document.getElementById('reserveA').textContent = parseFloat(web3.utils.fromWei(reserveA, 'ether')).toFixed(6);
        document.getElementById('reserveB').textContent = parseFloat(web3.utils.fromWei(reserveB, 'ether')).toFixed(6);
        document.getElementById('lpBalance').textContent = parseFloat(web3.utils.fromWei(lpBalance, 'ether')).toFixed(6);
        document.getElementById('tokenABalance').textContent = parseFloat(web3.utils.fromWei(tokenABalance, 'ether')).toFixed(6);
        document.getElementById('tokenBBalance').textContent = parseFloat(web3.utils.fromWei(tokenBBalance, 'ether')).toFixed(6);
        
        // Update balance displays in the add liquidity section
        document.getElementById('addTokenABalance').textContent = `Balance: ${parseFloat(web3.utils.fromWei(tokenABalance, 'ether')).toFixed(6)}`;
        document.getElementById('addTokenBBalance').textContent = `Balance: ${parseFloat(web3.utils.fromWei(tokenBBalance, 'ether')).toFixed(6)}`;
        
        // Update LP token balance in remove liquidity section
        document.getElementById('lpTokenBalance').textContent = `Balance: ${parseFloat(web3.utils.fromWei(lpBalance, 'ether')).toFixed(6)}`;
        
        // Check if pool has liquidity and update UI accordingly
        checkPoolLiquidityStatus();
        
        // If user was entering Token A amount, recalculate Token B
        if (document.getElementById('addAmountA').value) {
            calculateTokenBAmount();
        }
        
        console.log('Pool info updated');
    } catch (error) {
        console.error('Error updating pool info:', error);
    }
}

// Calculate Token B amount based on Token A input and current pool ratio
function calculateTokenBAmount() {
    const amountAInput = document.getElementById('addAmountA');
    const amountBInput = document.getElementById('addAmountB');
    
    // Only calculate if pool already has liquidity
    if (web3.utils.toBN(reserveA).isZero() || web3.utils.toBN(reserveB).isZero()) {
        return;
    }
    
    const amountA = amountAInput.value;
    
    if (!amountA || parseFloat(amountA) <= 0) {
        amountBInput.value = '';
        return;
    }
    
    try {
        // Convert to wei for precise calculation
        const amountAWei = web3.utils.toWei(amountA, 'ether');
        
        // Calculate based on current pool ratio: amountB = amountA * (reserveB / reserveA)
        const ratio = web3.utils.toBN(reserveB).mul(web3.utils.toBN('1000000000000000000')).div(web3.utils.toBN(reserveA));
        const amountBWei = web3.utils.toBN(amountAWei).mul(ratio).div(web3.utils.toBN('1000000000000000000'));
        
        // Convert back to ether and update the input
        const amountBEther = web3.utils.fromWei(amountBWei.toString(), 'ether');
        amountBInput.value = parseFloat(amountBEther).toFixed(6);
    } catch (error) {
        console.error('Error calculating Token B amount:', error);
        amountBInput.value = 'Error';
    }
}

// Check if pool has liquidity and update UI accordingly
function checkPoolLiquidityStatus() {
    const amountBInput = document.getElementById('addAmountB');
    
    if (web3.utils.toBN(reserveA).isZero() || web3.utils.toBN(reserveB).isZero()) {
        // First liquidity addition - both inputs are editable
        amountBInput.readOnly = false;
        amountBInput.classList.remove('auto-calculated');
    } else {
        // Pool already has liquidity - Token B input is auto-calculated
        amountBInput.readOnly = true;
        amountBInput.classList.add('auto-calculated');
    }
}

// Handle liquidity action (both approvals and adding liquidity)
async function handleLiquidityAction() {
    try {
        const amountA = document.getElementById('addAmountA').value;
        const amountB = document.getElementById('addAmountB').value;
        
        if (!amountA || parseFloat(amountA) <= 0 || !amountB || parseFloat(amountB) <= 0) {
            alert("Please enter valid amounts for both tokens");
            return;
        }
        
        const amountAWei = web3.utils.toWei(amountA, 'ether');
        const amountBWei = web3.utils.toWei(amountB, 'ether');
        
        // Check balances
        if (web3.utils.toBN(amountAWei).gt(web3.utils.toBN(userTokenABalance))) {
            alert(`Insufficient Token A balance. You have ${parseFloat(web3.utils.fromWei(userTokenABalance, 'ether')).toFixed(6)} tokens available.`);
            return;
        }
        
        if (web3.utils.toBN(amountBWei).gt(web3.utils.toBN(userTokenBBalance))) {
            alert(`Insufficient Token B balance. You have ${parseFloat(web3.utils.fromWei(userTokenBBalance, 'ether')).toFixed(6)} tokens available.`);
            return;
        }
        
        const statusElement = document.getElementById('addLiquidityStatus');
        statusElement.classList.remove('hidden');
        statusElement.classList.remove('error', 'success');
        
        // If both tokens are already approved, add liquidity
        if (tokenAApproved && tokenBApproved) {
            statusElement.textContent = 'Adding liquidity...';
            
            await tokenSwapContract.methods.addLiquidity(amountAWei, amountBWei).send({ from: accounts[0] });
            
            statusElement.textContent = 'Liquidity added successfully!';
            statusElement.classList.add('success');
            
            // Reset approval status after successful liquidity addition
            tokenAApproved = false;
            tokenBApproved = false;
            updateLiquidityActionButtonState();
            
            // Update pool info
            updatePoolInfo();
        } else {
            // Approve tokens
            if (!tokenAApproved) {
                statusElement.textContent = 'Approving Token A...';
                
                await tokenAContract.methods.approve(TOKEN_SWAP_ADDRESS, amountAWei).send({ from: accounts[0] });
                
                tokenAApproved = true;
                statusElement.textContent = 'Token A approved!';
                
                // If Token B is still not approved, update button state and return
                if (!tokenBApproved) {
                    statusElement.textContent = 'Token A approved! Now approving Token B...';
                    updateLiquidityActionButtonState();
                    
                    await tokenBContract.methods.approve(TOKEN_SWAP_ADDRESS, amountBWei).send({ from: accounts[0] });
                    
                    tokenBApproved = true;
                    statusElement.textContent = 'Both tokens approved! Click again to add liquidity.';
                    statusElement.classList.add('success');
                    updateLiquidityActionButtonState();
                }
            } else if (!tokenBApproved) {
                statusElement.textContent = 'Approving Token B...';
                
                await tokenBContract.methods.approve(TOKEN_SWAP_ADDRESS, amountBWei).send({ from: accounts[0] });
                
                tokenBApproved = true;
                statusElement.textContent = 'Token B approved! Click again to add liquidity.';
                statusElement.classList.add('success');
                updateLiquidityActionButtonState();
            }
        }
    } catch (error) {
        console.error("Error in liquidity action:", error);
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
        
        // Check if user has enough LP tokens
        if (web3.utils.toBN(removeAmountWei).gt(web3.utils.toBN(userLPBalance))) {
            alert(`Insufficient LP tokens. You have ${parseFloat(web3.utils.fromWei(userLPBalance, 'ether')).toFixed(6)} LP tokens available.`);
            return;
        }
        
        document.getElementById('removeLiquidityStatus').textContent = 'Removing liquidity...';
        document.getElementById('removeLiquidityStatus').classList.remove('hidden');
        document.getElementById('removeLiquidityStatus').classList.remove('error', 'success');
        
        await tokenSwapContract.methods.removeLiquidity(removeAmountWei).send({ from: accounts[0] });
        
        document.getElementById('removeLiquidityStatus').textContent = 'Liquidity removed successfully!';
        document.getElementById('removeLiquidityStatus').classList.add('success');
        
        // Update pool info
        updatePoolInfo();
    } catch (error) {
        console.error("Error removing liquidity:", error);
        document.getElementById('removeLiquidityStatus').textContent = 'Error: ' + error.message;
        document.getElementById('removeLiquidityStatus').classList.add('error');
    }
}

// Setup wallet event listeners
function setupWalletEventListeners() {
    if (window.ethereum) {
        // Handle account changes
        window.ethereum.on('accountsChanged', async (newAccounts) => {
            console.log('Account changed:', newAccounts);
            if (newAccounts.length === 0) {
                // User disconnected their wallet
                localStorage.removeItem('walletConnected');
                localStorage.removeItem('lastConnectedAccount');
                // Reload the page to reset the UI
                window.location.reload();
            } else {
                // Update the account and UI
                accounts = newAccounts;
                userAddressSpan.textContent = accounts[0];
                localStorage.setItem('lastConnectedAccount', accounts[0]);
                
                // Update connect button
                connectWalletBtn.textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
                connectWalletBtn.disabled = true;
                connectWalletBtn.classList.add('connected');
                
                // Reload data with new account
                updatePoolInfo();
            }
        });
        
        // Handle chain changes
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('Network changed:', chainId);
            // Reload the page when the chain changes
            window.location.reload();
        });
        
        // Handle disconnect
        window.ethereum.on('disconnect', (error) => {
            console.log('Wallet disconnected:', error);
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('lastConnectedAccount');
            window.location.reload();
        });
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Load ABIs first
    await loadAbis();
    
    // Check if wallet was previously connected
    if (localStorage.getItem('walletConnected') === 'true') {
        console.log('Wallet was previously connected, attempting to reconnect...');
        await connectWallet();
    }
    
    // Connect wallet button event
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Setup wallet events
    setupWalletEventListeners();
    
    // Reset approval status and validate when input amounts change
    document.getElementById('addAmountA').addEventListener('input', () => {
        tokenAApproved = false;
        updateLiquidityActionButtonState();
        calculateTokenBAmount();
        validateAddLiquidityAmounts();
    });
    document.getElementById('addAmountB').addEventListener('input', () => {
        // Only allow manual input if this is the first liquidity addition (no reserves yet)
        if (reserveA === '0' && reserveB === '0') {
            tokenBApproved = false;
            updateLiquidityActionButtonState();
            validateAddLiquidityAmounts();
        }
    });
    
    // Validate remove liquidity amount as user types
    document.getElementById('removeAmount').addEventListener('input', validateRemoveLiquidityAmount);
    document.getElementById('removeLiquidity').addEventListener('click', removeLiquidity);
    
    // Add keydown event listeners to restrict input to numbers and decimal point only
    document.getElementById('addAmountA').addEventListener('keydown', validateNumericInput);
    document.getElementById('addAmountB').addEventListener('keydown', validateNumericInput);
    document.getElementById('removeAmount').addEventListener('keydown', validateNumericInput);
    
    // Initialize buttons - make sure they're disabled by default
    const liquidityActionButton = document.getElementById('liquidityActionButton');
    if (liquidityActionButton) {
        liquidityActionButton.disabled = true;
    }
    document.getElementById('removeLiquidity').disabled = true;
    
    // Update button states based on current values
    updateLiquidityActionButtonState();
    
    // Check if pool already has liquidity and update UI accordingly
    checkPoolLiquidityStatus();
});
