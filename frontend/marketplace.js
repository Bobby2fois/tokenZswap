// NFT Marketplace JavaScript

// Contract addresses - update these with your deployed contract addresses
const NFT_MARKETPLACE_ADDRESS = "0xcd0EE829D148759608d794952Be6b39fB0E10F88";
const TOKEN_A_ADDRESS = "0x20dE2Eb1aE8525F3ad0599faA2Bc46497c5B7249";
const TOKEN_B_ADDRESS = "0x2261d1Ba09a0e62887dcFf7C625098fdbE69fC5e";
const NFT_ADDRESS = "0x28f89DF716488c5b2d79b7001bBa57De59D6c864";

// ABIs
const NFT_MARKETPLACE_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "_tokenA", "type": "address"}, {"internalType": "address", "name": "_tokenB", "type": "address"}],
        "stateMutability": "nonpayable", "type": "constructor"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "listingId", "type": "uint256"}],
        "name": "buyNFTWithTokenA", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "listingId", "type": "uint256"}],
        "name": "buyNFTWithTokenB", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "listingId", "type": "uint256"}],
        "name": "cancelListing", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [],
        "name": "getActiveListings",
        "outputs": [
            {"internalType": "uint256[]", "name": "", "type": "uint256[]"},
            {"internalType": "address[]", "name": "", "type": "address[]"},
            {"internalType": "address[]", "name": "", "type": "address[]"},
            {"internalType": "uint256[]", "name": "", "type": "uint256[]"},
            {"internalType": "uint256[]", "name": "", "type": "uint256[]"},
            {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
        ],
        "stateMutability": "view", "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "nftContract", "type": "address"},
            {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
            {"internalType": "uint256", "name": "priceTokenA", "type": "uint256"},
            {"internalType": "uint256", "name": "priceTokenB", "type": "uint256"}
        ],
        "name": "listNFT", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "listings",
        "outputs": [
            {"internalType": "address", "name": "seller", "type": "address"},
            {"internalType": "address", "name": "nftContract", "type": "address"},
            {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
            {"internalType": "uint256", "name": "priceTokenA", "type": "uint256"},
            {"internalType": "uint256", "name": "priceTokenB", "type": "uint256"},
            {"internalType": "bool", "name": "active", "type": "bool"}
        ],
        "stateMutability": "view", "type": "function"
    }
];

const ERC721_ABI = [
    {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "uint256", "name": "index", "type": "uint256"}], "name": "tokenOfOwnerByIndex", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "tokenURI", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "ownerOf", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}], "name": "supportsInterface", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "generateSVG", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "tokenColors", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "tokenShapes", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"}
];

const ERC20_ABI = [
    {"inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "approve", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}], "name": "allowance", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}
];

// Global variables
let marketplaceContract;
let nftContract;
let tokenAContract;
let tokenBContract;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('connectButton').addEventListener('click', connectWallet);
    
    // Set up modal close buttons
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeAllModals);
    }
    
    const cancelListingBtn = document.getElementById('cancelListingBtn');
    if (cancelListingBtn) {
        cancelListingBtn.addEventListener('click', closeAllModals);
    }
    
    const cancelBuyBtn = document.getElementById('cancelBuyBtn');
    if (cancelBuyBtn) {
        cancelBuyBtn.addEventListener('click', closeAllModals);
    }
    
    // Make sure only one tab is visible on page load
    // We need to delay this until after wallet connection to avoid errors
    setTimeout(() => {
        openTab('browse');
    }, 100);
    
    // Check if wallet was previously connected
    if (localStorage.getItem('walletConnected') === 'true') {
        console.log('Wallet was previously connected, attempting to reconnect...');
        await connectWallet();
    }
    
    // Initialize modal close buttons
    document.getElementById('closeDetailBtn').addEventListener('click', closeAllModals);
    document.getElementById('cancelListingBtn').addEventListener('click', closeAllModals);
    document.getElementById('cancelBuyBtn').addEventListener('click', closeAllModals);
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
});

// Function to close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Also clear any status messages
    const statusElements = document.querySelectorAll('#listingStatus, #buyStatus');
    statusElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('warning', 'error', 'success');
        element.classList.add('hidden');
    });
}

// Tab functionality
function openTab(tabName) {
    console.log('Opening tab:', tabName);
    closeAllModals();
    
    // Hide all tab contents
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    // Show the selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    } else {
        console.error('Tab not found:', tabName);
        return; // Exit if tab not found
    }
    
    // Highlight the active tab button
    const tabButton = document.getElementById(tabName + 'Btn');
    if (tabButton) {
        tabButton.classList.add('active');
    } else {
        console.error('Tab button not found for:', tabName);
    }
    
    // Only load content if we have a wallet connection
    if (!web3 || !accounts || accounts.length === 0) {
        // Show message to connect wallet first
        const container = document.getElementById(tabName === 'browse' ? 'nftListings' : 
                                               tabName === 'myNFTs' ? 'myNFTsList' : 'myListings');
        if (container) {
            container.innerHTML = '<div class="message">Please connect your wallet to view content</div>';
        }
        return;
    }
    
    try {
        // Load content based on which tab is selected
        if (tabName === 'browse') {
            loadMarketplaceListings();
        } else if (tabName === 'myNFTs') {
            loadMyNFTs();
        } else if (tabName === 'myListings') {
            loadMyListings();
        }
    } catch (error) {
        console.error('Error loading tab content:', error);
    }
}

// Web3 setup
let web3;
let accounts = [];

// BNB Chain Testnet details
const BNB_TESTNET = {
    chainId: '0x61', // 97 in hex
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
    },
    rpcUrls: ['wss://bsc-testnet-rpc.publicnode.com'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
};


// Initialize Web3 with improved configuration
async function initWeb3() {
    if (window.ethereum) {
        // Configure Web3 with higher block gas limit and timeout
        const provider = window.ethereum;
        provider.sendAsync = provider.sendAsync || provider.send;
        
        web3 = new Web3(provider, null, {
            transactionBlockTimeout: 15, // Wait for 15 blocks for transaction
            transactionPollingTimeout: 480, // Poll for 8 minutes
            transactionConfirmationBlocks: 2, // Wait for 2 confirmations
            transactionPollingInterval: 1000 // Check every second
        });
        
        try {
            // Check if we already have permission
            let requestedAccounts;
            try {
                // First try getting accounts to see if already connected
                requestedAccounts = await web3.eth.getAccounts();
                if (requestedAccounts.length === 0) {
                    // If no accounts, request permission
                    requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                }
            } catch (e) {
                // If error, explicitly request permission
                requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            }
            
            accounts = requestedAccounts;
            
            // Check if we're on BNB Testnet
            const chainId = await web3.eth.getChainId();
            if (chainId !== 97) { // 97 is BNB Testnet
                await switchToBNBTestnet();
            }
            
            return true;
        } catch (error) {
            // User denied account access
            console.error("User denied account access or network switch", error);
            return false;
        }
    } else if (window.web3) {
        // Legacy dapp browsers
        web3 = new Web3(window.web3.currentProvider);
        accounts = await web3.eth.getAccounts();
        return true;
    } else {
        alert('Please install MetaMask to use this dApp!');
        return false;
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
                document.getElementById('connectButton').textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
                document.getElementById('userAddress').textContent = accounts[0];
                localStorage.setItem('lastConnectedAccount', accounts[0]);
                
                // Reload data with new account
                await initializeContracts();
                loadMarketplaceListings();
                loadMyNFTs();
                loadMyListings();
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

// Function to switch to BNB Testnet
async function switchToBNBTestnet() {
    try {
        // Try to switch to BNB Testnet
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BNB_TESTNET.chainId }],
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [BNB_TESTNET],
                });
            } catch (addError) {
                console.error("Error adding BNB Testnet:", addError);
                throw addError;
            }
        } else {
            console.error("Error switching to BNB Testnet:", switchError);
            throw switchError;
        }
    }
}

// Connect wallet
async function connectWallet() {
    try {
        if (await initWeb3()) {
            document.getElementById('connectButton').textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            document.getElementById('connectButton').disabled = true;
            
            // Update user address display
            document.getElementById('userAddress').textContent = accounts[0];
            document.getElementById('walletInfo').classList.remove('hidden');
            
            // Save connection state to localStorage
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('lastConnectedAccount', accounts[0]);
            
            // Initialize contracts after wallet connection
            await initializeContracts();
            
            // Now it's safe to load the marketplace data
            setTimeout(() => {
                openTab('browse');
            }, 100);
        } else {
            alert('MetaMask is not installed. Please install it to use this dApp.');
        }
    } catch (error) {
        console.error("Error connecting to wallet:", error);
        alert('Error connecting wallet: ' + error.message);
    }
}

// Setup wallet events after initialization
setupWalletEventListeners();

// Initialize contracts
async function initializeContracts() {
    try {
        if (!web3) {
            console.error('Web3 not initialized');
            return false;
        }
        
        marketplaceContract = new web3.eth.Contract(NFT_MARKETPLACE_ABI, NFT_MARKETPLACE_ADDRESS);
        nftContract = new web3.eth.Contract(ERC721_ABI, NFT_ADDRESS); // Use SimpleNFT as the main NFT contract
        tokenAContract = new web3.eth.Contract(ERC20_ABI, TOKEN_A_ADDRESS);
        tokenBContract = new web3.eth.Contract(ERC20_ABI, TOKEN_B_ADDRESS);
        
        return true;
    } catch (error) {
        console.error('Error initializing contracts:', error);
        return false;
    }
}

// Load marketplace listings
async function loadMarketplaceListings() {
    try {
        const listingsContainer = document.getElementById('nftListings');
        listingsContainer.innerHTML = '<div class="loading">Loading NFTs...</div>';
        
        // Check if contracts are initialized
        if (!marketplaceContract) {
            console.log('Contracts not initialized yet, attempting to initialize...');
            try {
                await initializeContracts();
            } catch (initError) {
                console.error('Failed to initialize contracts:', initError);
                listingsContainer.innerHTML = '<div class="error">Failed to connect to blockchain. Please connect your wallet first.</div>';
                return;
            }
        }
        
        // Now try to get listings
        const listings = await marketplaceContract.methods.getActiveListings().call();
        listingsContainer.innerHTML = '';
        
        if (!listings || !listings[0] || listings[0].length === 0) {
            listingsContainer.innerHTML = '<p>No NFTs currently listed for sale.</p>';
            return;
        }
        
        // Track unique NFTs by their contract address and token ID to prevent duplicates
        const uniqueNFTs = new Map();
        
        for (let i = 0; i < listings[0].length; i++) {
            const listingId = listings[0][i];
            const seller = listings[1][i];
            const nftContractAddress = listings[2][i];
            const tokenId = listings[3][i];
            const priceTokenA = listings[4][i];
            const priceTokenB = listings[5][i];
            
            // Create a unique key for each NFT
            const nftKey = `${nftContractAddress}-${tokenId}`;
            
            // Skip if we've already added this NFT
            if (uniqueNFTs.has(nftKey)) {
                console.log(`Skipping duplicate NFT: ${nftKey}`);
                continue;
            }
            
            // Mark this NFT as processed
            uniqueNFTs.set(nftKey, listingId);
            
            const card = document.createElement('div');
            card.className = 'nft-card';
            card.innerHTML = `<div class="loading">Loading NFT #${tokenId}...</div>`;
            listingsContainer.appendChild(card);
            
            await displayNFTInCard(card, nftContractAddress, tokenId, {
                seller, priceTokenA, priceTokenB, listingId
            });
        }
        
        // If no unique NFTs were found after filtering
        if (uniqueNFTs.size === 0) {
            listingsContainer.innerHTML = '<p>No NFTs currently listed for sale.</p>';
        }
    } catch (error) {
        console.error("Error loading marketplace listings:", error);
        document.getElementById('nftListings').innerHTML = `<div class="error">Error loading NFTs: ${error.message}</div>`;
    }
}

// Display NFT in card
async function displayNFTInCard(cardElement, nftContractAddress, tokenId, listingInfo) {
    try {
        const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
        const jsonString = tokenURI.substring('data:application/json;utf8,'.length);;
        const metadata = JSON.parse(jsonString);
        imageUrl=metadata.image;
        
        cardElement.innerHTML = `
            <div class="nft-image-container">
                <img src="${imageUrl}" alt="${metadata.name}" class="nft-image">
            </div>
            <div class="nft-info">
                <h3>${metadata.name}</h3>
                <p class="nft-description">${metadata.description.substring(0, 50)}${metadata.description.length > 50 ? '...' : ''}</p>
                <div class="nft-price">
                    ${listingInfo.priceTokenA > 0 ? `<div>Price: ${web3.utils.fromWei(listingInfo.priceTokenA, 'ether')} Token A</div>` : ''}
                    ${listingInfo.priceTokenB > 0 ? `<div>Price: ${web3.utils.fromWei(listingInfo.priceTokenB, 'ether')} Token B</div>` : ''}
                </div>
                <div class="nft-seller">
                    <small>Seller: ${listingInfo.seller.substring(0, 6)}...${listingInfo.seller.substring(38)}</small>
                </div>
                <div class="nft-actions">
                    ${(listingInfo.priceTokenA > 0 || listingInfo.priceTokenB > 0) && listingInfo.seller.toLowerCase() !== (accounts[0] || '').toLowerCase() ? 
                        `<button class="btn btn-primary" onclick="openBuyNFTModal('${listingInfo.listingId}')">Buy NFT</button>` : ''}
                    ${listingInfo.seller.toLowerCase() === (accounts[0] || '').toLowerCase() ? 
                        `<button class="btn btn-secondary" onclick="cancelNFTListing('${listingInfo.listingId}')">Cancel Listing</button>` : ''}
                    <button class="btn btn-secondary" onclick="viewNFTDetails('${nftContractAddress}', '${tokenId}')">View Details</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(`Error displaying NFT ${tokenId}:`, error);
        cardElement.innerHTML = `<div class="error">Error loading NFT #${tokenId}</div>`;
    }
}

// View NFT details
async function viewNFTDetails(nftContractAddress, tokenId) {
    try {
        // Close any open modals first
        closeAllModals();
        
        const modal = document.getElementById('nftDetailModal');
        const contentDiv = document.getElementById('nftDetailContent');
        
        // Show loading state
        contentDiv.innerHTML = '<p>Loading NFT details...</p>';
        modal.style.display = 'flex';
        
        // Get NFT metadata
        const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
        const jsonString = tokenURI.substring('data:application/json;utf8,'.length);
        const metadata = JSON.parse(jsonString);
        
        // Get owner
        const owner = await nftContract.methods.ownerOf(tokenId).call();
        
        // Check if NFT is listed
        let listingInfo = null;
        const listings = await marketplaceContract.methods.getActiveListings().call();
        for (let i = 0; i < listings[0].length; i++) {
            if (listings[2][i].toLowerCase() === nftContractAddress.toLowerCase() && 
                listings[3][i] === tokenId) {
                listingInfo = {
                    listingId: listings[0][i],
                    seller: listings[1][i],
                    priceTokenA: listings[4][i],
                    priceTokenB: listings[5][i]
                };
                break;
            }
        }
        
        // Format HTML
        contentDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${metadata.image}" alt="${metadata.name}" style="max-width: 300px; border-radius: 12px;">
            </div>
            <div style="margin-bottom: 20px;">
                <h3>${metadata.name}</h3>
                <p>${metadata.description}</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h4>Properties</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
                    ${metadata.attributes ? metadata.attributes.map(attr => 
                        `<div style="background-color: var(--card-background); padding: 10px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 12px; color: var(--secondary-text-color);">${attr.trait_type}</div>
                            <div style="font-weight: bold;">${attr.value}</div>
                        </div>`
                    ).join('') : 'No properties'}
                </div>
            </div>
            <div>
                <h4>Details</h4>
                <p><strong>Token ID:</strong> ${tokenId}</p>
                <p><strong>Contract:</strong> ${nftContractAddress}</p>
                <p><strong>Owner:</strong> ${owner === NFT_MARKETPLACE_ADDRESS ? 'Listed on Marketplace' : owner}</p>
                ${listingInfo ? `
                    <p><strong>Listed By:</strong> ${listingInfo.seller}</p>
                    <p><strong>Price in Token A:</strong> ${listingInfo.priceTokenA > 0 ? web3.utils.fromWei(listingInfo.priceTokenA, 'ether') : 'Not for sale'}</p>
                    <p><strong>Price in Token B:</strong> ${listingInfo.priceTokenB > 0 ? web3.utils.fromWei(listingInfo.priceTokenB, 'ether') : 'Not for sale'}</p>
                ` : ''}
            </div>
        `;
        
    } catch (error) {
        console.error("Error loading NFT details:", error);
        document.getElementById('nftDetailContent').innerHTML = `<div class="error">Error loading NFT details: ${error.message}</div>`;
    }
}

// Open buy NFT modal
function openBuyNFTModal(listingId) {
    // Close any open modals first
    closeAllModals();
    
    const modal = document.getElementById('buyNFTModal');
    modal.dataset.listingId = listingId;
    modal.style.display = 'flex';
    
    // Set up the modal content
    loadBuyNFTModalContent(listingId);
    
    // Set up button handlers
    document.getElementById('cancelBuyBtn').onclick = closeAllModals;
    document.getElementById('confirmBuyBtn').onclick = buyNFTWithSelectedToken;
}

// Load the buy NFT modal content
async function loadBuyNFTModalContent(listingId) {
    try {
        // Get the listing details
        const listing = await marketplaceContract.methods.listings(listingId).call();
        
        // Get NFT details
        const tokenURI = await nftContract.methods.tokenURI(listing.tokenId).call();
        const metadata = await fetchNFTMetadata(tokenURI);
        
        // Format prices
        const priceTokenA = web3.utils.fromWei(listing.priceTokenA, 'ether');
        const priceTokenB = web3.utils.fromWei(listing.priceTokenB, 'ether');
        
        // Update the modal content
        const buyNFTInfo = document.getElementById('buyNFTInfo');
        buyNFTInfo.innerHTML = `
            <div style="text-align: center; margin-bottom: 16px;">
                <img src="${metadata.image}" alt="NFT Image" style="max-width: 200px; border-radius: 12px;">
                <h3>${metadata.name}</h3>
            </div>
            <div style="margin-bottom: 16px;">
                <p><strong>Token ID:</strong> ${listing.tokenId}</p>
                <p><strong>Seller:</strong> ${listing.seller}</p>
                <p><strong>Price in Token A:</strong> ${priceTokenA === '0' ? 'Not for sale' : priceTokenA}</p>
                <p><strong>Price in Token B:</strong> ${priceTokenB === '0' ? 'Not for sale' : priceTokenB}</p>
            </div>
        `;
        
        // Enable/disable radio buttons based on available prices
        const payWithTokenA = document.getElementById('payWithTokenA');
        const payWithTokenB = document.getElementById('payWithTokenB');
        
        payWithTokenA.disabled = listing.priceTokenA === '0';
        payWithTokenB.disabled = listing.priceTokenB === '0';
        
        // Select the first available option
        if (listing.priceTokenA !== '0') {
            payWithTokenA.checked = true;
        } else if (listing.priceTokenB !== '0') {
            payWithTokenB.checked = true;
        }
        
    } catch (error) {
        console.error("Error loading NFT details for purchase:", error);
        document.getElementById('buyNFTInfo').innerHTML = `<div class="error">Error loading NFT details: ${error.message}</div>`;
    }
}

// Buy NFT with selected token
async function buyNFTWithSelectedToken() {
    try {
        if (!accounts || accounts.length === 0) {
            alert('Please connect your wallet first');
            return;
        }
        
        const modal = document.getElementById('buyNFTModal');
        const listingId = modal.dataset.listingId;
        const tokenType = document.getElementById('payWithTokenA').checked ? 'A' : 'B';
        
        // Show status message
        const buyStatus = document.getElementById('buyStatus');
        buyStatus.textContent = 'Checking listing details...';
        buyStatus.classList.remove('hidden');
        buyStatus.classList.add('warning');
        
        // Get listing details
        const listing = await marketplaceContract.methods.listings(listingId).call();
        
        // Get the price based on which token the user wants to use
        const price = tokenType === 'A' ? listing.priceTokenA : listing.priceTokenB;
        
        // Check if the price is valid
        if (price === '0') {
            buyStatus.textContent = `This NFT is not for sale with Token ${tokenType}`;
            buyStatus.classList.remove('warning');
            buyStatus.classList.add('error');
            return;
        }
        
        // Get the token contract based on which token the user wants to use
        const tokenContract = tokenType === 'A' ? tokenAContract : tokenBContract;
        
        // Check if user has enough balance
        buyStatus.textContent = 'Checking your token balance...';
        const balance = await tokenContract.methods.balanceOf(accounts[0]).call();
        
        // Use BN.js for safer comparison of large numbers
        try {
            const balanceBN = web3.utils.toBN(balance);
            const priceBN = web3.utils.toBN(price);
            
            if (balanceBN.lt(priceBN)) {
                buyStatus.textContent = `Insufficient Token ${tokenType} balance. You need ${web3.utils.fromWei(price, 'ether')} tokens.`;
                buyStatus.classList.remove('warning');
                buyStatus.classList.add('error');
                return;
            }
        } catch (error) {
            console.error("Error comparing token balances:", error);
            buyStatus.textContent = `Error comparing token balances: ${error.message}`;
            buyStatus.classList.remove('warning');
            buyStatus.classList.add('error');
            return;
        }
        
        // Approve the marketplace to spend the exact amount of tokens needed
        buyStatus.textContent = `Approving Token ${tokenType} for purchase...`;
        const priceString = price.toString();
        await tokenContract.methods.approve(NFT_MARKETPLACE_ADDRESS, priceString).send({ from: accounts[0] });
        
        // Execute the purchase based on which token is being used
        buyStatus.textContent = `Buying NFT with Token ${tokenType}...`;
        if (tokenType === 'A') {
            await marketplaceContract.methods.buyNFTWithTokenA(listingId).send({ from: accounts[0] });
        } else {
            await marketplaceContract.methods.buyNFTWithTokenB(listingId).send({ from: accounts[0] });
        }
        
        buyStatus.textContent = `NFT purchased successfully with Token ${tokenType}!`;
        buyStatus.classList.remove('warning');
        buyStatus.classList.add('success');
        
        // Refresh the listings after a short delay
        setTimeout(() => {
            modal.style.display = 'none';
            loadMarketplaceListings();
            loadMyNFTs();
        }, 2000);
        
    } catch (error) {
        console.error("Error buying NFT:", error);
        const buyStatus = document.getElementById('buyStatus');
        buyStatus.textContent = `Error buying NFT: ${error.message}`;
        buyStatus.classList.remove('warning');
        buyStatus.classList.add('error');
    }
}

// Cancel NFT listing
async function cancelNFTListing(listingId) {
    try {
        if (!accounts || accounts.length === 0) {
            alert('Please connect your wallet first');
            return;
        }
        
        await marketplaceContract.methods.cancelListing(listingId).send({ from: accounts[0] });
        alert('Listing cancelled successfully!');
        loadMarketplaceListings();
        
    } catch (error) {
        console.error("Error cancelling listing:", error);
        alert(`Error cancelling listing: ${error.message}`);
    }
}

// Load user's NFTs
async function loadMyNFTs() {
    if (!accounts || accounts.length === 0) {
        const myNFTsContainer = document.getElementById('myNFTsList');
        myNFTsContainer.innerHTML = '<div class="message">Please connect your wallet to view your NFTs</div>';
        return;
    }
    
    // Check if contracts are initialized
    if (!nftContract) {
        try {
            await initializeContracts();
        } catch (error) {
            console.error('Failed to initialize contracts:', error);
            const myNFTsContainer = document.getElementById('myNFTsList');
            myNFTsContainer.innerHTML = '<div class="error">Failed to connect to blockchain</div>';
            return;
        }
    }
    
    const myNFTsContainer = document.getElementById('myNFTsList');
    myNFTsContainer.innerHTML = '<div class="loading">Loading your NFTs...</div>';
    
    try {
        // Get the user's NFT balance from SimpleNFT contract
        const balance = await nftContract.methods.balanceOf(accounts[0]).call();
        
        if (balance == 0) {
            myNFTsContainer.innerHTML = `
                <p>You don't own any NFTs.</p>
            `;
            return;
        }
        
        myNFTsContainer.innerHTML = '';
        
        // Display all NFTs the user owns
        for (let i = 0; i < balance; i++) {
            try {
                const tokenId = await nftContract.methods.tokenOfOwnerByIndex(accounts[0], i).call();
                
                const card = document.createElement('div');
                card.className = 'nft-card';
                card.innerHTML = `<div class="loading">Loading NFT #${tokenId}...</div>`;
                myNFTsContainer.appendChild(card);
                
                await displayMyNFTInCard(card, tokenId);
            } catch (err) {
                console.error(`Error loading NFT at index ${i}:`, err);
            }
        }
    } catch (error) {
        console.error("Error loading NFTs:", error);
        myNFTsContainer.innerHTML = `<div class="error">Error loading your NFTs: ${error.message}</div>`;
    }
}

// Helper function to parse token URI and extract metadata
async function parseTokenURI(tokenURI) {
    try {
        console.log('Parsing token URI:', tokenURI);
        
        if (!tokenURI) {
            console.error('Empty tokenURI provided');
            return { name: 'Unknown NFT', description: 'No metadata available', image: '' };
        }
        
        // Handle base64 encoded JSON
        if (tokenURI.startsWith('data:application/json;base64,')) {
            console.log('Found base64 encoded JSON metadata');
            const base64Data = tokenURI.replace('data:application/json;base64,', '');
            const jsonString = atob(base64Data);
            console.log('Decoded JSON string:', jsonString.substring(0, 100) + '...');
            const metadata = JSON.parse(jsonString);
            console.log('Parsed metadata object:', metadata);
            return metadata;
        } 
        // Handle utf8 encoded JSON (used by SimpleNFT contract)
        else if (tokenURI.startsWith('data:application/json;utf8,')) {
            console.log('Found utf8 encoded JSON metadata');
            const jsonString = tokenURI.replace('data:application/json;utf8,', '');
            console.log('Decoded JSON string:', jsonString.substring(0, 100) + '...');
            const metadata = JSON.parse(jsonString);
            console.log('Parsed metadata object:', metadata);
            return metadata;
        }
        // Handle regular HTTP URLs
        else {
            console.log('Fetching metadata from URL');
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            return metadata;
        }
    } catch (error) {
        console.error('Error parsing token URI:', error);
        return { name: 'Unknown NFT', description: 'Metadata could not be loaded', image: '' };
    }
}

// Function to fetch NFT metadata from tokenURI
async function fetchNFTMetadata(tokenURI) {
    try {
        const metadata = await parseTokenURI(tokenURI);
        console.log('Parsed metadata:', metadata); // Debug log
        
        // Ensure we have valid metadata
        if (!metadata) {
            console.error('Invalid metadata returned from parseTokenURI');
            return { name: 'Unknown NFT', description: 'Metadata could not be loaded', image: '' };
        }
        
        // Handle base64 encoded images and other formats
        if (metadata.image) {
            // Image URL is already present, return as is
            console.log('Image URL found:', metadata.image); // Debug log
            return metadata;
        } else {
            console.error('No image URL in metadata');
            return { ...metadata, name: metadata.name || 'Unknown NFT', image: '' };
        }
    } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        return { name: 'Unknown NFT', description: 'Metadata could not be loaded', image: '' };
    }
}

// No longer needed - removed unused functions

// Display user's NFT in card
async function displayMyNFTInCard(cardElement, tokenId) {
    try {
        console.log(`Fetching NFT data for token #${tokenId}...`);
        
        // Get the token URI from the NFT contract
        let metadata;
        let imageUrl;
        
        try {
            const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
            console.log(`Received tokenURI for NFT #${tokenId}:`, tokenURI);
            const jsonString = tokenURI.substring('data:application/json;utf8,'.length);
            metadata = JSON.parse(jsonString);
            imageUrl = metadata.image;

        } catch (tokenURIError) {
            console.error(`Error getting tokenURI for NFT #${tokenId}:`, tokenURIError);
            throw tokenURIError;
        }
        
        // Get the token type if available
        let tokenType = '';
        try {
            tokenType = await nftContract.methods.getTokenTypeName(tokenId).call();
        } catch (typeError) {
            console.log(`Could not get token type for NFT #${tokenId}:`, typeError);
            // Continue even if this fails
        }
        
        // Display the NFT
        cardElement.innerHTML = `
            <div class="nft-image-container">
                <img src="${imageUrl}" alt="${metadata.name || `NFT #${tokenId}`}" class="nft-image" onerror="this.onerror=null; this.src='https://via.placeholder.com/200x200?text=Image+Error'">
            </div>
            <div class="nft-info">
                <h3>${metadata.name || `NFT #${tokenId}`}</h3>
                <p class="nft-description">${metadata.description ? metadata.description.substring(0, 50) + (metadata.description.length > 50 ? '...' : '') : `NFT #${tokenId}`}</p>
                <p><strong>Token ID:</strong> ${tokenId}</p>
                ${tokenType ? `<p><strong>Type:</strong> ${tokenType}</p>` : ''}
                <div class="nft-actions">
                    <button class="list-nft" onclick="openListNFTModal('${NFT_ADDRESS}', ${tokenId})">List for Sale</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(`Error displaying NFT ${tokenId}:`, error);
        cardElement.innerHTML = `<div class="error">Error loading NFT #${tokenId}: ${error.message}</div>`;
    }
}

// Open listing modal
function openListNFTModal(nftContractAddress, tokenId) {
    // Close any open modals first
    closeAllModals();
    
    // Store these values as data attributes since we removed the hidden inputs
    const modal = document.getElementById('listNFTModal');
    modal.dataset.tokenId = tokenId;
    modal.dataset.nftContract = nftContractAddress;
    
    // Clear previous values
    document.getElementById('tokenAPrice').value = '';
    document.getElementById('tokenBPrice').value = '';
    
    // Clear any previous status messages
    const listingStatus = document.getElementById('listingStatus');
    listingStatus.textContent = '';
    listingStatus.classList.remove('hidden', 'warning', 'error', 'success');
    listingStatus.classList.add('hidden');
    
    // Display the modal
    modal.style.display = 'flex';
    
    document.getElementById('cancelListingBtn').onclick = closeAllModals;
    document.getElementById('confirmListingBtn').onclick = listNFTForSale;
}

// List NFT for sale
async function listNFTForSale() {
    try {
        if (!accounts || accounts.length === 0) {
            alert('Please connect your wallet first');
            return;
        }
        
        const modal = document.getElementById('listNFTModal');
        const tokenId = modal.dataset.tokenId;
        const nftContractAddress = modal.dataset.nftContract;
        const priceTokenA = document.getElementById('tokenAPrice').value;
        const priceTokenB = document.getElementById('tokenBPrice').value;
        
        if (!priceTokenA && !priceTokenB) {
            alert('Please enter a price in at least one token');
            return;
        }
        
        const priceTokenAWei = priceTokenA ? web3.utils.toWei(priceTokenA, 'ether') : '0';
        const priceTokenBWei = priceTokenB ? web3.utils.toWei(priceTokenB, 'ether') : '0';
        
        // Show status message
        const listingStatus = document.getElementById('listingStatus');
        listingStatus.textContent = 'Approving NFT transfer...';
        listingStatus.classList.remove('hidden');
        listingStatus.classList.add('warning');
        
        await nftContract.methods.approve(NFT_MARKETPLACE_ADDRESS, tokenId).send({ from: accounts[0] });
        
        listingStatus.textContent = 'Listing NFT for sale...';
        
        await marketplaceContract.methods.listNFT(
            nftContractAddress || NFT_ADDRESS,
            tokenId,
            priceTokenAWei,
            priceTokenBWei
        ).send({ from: accounts[0] });
        
        listingStatus.textContent = 'NFT listed successfully!';
        listingStatus.classList.remove('warning');
        listingStatus.classList.add('success');
        document.getElementById('listNFTModal').style.display = 'none';
        loadMyNFTs();
        
    } catch (error) {
        console.error("Error listing NFT:", error);
        alert(`Error listing NFT: ${error.message}`);
    }
}

// Load user's listings
async function loadMyListings() {
    try {
        if (!accounts || accounts.length === 0) {
            document.getElementById('myActiveListings').innerHTML = '<p>Please connect your wallet to view your listings.</p>';
            return;
        }
        
        const myListingsContainer = document.getElementById('myActiveListings');
        myListingsContainer.innerHTML = '<div class="loading">Loading your listings...</div>';
        
        // Check if contracts are initialized
        if (!marketplaceContract) {
            console.log('Contracts not initialized yet, attempting to initialize...');
            try {
                const success = await initializeContracts();
                if (!success) {
                    myListingsContainer.innerHTML = '<div class="error">Failed to connect to blockchain. Please connect your wallet first.</div>';
                    return;
                }
            } catch (initError) {
                console.error('Failed to initialize contracts:', initError);
                myListingsContainer.innerHTML = '<div class="error">Failed to connect to blockchain. Please connect your wallet first.</div>';
                return;
            }
        }
        
        // Now try to get listings
        const listings = await marketplaceContract.methods.getActiveListings().call();
        myListingsContainer.innerHTML = '';
        
        const myListings = [];
        for (let i = 0; i < listings[0].length; i++) {
            if (listings[1][i].toLowerCase() === accounts[0].toLowerCase()) {
                myListings.push({
                    listingId: listings[0][i],
                    seller: listings[1][i],
                    nftContract: listings[2][i],
                    tokenId: listings[3][i],
                    priceTokenA: listings[4][i],
                    priceTokenB: listings[5][i]
                });
            }
        }
        
        if (myListings.length === 0) {
            myListingsContainer.innerHTML = '<p>You have no active listings.</p>';
            return;
        }
        
        for (const listing of myListings) {
            const card = document.createElement('div');
            card.className = 'nft-card';
            card.innerHTML = `<div class="loading">Loading NFT #${listing.tokenId}...</div>`;
            myListingsContainer.appendChild(card);
            
            await displayNFTInCard(card, listing.nftContract, listing.tokenId, listing);
        }
    } catch (error) {
        console.error("Error loading my listings:", error);
        document.getElementById('myActiveListings').innerHTML = `<div class="error">Error loading your listings: ${error.message}</div>`;
    }
}
