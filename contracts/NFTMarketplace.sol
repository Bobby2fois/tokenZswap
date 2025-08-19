// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFT Marketplace
 * @dev A marketplace for buying and selling NFTs using Token A and Token B from the TokenSwap AMM
 */
contract NFTMarketplace is ReentrancyGuard, Ownable {
    // Struct to store listing information
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 priceTokenA;
        uint256 priceTokenB;
        bool active;
    }

    // Mapping from listing ID to Listing
    mapping(uint256 => Listing) public listings;
    
    // Counter for listing IDs
    uint256 public nextListingId;
    
    // Token A and Token B addresses
    address public tokenA;
    address public tokenB;
    
    // Events
    event NFTListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 priceTokenA, uint256 priceTokenB);
    event NFTPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, address nftContract, uint256 tokenId, address paymentToken, uint256 price);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    
    /**
     * @dev Constructor sets the token addresses
     * @param _tokenA Address of Token A
     * @param _tokenB Address of Token B
     */
    constructor(address _tokenA, address _tokenB) Ownable(msg.sender) {
        require(_tokenA != address(0), "Token A address cannot be zero");
        require(_tokenB != address(0), "Token B address cannot be zero");
        tokenA = _tokenA;
        tokenB = _tokenB;
        nextListingId = 1;
    }
    
    /**
     * @dev List an NFT for sale
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT to list
     * @param priceTokenA Price in Token A (0 if not accepting Token A)
     * @param priceTokenB Price in Token B (0 if not accepting Token B)
     */
    function listNFT(address nftContract, uint256 tokenId, uint256 priceTokenA, uint256 priceTokenB) external nonReentrant {
        require(priceTokenA > 0 || priceTokenB > 0, "Price must be greater than 0 for at least one token");
        require(nftContract != address(0), "NFT contract address cannot be zero");
        
        // Transfer NFT from seller to contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Create listing
        listings[nextListingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            priceTokenA: priceTokenA,
            priceTokenB: priceTokenB,
            active: true
        });
        
        emit NFTListed(nextListingId, msg.sender, nftContract, tokenId, priceTokenA, priceTokenB);
        nextListingId++;
    }
    
    /**
     * @dev List multiple NFTs for sale in a single transaction
     * @param nftContracts Array of NFT contract addresses
     * @param tokenIds Array of NFT token IDs
     * @param pricesTokenA Array of prices in Token A (0 if not accepting Token A)
     * @param pricesTokenB Array of prices in Token B (0 if not accepting Token B)
     */
    function batchListNFTs(
        address[] calldata nftContracts,
        uint256[] calldata tokenIds,
        uint256[] calldata pricesTokenA,
        uint256[] calldata pricesTokenB
    ) external nonReentrant {
        uint256 length = nftContracts.length;
        require(length > 0, "Must list at least one NFT");
        require(length == tokenIds.length, "Array length mismatch");
        require(length == pricesTokenA.length, "Array length mismatch");
        require(length == pricesTokenB.length, "Array length mismatch");
        
        for (uint256 i = 0; i < length; i++) {
            require(pricesTokenA[i] > 0 || pricesTokenB[i] > 0, "Price must be greater than 0 for at least one token");
            require(nftContracts[i] != address(0), "NFT contract address cannot be zero");
            
            // Transfer NFT from seller to contract
            IERC721(nftContracts[i]).transferFrom(msg.sender, address(this), tokenIds[i]);
            
            // Create listing
            listings[nextListingId] = Listing({
                seller: msg.sender,
                nftContract: nftContracts[i],
                tokenId: tokenIds[i],
                priceTokenA: pricesTokenA[i],
                priceTokenB: pricesTokenB[i],
                active: true
            });
            
            emit NFTListed(nextListingId, msg.sender, nftContracts[i], tokenIds[i], pricesTokenA[i], pricesTokenB[i]);
            nextListingId++;
        }
    }
    
    /**
     * @dev Buy an NFT with Token A
     * @param listingId ID of the listing to purchase
     */
    function buyNFTWithTokenA(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.priceTokenA > 0, "This NFT cannot be purchased with Token A");
        
        // Mark listing as inactive to prevent reentrancy
        listing.active = false;
        
        // Transfer Token A from buyer to contract
        require(IERC20(tokenA).transferFrom(msg.sender, address(this), listing.priceTokenA), "Token A transfer failed");
        
        // Transfer Token A from contract to seller
        require(IERC20(tokenA).transfer(listing.seller, listing.priceTokenA), "Token A transfer to seller failed");
        
        // Transfer NFT from contract to buyer
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        emit NFTPurchased(listingId, msg.sender, listing.seller, listing.nftContract, listing.tokenId, tokenA, listing.priceTokenA);
    }
    
    /**
     * @dev Buy an NFT with Token B
     * @param listingId ID of the listing to purchase
     */
    function buyNFTWithTokenB(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.priceTokenB > 0, "This NFT cannot be purchased with Token B");
        
        // Mark listing as inactive to prevent reentrancy
        listing.active = false;
        
        // Transfer Token B from buyer to contract
        require(IERC20(tokenB).transferFrom(msg.sender, address(this), listing.priceTokenB), "Token B transfer failed");
        
        // Transfer Token B from contract to seller
        require(IERC20(tokenB).transfer(listing.seller, listing.priceTokenB), "Token B transfer to seller failed");
        
        // Transfer NFT from contract to buyer
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        emit NFTPurchased(listingId, msg.sender, listing.seller, listing.nftContract, listing.tokenId, tokenB, listing.priceTokenB);
    }
    
    /**
     * @dev Cancel an NFT listing
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.seller == msg.sender, "Only seller can cancel listing");
        
        // Mark listing as inactive
        listing.active = false;
        
        // Transfer NFT back to seller
        IERC721(listing.nftContract).transferFrom(address(this), listing.seller, listing.tokenId);
        
        emit ListingCancelled(listingId, msg.sender);
    }
    
    /**
     * @dev Get all active listings
     * @return Array of listing IDs, sellers, NFT contracts, token IDs, prices in Token A, prices in Token B
     */
    function getActiveListings() external view returns (
        uint256[] memory, 
        address[] memory, 
        address[] memory, 
        uint256[] memory, 
        uint256[] memory, 
        uint256[] memory
    ) {
        // Count active listings
        uint256 activeCount = 0;
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        // Create arrays to return
        uint256[] memory ids = new uint256[](activeCount);
        address[] memory sellers = new address[](activeCount);
        address[] memory nftContracts = new address[](activeCount);
        uint256[] memory tokenIds = new uint256[](activeCount);
        uint256[] memory pricesA = new uint256[](activeCount);
        uint256[] memory pricesB = new uint256[](activeCount);
        
        // Fill arrays
        uint256 index = 0;
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].active) {
                ids[index] = i;
                sellers[index] = listings[i].seller;
                nftContracts[index] = listings[i].nftContract;
                tokenIds[index] = listings[i].tokenId;
                pricesA[index] = listings[i].priceTokenA;
                pricesB[index] = listings[i].priceTokenB;
                index++;
            }
        }
        
        return (ids, sellers, nftContracts, tokenIds, pricesA, pricesB);
    }
}
