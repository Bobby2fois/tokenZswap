// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SimpleNFT
 * @dev A simple NFT contract with external image URLs for testing the marketplace
 */
contract SimpleNFT is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;
    
    uint256 private _nextTokenId;
    
    // NFT types with predefined images
    uint256 public constant MAX_NFT_TYPES = 5;
    
    // Mapping from token ID to NFT type
    mapping(uint256 => uint256) public tokenTypes;
    
    // Base URL for NFT images
    string public baseImageURI = "https://picsum.photos/seed/";
    
    // Names for each NFT type
    string[] private typeNames = ["Landscape", "Abstract", "Animal", "Nature", "Art"];
    
    constructor() 
        ERC721("SimpleNFT", "SNFT")
        Ownable(msg.sender)
    {}
    
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Override _update to support ERC721Enumerable
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Override _increaseBalance to support ERC721Enumerable
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Mint a new NFT with a random type
     * @return tokenId The ID of the newly minted NFT
     */
    function mint(address to) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        // Generate a random NFT type (0-4)
        uint256 randomValue = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, tokenId, to)));
        uint256 nftType = randomValue % MAX_NFT_TYPES;
        
        // Store the NFT type
        tokenTypes[tokenId] = nftType;
        
        _safeMint(to, tokenId);
        return tokenId;
    }
    
    /**
     * @dev Mint multiple NFTs at once
     * @param to The address to mint NFTs to
     * @param count The number of NFTs to mint
     */
    function mintBatch(address to, uint256 count) public {
        require(count > 0 && count <= 10, "Can mint between 1 and 10 NFTs at once");
        
        for (uint256 i = 0; i < count; i++) {
            mint(to);
        }
    }
    
    /**
     * @dev Get the image URL for a token
     */
    function tokenImageURI(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        
        // Use the token ID as a seed for a random image from Lorem Picsum
        // Each token will have a unique, but consistent image
        return string(abi.encodePacked(
            baseImageURI, 
            tokenId.toString(),
            "/300/300"
        ));
    }
    
    /**
     * @dev Get the type name for a token
     */
    function getTokenTypeName(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        return typeNames[tokenTypes[tokenId]];
    }
    
    /**
     * @dev Override tokenURI to return metadata with external image URL
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        
        string memory imageUrl = tokenImageURI(tokenId);
        string memory typeName = getTokenTypeName(tokenId);
        
        // Return JSON metadata directly (not base64 encoded)
        return string(abi.encodePacked(
            "data:application/json;utf8,",
            "{",
            "\"name\": \"SimpleNFT #", tokenId.toString(), "\",",
            "\"description\": \"A simple NFT for testing the marketplace\",",
            "\"image\": \"", imageUrl, "\",",
            "\"attributes\": [",
            "  {\"trait_type\": \"Type\", \"value\": \"", typeName, "\"}",
            "]",
            "}"
        ));
    }
    
    /**
     * @dev Set a new base image URI
     */
    function setBaseImageURI(string memory newBaseURI) public onlyOwner {
        baseImageURI = newBaseURI;
    }
}
