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
    
    // IPFS gateway URL
    string public ipfsGateway = "https://gateway.pinata.cloud/ipfs/";
    
    // IPFS CIDs for different NFT types
    mapping(uint256 => string) public typeToCID;
    
    // Names for each NFT type
    string[] private typeNames = ["frog", "frog2", "frog3", "frog4", "frog5"];
    
    constructor() 
        ERC721("FrogNFT", "FROG")
        Ownable(msg.sender)
    {
        // Initialize IPFS CIDs for each NFT type
        typeToCID[0] = "bafkreif6ffqn337ys52ntlhd4g3u3fdizrmiejeryb2xs2jzyiptnbfaye";
        typeToCID[1] = "bafybeid7rs3fyniwia6gvncufidg6ad2vhz6skhvpwptuujulrbreztkoa";
        typeToCID[2] = "bafkreihdk4kqvztqqjnq5cgqlfpm5itiahvdsujyjqm5zxzahennyuz3mm";
        typeToCID[3] = "bafkreidb47uotgrq6v6kfwmqj7i6c5ctuyw33ia6adlvq756rxctea7yje";
        typeToCID[4] = "bafkreigxjawrg5mhxis7phktqa4tfqvoozopk6vswex3b6zbncisknvhya";
    }
    
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
     * @dev Get the image URL for a token using IPFS
     */
    function tokenImageURI(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        
        // Get the NFT type for this token
        uint256 nftType = tokenTypes[tokenId];
        
        // Get the IPFS CID for this NFT type
        string memory cid = typeToCID[nftType];
        
        // Return the full IPFS gateway URL
        return string(abi.encodePacked(ipfsGateway, cid));
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
        
        return string(abi.encodePacked(
            "data:application/json;utf8,",
            "{",
            "\"name\": \"Frog #", tokenId.toString(), "\",",
            "\"description\": \"just a frog\",",
            "\"image\": \"", imageUrl, "\",",
            "\"attributes\": [",
            "  {\"trait_type\": \"Type\", \"value\": \"", typeName, "\"}",
            "]",
            "}"
        ));
    }
    
    /**
     * @dev Set a new IPFS gateway URL
     */
    function setIPFSGateway(string memory newGateway) public onlyOwner {
        ipfsGateway = newGateway;
    }
    
    /**
     * @dev Update the IPFS CID for a specific NFT type
     */
    function setTypeCID(uint256 nftType, string memory newCID) public onlyOwner {
        require(nftType < MAX_NFT_TYPES, "Invalid NFT type");
        typeToCID[nftType] = newCID;
    }
}
