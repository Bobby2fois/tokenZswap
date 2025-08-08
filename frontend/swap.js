// TokenSwap AMM Swap JavaScript

// Contract addresses - update these after deployment
const TOKEN_SWAP_ADDRESS = '0xB19fF8294BEb8ADD0e66E349990d1fa2FE9759Ff';
const TOKEN_A_ADDRESS = '0x7aD4eB0A626eeFFedc0E383ABA4cD79E31233587';
const TOKEN_B_ADDRESS = '0xC34521aD8c8e0028baB8C05f8980217B0B7C17F5';

// Default slippage tolerance (1.0%)
let slippageTolerance = 1.0;

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
let swapApproved = false;

// Store user balances
let userTokenABalance = '0';
let userTokenBBalance = '0';
let userLPBalance = '0';

// Store pool reserves
let reserveA = '0';
let reserveB = '0';

// Swap direction (default: A to B)
let swapDirection = 'AtoB';

// Function to update Swap button state
function updateSwapButtonState() {
    const approveSwapButton = document.getElementById('approveSwap');
    const executeSwapButton = document.getElementById('executeSwap');
    
    if (swapApproved) {
        approveSwapButton.classList.add('hidden');
        executeSwapButton.classList.remove('hidden');
        executeSwapButton.disabled = false; // Enable the execute button when approved
    } else {
        approveSwapButton.classList.remove('hidden');
        executeSwapButton.classList.add('hidden');
    }
}

// Validate swap amount input
function validateSwapAmount() {
    const swapAmount = document.getElementById('swapAmount').value;
    const statusElement = document.getElementById('swapStatus');
    const approveSwapButton = document.getElementById('approveSwap');
    const executeSwapButton = document.getElementById('executeSwap');
    const estimatedOutputElement = document.getElementById('estimatedOutput');
    const slippageWarningElement = document.getElementById('slippageWarning');
    
    // Clear any existing slippage warnings
    if (slippageWarningElement) {
        slippageWarningElement.classList.add('hidden');
    }
    
    if (!swapAmount || swapAmount.trim() === '') {
        // Input is empty, hide error message and clear estimated output
        statusElement.classList.add('hidden');
        estimatedOutputElement.value = '0.0';
        approveSwapButton.disabled = true;
        executeSwapButton.disabled = true;
        return;
    }
    
    if (parseFloat(swapAmount) <= 0) {
        statusElement.textContent = 'Please enter a valid amount to swap.';
        statusElement.classList.remove('hidden');
        statusElement.classList.add('error');
        approveSwapButton.disabled = true;
        executeSwapButton.disabled = true;
        return;
    }
    
    const swapAmountWei = web3.utils.toWei(swapAmount, 'ether');
    
    // Check if user has enough balance
    const fromBalance = swapDirection === 'AtoB' ? userTokenABalance : userTokenBBalance;
    if (web3.utils.toBN(swapAmountWei).gt(web3.utils.toBN(fromBalance))) {
        const tokenSymbol = swapDirection === 'AtoB' ? 'A' : 'B';
        statusElement.textContent = `Insufficient Token ${tokenSymbol} balance. You have ${parseFloat(web3.utils.fromWei(fromBalance, 'ether')).toFixed(6)} tokens available.`;
        statusElement.classList.remove('hidden');
        statusElement.classList.add('error');
        approveSwapButton.disabled = true;
        executeSwapButton.disabled = true;
        return;
    }
    
    // Check if swap amount is too large (exceeds 10% of pool reserves)
    const fromReserve = swapDirection === 'AtoB' ? reserveA : reserveB;
    const tenPercentOfReserve = web3.utils.toBN(fromReserve).div(web3.utils.toBN('10'));
    
    if (web3.utils.toBN(swapAmountWei).gt(tenPercentOfReserve)) {
        const tokenSymbol = swapDirection === 'AtoB' ? 'A' : 'B';
        statusElement.textContent = `Swap amount exceeds 10% of pool reserve for Token ${tokenSymbol}. Maximum allowed: ${parseFloat(web3.utils.fromWei(tenPercentOfReserve, 'ether')).toFixed(6)} tokens.`;
        statusElement.classList.remove('hidden');
        statusElement.classList.add('error');
        approveSwapButton.disabled = true;
        executeSwapButton.disabled = true;
        return;
    }
    
    // Basic validations passed
    statusElement.classList.add('hidden');
    
    // Initially enable buttons (may be disabled by calculateEstimatedOutput if price impact is too high)
    approveSwapButton.disabled = false;
    executeSwapButton.disabled = true;
    
    // Calculate estimated output - this will check price impact and may disable the approve button
    calculateEstimatedOutput();
}

// Elements
const connectWalletBtn = document.getElementById('connectWallet');
const userAddressSpan = document.getElementById('userAddress');
const walletInfo = document.getElementById('walletInfo');
const mainContent = document.getElementById('mainContent');
const swapContainer = document.getElementById('swapContainer');

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
            
            // Show main content with new layout
            mainContent.classList.remove('hidden');
            swapContainer.classList.remove('hidden');
            
            // Update connect button
            connectWalletBtn.textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            connectWalletBtn.classList.add('wallet-connected');
            
            // Change the click event to copy address when connected
            connectWalletBtn.removeEventListener('click', connectWallet);
            connectWalletBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(accounts[0])
                    .then(() => {
                        // Show temporary feedback
                        const originalText = connectWalletBtn.textContent;
                        connectWalletBtn.textContent = 'Address Copied!';
                        setTimeout(() => {
                            connectWalletBtn.textContent = originalText;
                        }, 1500);
                    })
                    .catch(err => {
                        console.error('Failed to copy address: ', err);
                    });
            });
            
            // Store connection status
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('lastConnectedAccount', accounts[0]);
            
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
        
        // Update UI
        document.getElementById('reserveA').textContent = parseFloat(web3.utils.fromWei(reserveA, 'ether')).toFixed(6);
        document.getElementById('reserveB').textContent = parseFloat(web3.utils.fromWei(reserveB, 'ether')).toFixed(6);
        document.getElementById('lpBalance').textContent = parseFloat(web3.utils.fromWei(lpBalance, 'ether')).toFixed(6);
        document.getElementById('tokenABalance').textContent = parseFloat(web3.utils.fromWei(tokenABalance, 'ether')).toFixed(6);
        document.getElementById('tokenBBalance').textContent = parseFloat(web3.utils.fromWei(tokenBBalance, 'ether')).toFixed(6);
        
        // Update balance displays in the swap section
        updateSwapBalanceDisplay();
        
        console.log('Pool info updated');
    } catch (error) {
        console.error('Error updating pool info:', error);
    }
}

// Update swap balance display based on current swap direction
function updateSwapBalanceDisplay() {
    const fromBalance = document.getElementById('fromBalance');
    const toBalance = document.getElementById('toBalance');
    
    if (swapDirection === 'AtoB') {
        fromBalance.textContent = `Balance: ${parseFloat(web3.utils.fromWei(userTokenABalance, 'ether')).toFixed(6)}`;
        toBalance.textContent = `Balance: ${parseFloat(web3.utils.fromWei(userTokenBBalance, 'ether')).toFixed(6)}`;
        document.getElementById('fromTokenSymbol').textContent = 'Token A';
        document.getElementById('toTokenSymbol').textContent = 'Token B';
    } else {
        fromBalance.textContent = `Balance: ${parseFloat(web3.utils.fromWei(userTokenBBalance, 'ether')).toFixed(6)}`;
        toBalance.textContent = `Balance: ${parseFloat(web3.utils.fromWei(userTokenABalance, 'ether')).toFixed(6)}`;
        document.getElementById('fromTokenSymbol').textContent = 'Token B';
        document.getElementById('toTokenSymbol').textContent = 'Token A';
    }
}

// Calculate estimated output amount for swap
function calculateEstimatedOutput(swapAmount) {
    // If swapAmount is not provided, get it from the input field
    if (!swapAmount) {
        swapAmount = document.getElementById('swapAmount').value;
    }
    
    const estimatedOutputElement = document.getElementById('estimatedOutput');
    const slippageWarningElement = document.getElementById('slippageWarning');
    
    if (!swapAmount || parseFloat(swapAmount) <= 0 || !web3) {
        estimatedOutputElement.value = '0.0';
        if (slippageWarningElement) slippageWarningElement.classList.add('hidden');
        return;
    }
    
    const swapAmountWei = web3.utils.toWei(swapAmount, 'ether');
    
    try {
        // Calculate output based on x * y = k formula
        // (reserveIn * reserveOut) / (reserveIn + amountIn) = reserveOut - amountOut
        // amountOut = reserveOut - (reserveIn * reserveOut) / (reserveIn + amountIn)
        
        let reserveIn, reserveOut;
        if (swapDirection === 'AtoB') {
            reserveIn = web3.utils.toBN(reserveA);
            reserveOut = web3.utils.toBN(reserveB);
        } else {
            reserveIn = web3.utils.toBN(reserveB);
            reserveOut = web3.utils.toBN(reserveA);
        }
        
        const amountIn = web3.utils.toBN(swapAmountWei);
        
        // Check if reserves are valid
        if (reserveIn.isZero() || reserveOut.isZero()) {
            estimatedOutputElement.value = '0.0';
            if (slippageWarningElement) slippageWarningElement.classList.add('hidden');
            return;
        }
        
        // Calculate numerator and denominator separately to avoid overflow
        const numerator = reserveIn.mul(reserveOut);
        const denominator = reserveIn.add(amountIn);
        
        // Calculate amountOut
        const amountOut = reserveOut.sub(numerator.div(denominator));
        
        // Apply 0.3% fee
        const amountOutWithFee = amountOut.mul(web3.utils.toBN('997')).div(web3.utils.toBN('1000'));
        
        // Calculate minimum output based on slippage tolerance
        const slippageMultiplier = Math.floor((100 - slippageTolerance) * 1000) / 1000;
        const minAmountOut = amountOutWithFee.mul(web3.utils.toBN(Math.floor(slippageMultiplier * 1000))).div(web3.utils.toBN('1000'));
        
        // Check if the swap would exceed 10% of the pool reserves (existing protection)
        const tenPercentOfReserve = reserveIn.div(web3.utils.toBN('10'));
        const exceedsPoolLimit = amountIn.gt(tenPercentOfReserve);
        
        // Calculate price impact
        const priceImpact = amountIn.mul(web3.utils.toBN('10000')).div(reserveIn).toNumber() / 100;
        
        // Display estimated output
        const estimatedOutput = parseFloat(web3.utils.fromWei(amountOutWithFee, 'ether')).toFixed(6);
        estimatedOutputElement.value = estimatedOutput;
        
        // We still calculate minAmountOut for the swap execution, but don't display it
        // The minAmountOut value will be used when executing the swap
        
        // Show slippage warning if price impact is high and disable approve button
        const approveButton = document.getElementById('approveSwap');
        const highPriceImpact = priceImpact > slippageTolerance * 2 || exceedsPoolLimit;
        
        if (slippageWarningElement) {
            if (highPriceImpact) {
                slippageWarningElement.textContent = 'High price impact! Consider reducing swap amount or increasing slippage tolerance.';
                slippageWarningElement.classList.remove('hidden');
                
                // Disable approve button
                if (approveButton) {
                    approveButton.disabled = true;
                    approveButton.title = 'Price impact exceeds slippage tolerance';
                }
            } else {
                slippageWarningElement.classList.add('hidden');
                
                // Re-enable approve button if other conditions are met
                if (approveButton && !approveButton.disabled) {
                    approveButton.removeAttribute('title');
                }
            }
        }
    } catch (error) {
        console.error('Error calculating estimated output:', error);
        estimatedOutputElement.value = 'Error';
        if (slippageWarningElement) slippageWarningElement.classList.add('hidden');
    }
}

// Approve token for swap
async function approveSwap() {
    try {
        const swapAmount = document.getElementById('swapAmount').value;
        
        if (!swapAmount || parseFloat(swapAmount) <= 0) {
            alert("Please enter a valid amount to swap");
            return;
        }
        
        const swapAmountWei = web3.utils.toWei(swapAmount, 'ether');
        
        document.getElementById('swapStatus').textContent = 'Approving token...';
        document.getElementById('swapStatus').classList.remove('hidden');
        document.getElementById('swapStatus').classList.remove('error', 'success');
        
        // Approve token based on swap direction
        if (swapDirection === 'AtoB') {
            await tokenAContract.methods.approve(TOKEN_SWAP_ADDRESS, swapAmountWei).send({ from: accounts[0] });
        } else {
            await tokenBContract.methods.approve(TOKEN_SWAP_ADDRESS, swapAmountWei).send({ from: accounts[0] });
        }
        
        swapApproved = true;
        updateSwapButtonState();
        
        document.getElementById('swapStatus').textContent = 'Token approved! Click Swap to execute.';
        document.getElementById('swapStatus').classList.add('success');
    } catch (error) {
        console.error("Error approving token:", error);
        document.getElementById('swapStatus').textContent = 'Error: ' + error.message;
        document.getElementById('swapStatus').classList.add('error');
    }
}

// Execute swap
async function executeSwap() {
    try {
        const swapAmount = document.getElementById('swapAmount').value;
        
        if (!swapAmount || parseFloat(swapAmount) <= 0) {
            alert("Please enter a valid amount to swap");
            return;
        }
        
        const swapAmountWei = web3.utils.toWei(swapAmount, 'ether');
        
        document.getElementById('swapStatus').textContent = 'Executing swap...';
        document.getElementById('swapStatus').classList.remove('hidden');
        document.getElementById('swapStatus').classList.remove('error', 'success');
        
        // Execute swap based on direction
        if (swapDirection === 'AtoB') {
            await tokenSwapContract.methods.swapAForB(swapAmountWei).send({ from: accounts[0] });
        } else {
            await tokenSwapContract.methods.swapBForA(swapAmountWei).send({ from: accounts[0] });
        }
        
        document.getElementById('swapStatus').textContent = 'Swap executed successfully!';
        document.getElementById('swapStatus').classList.add('success');
        
        // Reset approval status
        swapApproved = false;
        updateSwapButtonState();
        
        // Update pool info
        updatePoolInfo();
        
        // Clear input
        document.getElementById('swapAmount').value = '';
        document.getElementById('estimatedOutput').value = '';
    } catch (error) {
        console.error("Error executing swap:", error);
        document.getElementById('swapStatus').textContent = 'Error: ' + error.message;
        document.getElementById('swapStatus').classList.add('error');
    }
}

// Toggle swap direction
function toggleSwapDirection() {
    // Toggle direction
    swapDirection = swapDirection === 'AtoB' ? 'BtoA' : 'AtoB';
    
    // Update hidden select for compatibility
    document.getElementById('swapDirection').value = swapDirection;
    
    // Update UI
    updateSwapBalanceDisplay();
    
    // Reset approval status
    swapApproved = false;
    updateSwapButtonState();
    
    // Recalculate estimated output if there's an input amount
    calculateEstimatedOutput();
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
                localStorage.setItem('lastConnectedAccount', accounts[0]);
                
                // Update connect button
                connectWalletBtn.textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
                connectWalletBtn.classList.add('wallet-connected');
                
                // Make sure the click event is updated
                connectWalletBtn.removeEventListener('click', connectWallet);
                connectWalletBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(accounts[0])
                        .then(() => {
                            const originalText = connectWalletBtn.textContent;
                            connectWalletBtn.textContent = 'Address Copied!';
                            setTimeout(() => {
                                connectWalletBtn.textContent = originalText;
                            }, 1500);
                        })
                        .catch(err => {
                            console.error('Failed to copy address: ', err);
                        });
                });
                
                // Reset approval status
                swapApproved = false;
                updateSwapButtonState();
                
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

// Slippage settings functions
function toggleSettingsDropdown() {
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    } else {
        console.error('Dropdown element not found!');
    }
}

function setSlippage(value) {
    slippageTolerance = parseFloat(value);
    
    // Update UI to show active slippage option
    const slippageOptions = document.querySelectorAll('.slippage-option');
    slippageOptions.forEach(option => {
        if (parseFloat(option.getAttribute('data-slippage')) === slippageTolerance) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Clear custom input if a preset is selected
    document.getElementById('customSlippage').value = '';
    
    // If we have a swap amount entered, recalculate the estimated output
    const swapAmount = document.getElementById('swapAmount').value;
    if (swapAmount && parseFloat(swapAmount) > 0) {
        calculateEstimatedOutput(swapAmount);
    }
}

function setCustomSlippage(event) {
    const customInput = event ? event.target : document.getElementById('customSlippage');
    let value = parseFloat(customInput.value);
    
    // Enforce valid range: 0.1 to 100
    if (isNaN(value) || value < 0.1) {
        value = 0.1;
        customInput.value = '0.1';
    } else if (value > 100) {
        value = 100;
        customInput.value = '100';
    }
    
    slippageTolerance = value;
    
    // Remove active class from preset options
    const slippageOptions = document.querySelectorAll('.slippage-option');
    slippageOptions.forEach(option => {
        option.classList.remove('active');
    });
    
    // If we have a swap amount entered, recalculate the estimated output
    const swapAmount = document.getElementById('swapAmount').value;
    if (swapAmount && parseFloat(swapAmount) > 0) {
        calculateEstimatedOutput(swapAmount);
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('settingsDropdown');
    const settingsIcon = document.querySelector('.settings-icon');
    
    // Only close the dropdown if:
    // 1. The dropdown is open
    // 2. The click is outside the dropdown
    // 3. The click is not on the settings icon (which toggles the dropdown)
    if (dropdown && dropdown.classList.contains('show') && 
        !dropdown.contains(event.target) && 
        !settingsIcon.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

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
    
    // Refresh pool data
    document.getElementById('refreshPool').addEventListener('click', updatePoolInfo);
    
    // Swap amount input event
    document.getElementById('swapAmount').addEventListener('input', validateSwapAmount);
    
    // Add keydown event listener to restrict input to numbers and decimal point only
    document.getElementById('swapAmount').addEventListener('keydown', validateNumericInput);
    
    // Swap direction button event
    document.getElementById('swapDirectionButton').addEventListener('click', toggleSwapDirection);
    
    // Swap direction select event (for compatibility)
    document.getElementById('swapDirection').addEventListener('change', (e) => {
        swapDirection = e.target.value;
        updateSwapBalanceDisplay();
        calculateEstimatedOutput();
    });
    
    // Approve and execute swap buttons
    document.getElementById('approveSwap').addEventListener('click', approveSwap);
    document.getElementById('executeSwap').addEventListener('click', executeSwap);

    // Initialize buttons - make sure they're disabled by default
    document.getElementById('approveSwap').disabled = true;
    document.getElementById('executeSwap').disabled = true;


    // Set up slippage settings event listeners
    const settingsIcon = document.querySelector('.settings-icon');
    
    if (settingsIcon) {
        settingsIcon.addEventListener('click', function(event) {
            event.stopPropagation();
            toggleSettingsDropdown();
        });
    } else {
        console.error('Settings icon not found in the DOM!');
    }

    // Set up slippage option buttons
    const slippageOptions = document.querySelectorAll('.slippage-option');
    slippageOptions.forEach(option => {
        option.addEventListener('click', function(event) {
            // Prevent the click from bubbling up to document
            event.stopPropagation();
            const value = this.getAttribute('data-slippage');
            setSlippage(value);
        });
    });

    // Set up custom slippage input
    const customSlippage = document.getElementById('customSlippage');
    if (customSlippage) {
        customSlippage.addEventListener('input', function(event) {
            // Prevent the input from bubbling up to document
            event.stopPropagation();
            setCustomSlippage(event);
        });
        
        // Also prevent clicks on the input from closing the dropdown
        customSlippage.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
});
