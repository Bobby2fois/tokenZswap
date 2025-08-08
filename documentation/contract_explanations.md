# TokenZswap Smart Contract Explanations

## TokenSwap AMM Contract

The TokenSwap AMM contract implements a minimal Automated Market Maker (AMM) based on the constant product formula (x * y = k).

### Core Mechanisms

#### Constant Product Formula
The contract uses the formula `reserveA * reserveB = k` to maintain a constant product between the reserves of Token A and Token B. This ensures that as one token's supply increases in the pool, the other decreases, creating a price curve.

```solidity
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
    require(amountIn > 0, "Insufficient input amount");
    require(reserveIn > 0 && reserveOut > 0, "Insufficient reserves");
    
    uint256 amountInWithFee = amountIn * 997; // 0.3% fee
    uint256 numerator = amountInWithFee * reserveOut;
    uint256 denominator = (reserveIn * 1000) + amountInWithFee;
    
    return numerator / denominator;
}
```

#### Liquidity Provision
Users can add liquidity by providing both Token A and Token B in proportion to the current reserves. In return, they receive LP tokens representing their share of the pool.

```solidity
function addLiquidity(uint256 amountA, uint256 amountB) external {
    // Transfer tokens from user to contract
    tokenA.transferFrom(msg.sender, address(this), amountA);
    tokenB.transferFrom(msg.sender, address(this), amountB);
    
    // Calculate LP tokens to mint
    uint256 lpTokens;
    if (totalSupply() == 0) {
        lpTokens = sqrt(amountA * amountB);
    } else {
        lpTokens = min(
            (amountA * totalSupply()) / reserveA,
            (amountB * totalSupply()) / reserveB
        );
    }
    
    // Update reserves
    reserveA += amountA;
    reserveB += amountB;
    
    // Mint LP tokens to user
    _mint(msg.sender, lpTokens);
    
    emit LiquidityAdded(msg.sender, amountA, amountB, lpTokens);
}
```

#### Liquidity Removal
Users can burn their LP tokens to withdraw their proportional share of Token A and Token B from the pool.

```solidity
function removeLiquidity(uint256 lpAmount) external {
    require(lpAmount > 0, "Insufficient LP tokens");
    require(balanceOf(msg.sender) >= lpAmount, "Insufficient LP balance");
    
    // Calculate token amounts to return
    uint256 amountA = (lpAmount * reserveA) / totalSupply();
    uint256 amountB = (lpAmount * reserveB) / totalSupply();
    
    // Update reserves
    reserveA -= amountA;
    reserveB -= amountB;
    
    // Burn LP tokens
    _burn(msg.sender, lpAmount);
    
    // Transfer tokens to user
    tokenA.transfer(msg.sender, amountA);
    tokenB.transfer(msg.sender, amountB);
    
    emit LiquidityRemoved(msg.sender, amountA, amountB, lpAmount);
}
```

#### Token Swapping
Users can swap Token A for Token B or vice versa. The amount of tokens received is calculated using the constant product formula.

```solidity
function swapAForB(uint256 amountA) external {
    require(amountA > 0, "Insufficient input amount");
    
    // Calculate output amount
    uint256 amountB = getAmountOut(amountA, reserveA, reserveB);
    require(amountB > 0, "Insufficient output amount");
    
    // Transfer tokens
    tokenA.transferFrom(msg.sender, address(this), amountA);
    tokenB.transfer(msg.sender, amountB);
    
    // Update reserves
    reserveA += amountA;
    reserveB -= amountB;
    
    emit Swap(msg.sender, amountA, 0, 0, amountB);
}
```

## NFT Marketplace Contract

The NFT Marketplace contract enables users to list and trade NFTs using the tokens from the TokenSwap AMM.

### Key Components

#### Listing Structure
```solidity
struct Listing {
    address seller;
    address nftContract;
    uint256 tokenId;
    uint256 priceTokenA;
    uint256 priceTokenB;
    bool active;
}
```

#### NFT Listing
Users can list their NFTs for sale by specifying prices in Token A and/or Token B.

```solidity
function listNFT(address nftContract, uint256 tokenId, uint256 priceTokenA, uint256 priceTokenB) external nonReentrant {
    require(priceTokenA > 0 || priceTokenB > 0, "Price must be greater than 0 for at least one token");
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
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
```

#### Batch NFT Listing
Users can list multiple NFTs in a single transaction for efficiency.

```solidity
function batchListNFTs(
    address[] memory nftContracts,
    uint256[] memory tokenIds,
    uint256[] memory pricesTokenA,
    uint256[] memory pricesTokenB
) external nonReentrant {
    require(
        nftContracts.length == tokenIds.length &&
        tokenIds.length == pricesTokenA.length &&
        pricesTokenA.length == pricesTokenB.length,
        "Input arrays must have the same length"
    );
    
    for (uint i = 0; i < nftContracts.length; i++) {
        require(pricesTokenA[i] > 0 || pricesTokenB[i] > 0, "Price must be greater than 0 for at least one token");
        IERC721(nftContracts[i]).transferFrom(msg.sender, address(this), tokenIds[i]);
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
```

#### NFT Purchase
Users can buy listed NFTs using either Token A or Token B.

```solidity
function buyNFTWithTokenA(uint256 listingId) external nonReentrant {
    Listing storage listing = listings[listingId];
    require(listing.active, "Listing is not active");
    require(listing.priceTokenA > 0, "NFT not available for purchase with Token A");
    
    // Transfer Token A from buyer to seller
    tokenA.transferFrom(msg.sender, listing.seller, listing.priceTokenA);
    
    // Transfer NFT from contract to buyer
    IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
    
    // Mark listing as inactive
    listing.active = false;
    
    emit NFTSold(listingId, listing.seller, msg.sender, listing.nftContract, listing.tokenId, listing.priceTokenA, 0);
}
```

#### Listing Cancellation
Sellers can cancel their listings and retrieve their NFTs.

```solidity
function cancelListing(uint256 listingId) external nonReentrant {
    Listing storage listing = listings[listingId];
    require(listing.active, "Listing is not active");
    require(listing.seller == msg.sender, "Only seller can cancel listing");
    
    // Transfer NFT back to seller
    IERC721(listing.nftContract).transferFrom(address(this), listing.seller, listing.tokenId);
    
    // Mark listing as inactive
    listing.active = false;
    
    emit NFTListingCancelled(listingId, listing.seller, listing.nftContract, listing.tokenId);
}
```