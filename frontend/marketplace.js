// NFT Marketplace JavaScript

// Contract addresses - update these with your deployed contract addresses
const NFT_MARKETPLACE_ADDRESS = "0xf13881786df751e2293df3794F543b22B549879A";
const NFT_CONTRACT_ADDRESS = "0x97225257b00fa2AD7387A769Da879A0ff399dA01";
const TOKEN_A_ADDRESS = "0x186856b5B97Caf654dc51aE46c33757304b5BdFE";
const TOKEN_B_ADDRESS = "0x14974761C8e06ACf6906bf7efC90B608EbFfb058";

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
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('connectButton').addEventListener('click', connectWallet);
    
    // Initialize modal close buttons
    document.getElementById('closeDetailBtn').addEventListener('click', function() {
        document.getElementById('nftDetailModal').style.display = 'none';
    });
    
    // Close modals when clicking outside
    document.getElementById('listNFTModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
    
    document.getElementById('nftDetailModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
});

// Tab functionality
function openTab(tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    document.getElementById(tabName).classList.add('active');
    
    const buttons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].getAttribute('onclick').includes(tabName)) {
            buttons[i].classList.add('active');
        }
    }
    
    if (tabName === 'browseTab') {
        loadMarketplaceListings();
    } else if (tabName === 'myNFTsTab') {
        loadMyNFTs();
    } else if (tabName === 'myListingsTab') {
        loadMyListings();
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
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
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
            // Request account access
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
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
            document.getElementById('walletStatus').textContent = 'Wallet connected!';
            document.getElementById('walletStatus').classList.remove('hidden');
            document.getElementById('walletStatus').classList.add('success');
            document.getElementById('userAddress').textContent = accounts[0];
            document.getElementById('walletInfo').classList.remove('hidden');
            
            await initializeContracts();
            loadMarketplaceListings();
        } else {
            alert('MetaMask is not installed. Please install it to use this dApp.');
        }
    } catch (error) {
        console.error("Error connecting to wallet:", error);
        document.getElementById('walletStatus').textContent = 'Error connecting wallet: ' + error.message;
        document.getElementById('walletStatus').classList.remove('hidden');
        document.getElementById('walletStatus').classList.add('error');
    }
}

// Initialize contracts
async function initializeContracts() {
    marketplaceContract = new web3.eth.Contract(NFT_MARKETPLACE_ABI, NFT_MARKETPLACE_ADDRESS);
    nftContract = new web3.eth.Contract(ERC721_ABI, NFT_CONTRACT_ADDRESS);
    tokenAContract = new web3.eth.Contract(ERC20_ABI, TOKEN_A_ADDRESS);
    tokenBContract = new web3.eth.Contract(ERC20_ABI, TOKEN_B_ADDRESS);
}

// Load marketplace listings
async function loadMarketplaceListings() {
    try {
        const listingsContainer = document.getElementById('nftListings');
        listingsContainer.innerHTML = '<div class="loading">Loading NFTs...</div>';
        
        const listings = await marketplaceContract.methods.getActiveListings().call();
        listingsContainer.innerHTML = '';
        
        if (listings[0].length === 0) {
            listingsContainer.innerHTML = '<p>No NFTs currently listed for sale.</p>';
            return;
        }
        
        for (let i = 0; i < listings[0].length; i++) {
            const listingId = listings[0][i];
            const seller = listings[1][i];
            const nftContractAddress = listings[2][i];
            const tokenId = listings[3][i];
            const priceTokenA = listings[4][i];
            const priceTokenB = listings[5][i];
            
            const card = document.createElement('div');
            card.className = 'nft-card';
            card.innerHTML = `<div class="loading">Loading NFT #${tokenId}...</div>`;
            listingsContainer.appendChild(card);
            
            await displayNFTInCard(card, nftContractAddress, tokenId, {
                seller, priceTokenA, priceTokenB, listingId
            });
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
        
        const base64Data = tokenURI.split(',')[1];
        const jsonString = atob(base64Data);
        const metadata = JSON.parse(jsonString);
        
        cardElement.innerHTML = `
            <div class="nft-image-container">
                <img src="${metadata.image}" alt="${metadata.name}" class="nft-image">
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
                    ${listingInfo.priceTokenA > 0 ? 
                        `<button class="buy-token-a" onclick="buyNFTWithToken('${listingInfo.listingId}', 'A')">Buy with Token A</button>` : ''}
                    ${listingInfo.priceTokenB > 0 ? 
                        `<button class="buy-token-b" onclick="buyNFTWithToken('${listingInfo.listingId}', 'B')">Buy with Token B</button>` : ''}
                    ${listingInfo.seller.toLowerCase() === (accounts[0] || '').toLowerCase() ? 
                        `<button class="cancel-listing" onclick="cancelNFTListing('${listingInfo.listingId}')">Cancel Listing</button>` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error(`Error displaying NFT ${tokenId}:`, error);
        cardElement.innerHTML = `<div class="error">Error loading NFT #${tokenId}</div>`;
    }
}

// Buy NFT with token
async function buyNFTWithToken(listingId, tokenType) {
    try {
        if (!accounts || accounts.length === 0) {
            alert('Please connect your wallet first');
            return;
        }
        
        const listing = await marketplaceContract.methods.listings(listingId).call();
        
        if (!listing.active) {
            alert('This listing is no longer active');
            loadMarketplaceListings();
            return;
        }
        
        const price = tokenType === 'A' ? listing.priceTokenA : listing.priceTokenB;
        const tokenContract = tokenType === 'A' ? tokenAContract : tokenBContract;
        
        const balance = await tokenContract.methods.balanceOf(accounts[0]).call();
        if (web3.utils.toBN(balance).lt(web3.utils.toBN(price))) {
            alert(`Insufficient Token ${tokenType} balance. You need ${web3.utils.fromWei(price, 'ether')} tokens.`);
            return;
        }
        
        const allowance = await tokenContract.methods.allowance(accounts[0], NFT_MARKETPLACE_ADDRESS).call();
        if (web3.utils.toBN(allowance).lt(web3.utils.toBN(price))) {
            await tokenContract.methods.approve(NFT_MARKETPLACE_ADDRESS, price).send({ from: accounts[0] });
        }
        
        if (tokenType === 'A') {
            await marketplaceContract.methods.buyNFTWithTokenA(listingId).send({ from: accounts[0] });
        } else {
            await marketplaceContract.methods.buyNFTWithTokenB(listingId).send({ from: accounts[0] });
        }
        
        alert('NFT purchased successfully!');
        loadMarketplaceListings();
        
    } catch (error) {
        console.error("Error buying NFT:", error);
        alert(`Error buying NFT: ${error.message}`);
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
    try {
        if (!accounts || accounts.length === 0) {
            document.getElementById('myNFTs').innerHTML = '<p>Please connect your wallet to view your NFTs.</p>';
            return;
        }
        
        const myNFTsContainer = document.getElementById('myNFTs');
        myNFTsContainer.innerHTML = '<div class="loading">Loading your NFTs...</div>';
        
        // Check if the contract supports ERC721Enumerable
        let supportsEnumerable = false;
        try {
            // Try to call supportsInterface for ERC721Enumerable (0x780e9d63)
            supportsEnumerable = await nftContract.methods.supportsInterface('0x780e9d63').call();
        } catch (err) {
            console.log("Contract doesn't support supportsInterface check, assuming non-enumerable");
        }
        
        if (supportsEnumerable) {
            // ERC721Enumerable approach
            const balance = await nftContract.methods.balanceOf(accounts[0]).call();
            
            if (balance == 0) {
                myNFTsContainer.innerHTML = '<p>You don\'t own any NFTs from this collection.</p>';
                return;
            }
            
            myNFTsContainer.innerHTML = '';
            
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
        } else {
            // Alternative approach for non-enumerable NFTs
            // We'll need to ask the user to input their NFT IDs
            myNFTsContainer.innerHTML = `
                <div class="non-enumerable-notice">
                    <p>Your NFT contract doesn't support automatic NFT discovery.</p>
                    <p>Please enter the ID of your NFT to view and list it:</p>
                    <div class="nft-input-form">
                        <input type="number" id="manualNftId" placeholder="Enter NFT ID" min="0">
                        <button id="loadManualNftBtn">Load NFT</button>
                    </div>
                    <div id="manualNftDisplay"></div>
                </div>
            `;
            
            // Add event listener for the manual NFT loading
            document.getElementById('loadManualNftBtn').addEventListener('click', async function() {
                const tokenId = document.getElementById('manualNftId').value;
                if (!tokenId) return;
                
                const displayDiv = document.getElementById('manualNftDisplay');
                displayDiv.innerHTML = `<div class="loading">Loading NFT #${tokenId}...</div>`;
                
                try {
                    console.log(`Checking ownership of NFT #${tokenId}...`);
                    
                    // Check if the user owns this NFT using a direct ownerOf call
                    // This is more reliable than tokenURI which might have state access issues
                    let owner;
                    try {
                        owner = await nftContract.methods.ownerOf(tokenId).call();
                        console.log(`Owner of NFT #${tokenId}:`, owner);
                        console.log(`Current account:`, accounts[0]);
                    } catch (ownerError) {
                        // If ownerOf fails, the token likely doesn't exist
                        console.error(`Error checking ownership of token #${tokenId}:`, ownerError);
                        
                        if (ownerError.message.includes("nonexistent token") || 
                            ownerError.message.includes("Token doesn't exist") ||
                            ownerError.message.includes("owner query for nonexistent")) {
                            displayDiv.innerHTML = `<div class="error">Token #${tokenId} does not exist</div>`;
                        } else {
                            displayDiv.innerHTML = `<div class="error">Error checking token #${tokenId}: ${ownerError.message}</div>`;
                        }
                        return;
                    }
                    
                    // Verify ownership
                    if (owner.toLowerCase() !== accounts[0].toLowerCase()) {
                        displayDiv.innerHTML = `<div class="error">You don't own NFT #${tokenId}</div>`;
                        return;
                    }
                    
                    // Get additional data to verify the token is accessible
                    try {
                        const colors = await nftContract.methods.tokenColors(tokenId).call();
                        const shapes = await nftContract.methods.tokenShapes(tokenId).call();
                        console.log(`Token #${tokenId} colors:`, colors);
                        console.log(`Token #${tokenId} shapes:`, shapes);
                    } catch (dataError) {
                        console.log(`Additional data not available for token #${tokenId}:`, dataError);
                        // Continue even if this fails
                    }
                    
                    const card = document.createElement('div');
                    card.className = 'nft-card';
                    await displayMyNFTInCard(card, tokenId);
                    
                    displayDiv.innerHTML = '';
                    displayDiv.appendChild(card);
                } catch (err) {
                    console.error(`Error loading NFT #${tokenId}:`, err);
                    
                    // More detailed error handling
                    if (err.message && err.message.includes('missing trie node')) {
                        displayDiv.innerHTML = `<div class="error">Blockchain node synchronization issue. The RPC provider may be having trouble accessing this token's data. Try again later or try a different RPC endpoint.</div>`;
                    } else if (err.message && err.message.includes('nonexistent token')) {
                        displayDiv.innerHTML = `<div class="error">Token #${tokenId} does not exist</div>`;
                    } else {
                        displayDiv.innerHTML = `<div class="error">Error loading NFT #${tokenId}: ${err.message}</div>`;
                    }
                }
                
            });
        }
    } catch (error) {
        console.error("Error loading my NFTs:", error);
        document.getElementById('myNFTs').innerHTML = `<div class="error">Error loading your NFTs: ${error.message}</div>`;
    }
}

// Display user's NFT in card
async function displayMyNFTInCard(cardElement, tokenId) {
    try {
        console.log(`Fetching NFT data for token #${tokenId}...`);
        
        // Try alternative approach using generateSVG and direct metadata generation
        // This avoids the "missing trie node" issue with tokenURI
        let metadata;
        let imageUrl;
        
        try {
            // First try direct metadata generation if available
            try {
                const metadataResult = await nftContract.methods.generateMetadata(tokenId).call();
                console.log(`Generated metadata for NFT #${tokenId}:`, metadataResult);
                
                // Parse the metadata
                const base64Data = metadataResult.split(',')[1];
                const jsonString = atob(base64Data);
                metadata = JSON.parse(jsonString);
                imageUrl = metadata.image;
            } catch (metadataError) {
                console.log(`generateMetadata not available, trying tokenURI:`, metadataError);
                
                // Fall back to tokenURI
                const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
                console.log(`Received tokenURI for NFT #${tokenId}:`, tokenURI);
                
                // Parse the tokenURI
                const base64Data = tokenURI.split(',')[1];
                const jsonString = atob(base64Data);
                metadata = JSON.parse(jsonString);
                imageUrl = metadata.image;
            }
        } catch (dataError) {
            console.log(`Both metadata methods failed, trying direct SVG generation:`, dataError);
            
            // Try direct SVG generation as last resort
            try {
                const svgData = await nftContract.methods.generateSVG(tokenId).call();
                console.log(`Generated SVG for NFT #${tokenId}`);
                
                // Create basic metadata with the SVG
                imageUrl = `data:image/svg+xml;base64,${btoa(svgData)}`;
                metadata = {
                    name: `NFT #${tokenId}`,
                    description: `TokenizeArt NFT #${tokenId}`,
                    attributes: []
                };
            } catch (svgError) {
                console.error(`Failed to generate SVG:`, svgError);
                throw new Error(`Cannot retrieve NFT data: ${svgError.message}`);
            }
        }
        
        // Get additional attributes data
        let attributesHtml = '';
        if (metadata.attributes && metadata.attributes.length > 0) {
            attributesHtml = '<div class="nft-attributes">';
            for (const attr of metadata.attributes) {
                attributesHtml += `<span>${attr.trait_type}: ${attr.value}</span>`;
            }
            attributesHtml += '</div>';
        } else {
            // Try to get direct attributes from contract
            try {
                const animalType = await nftContract.methods.tokenAnimalTypes(tokenId).call();
                const colorIndex = await nftContract.methods.tokenColors(tokenId).call();
                const bgColorIndex = await nftContract.methods.tokenBgColors(tokenId).call();
                
                attributesHtml = `<div class="nft-attributes">
                    <span>Animal Type: ${animalType}</span>
                    <span>Color: ${colorIndex}</span>
                    <span>Background: ${bgColorIndex}</span>
                </div>`;
            } catch (attrError) {
                console.log("Additional NFT attributes not available", attrError);
            }
        }
        
        cardElement.innerHTML = `
            <div class="nft-image-container">
                <img src="${imageUrl}" alt="${metadata.name}" class="nft-image" onerror="this.onerror=null; this.src='https://via.placeholder.com/200x200?text=Image+Error'">
            </div>
            <div class="nft-info">
                <h3>${metadata.name}</h3>
                <p class="nft-description">${metadata.description ? metadata.description.substring(0, 50) + (metadata.description.length > 50 ? '...' : '') : `NFT #${tokenId}`}</p>
                ${attributesHtml}
                <div class="nft-actions">
                    <button class="list-nft" onclick="openListNFTModal('${tokenId}')">List for Sale</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(`Error displaying NFT ${tokenId}:`, error);
        cardElement.innerHTML = `<div class="error">Error loading NFT #${tokenId}: ${error.message}</div>`;
    }
}

// Open listing modal
function openListNFTModal(tokenId) {
    document.getElementById('listingTokenId').value = tokenId;
    document.getElementById('listingNFTContract').value = NFT_CONTRACT_ADDRESS;
    document.getElementById('priceTokenA').value = '';
    document.getElementById('priceTokenB').value = '';
    document.getElementById('listNFTModal').style.display = 'flex';
    
    document.getElementById('cancelListingBtn').onclick = () => {
        document.getElementById('listNFTModal').style.display = 'none';
    };
    
    document.getElementById('confirmListingBtn').onclick = listNFTForSale;
}

// List NFT for sale
async function listNFTForSale() {
    try {
        if (!accounts || accounts.length === 0) {
            alert('Please connect your wallet first');
            return;
        }
        
        const tokenId = document.getElementById('listingTokenId').value;
        const priceTokenA = document.getElementById('priceTokenA').value;
        const priceTokenB = document.getElementById('priceTokenB').value;
        
        if (!priceTokenA && !priceTokenB) {
            alert('Please enter a price in at least one token');
            return;
        }
        
        const priceTokenAWei = priceTokenA ? web3.utils.toWei(priceTokenA, 'ether') : '0';
        const priceTokenBWei = priceTokenB ? web3.utils.toWei(priceTokenB, 'ether') : '0';
        
        await nftContract.methods.approve(NFT_MARKETPLACE_ADDRESS, tokenId).send({ from: accounts[0] });
        
        await marketplaceContract.methods.listNFT(
            NFT_CONTRACT_ADDRESS,
            tokenId,
            priceTokenAWei,
            priceTokenBWei
        ).send({ from: accounts[0] });
        
        alert('NFT listed successfully!');
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
