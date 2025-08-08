# TokenZswap System Diagrams

## System Architecture Diagrams

### Complete System Overview

```
+-----------------------------------------------------------+
|                                                           |
|                    TokenZswap Platform                    |
|                                                           |
+-------------------+-------------------+-------------------+
                    |                   |
        +-----------v-----------+       |
        |                       |       |
        |    Smart Contracts    |       |
        |                       |       |
        +-----------+-----------+       |
                    |                   |
        +-----------v-----------+       |
        |                       |       |
        | Blockchain (BNB Chain)|       |
        |                       |       |
        +-----------+-----------+       |
                    |                   |
        +-----------v-----------+       |
        |                       |       |
        |   Frontend Interface  <-------+
        |                       |
        +-----------+-----------+
                    |
        +-----------v-----------+
        |                       |
        |        User           |
        |                       |
        +-----------------------+
```

### Smart Contract Interaction Diagram

```
+---------------------+                 +---------------------+
|                     |                 |                     |
|    Token A ERC20    |                 |    Token B ERC20    |
|                     |                 |                     |
+---------+-----------+                 +-----------+---------+
          |         |                   |           |
          |         |                   |           |
          |         |                   |           |
          |         |                   |           |
          |         |                   |           |
          |         |                   |           |
          |    +----+-------------------+-------+   |
          |    |                                |   |
          |    |                                |   |
          |    |                                |   |
          v    v                                v   v
+---------------------+                 +---------------------+
|                     |                 |                     |
|   TokenSwap AMM     |                 |   NFT Marketplace   |
|                     |                 |                     |
+---------------------+                 +---------------------+

```

## Process Flow Diagrams

### Token Swap Process Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
|   Start     |---->| Input Swap  |---->|  Approve    |---->|  Execute    |
|             |     |   Amount    |     |   Token     |     |    Swap     |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
                          |                   |                   |
                          v                   v                   v
                    +-------------+     +-------------+     +-------------+
                    | Calculate   |     |  Update UI  |     | Update User |
                    | Output &    |     |  to Show    |     | Balances &  |
                    | Price Impact|     |  Approval   |     |   Reserves  |
                    +-------------+     +-------------+     +-------------+
```

### NFT Listing Process Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
|   Start     |---->| Select NFT  |---->|  Set Price  |---->|  Approve    |
|             |     | to List     |     | Token A/B   |     |    NFT      |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
                                                                  |
                                                                  v
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
| Update UI   |<----| Update      |<----| Emit        |<----| List NFT    |
| to Show     |     | Listings    |     | Events      |     | on Contract |
| Listed NFT  |     | Array       |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
```

### NFT Purchase Process Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
|   Start     |---->| Select NFT  |---->| Choose Token|---->|  Approve    |
|             |     | to Buy      |     | A or B      |     |   Token     |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
                                                                  |
                                                                  v
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
| Update UI   |<----| Update      |<----| Emit        |<----| Execute     |
| to Show     |     | Ownership   |     | Events      |     | Purchase    |
| Owned NFT   |     |             |     |             |     | Transaction |
+-------------+     +-------------+     +-------------+     +-------------+
```

### Smart Contract Class Diagram

```
+---------------------+     +-------------------------+ 
|    TokenSwap AMM    |     |     NFT Marketplace     | 
+---------------------+     +-------------------------+ 
| - reserveA: uint256 |     | - listings: mapping     | 
| - reserveB: uint256 |     | - nextListingId: uint256| 
| - tokenA: IERC20    |     | - tokenA: IERC20        |
| - tokenB: IERC20    |     | - tokenB: IERC20        |
+---------------------+     +-------------------------+
| + addLiquidity()    |     | + listNFT()             |
| + removeLiquidity() |     | + batchListNFTs()       |
| + swapAForB()       |     | + buyNFTWithTokenA()    |
| + swapBForA()       |     | + buyNFTWithTokenB()    |
| + getAmountOut()    |     | + cancelListing()       |
+---------------------+     +-------------------------+
```

## Data Flow Diagrams

### Token Swap Data Flow

```
+-------------+
|             |
|    User     |
|             |
+------+------+
       |
       | Input: amount to swap
       v
+------+------+
|             |
|  Frontend   |
|             |
+------+------+
       |
       | Call: swapAForB() or swapBForA()
       v
+------+------+
|             |     Calculate output amount     +-------------+
| TokenSwap   |-------------------------------->|             |
| Contract    |                                 | Calculation |
|             |<--------------------------------|             |
+------+------+                                 +-------------+
       |
       | Transfer tokens
       v
+------+------+     +------+------+
|             |     |             |
| Token A     |<--->| Token B     |
| Contract    |     | Contract    |
|             |     |             |
+-------------+     +-------------+
```

### NFT Marketplace Data Flow

```
+-------------+
|             |
|    User     |
|             |
+------+------+
       |
       | List/Buy/Cancel NFT
       v
+------+------+
|             |
|  Frontend   |
|             |
+------+------+
       |
       | Call contract functions
       v
+------+------+
|             |                                 +-------------+
| Marketplace |     Transfer NFT/Tokens         |             |
| Contract    |-------------------------------->| NFT/Token   |
|             |<--------------------------------| Contracts   |
+------+------+                                 +-------------+
       |
       | Update listings
       v
+------+------+
|             |
| Blockchain  |
| Storage     |
|             |
+-------------+
```

### Liquidity Provider State Transitions

```
                    +-------------+
                    |             |
                    | No Liquidity|
                    |             |
                    +------+------+
                           |
                           | addLiquidity()
                           v
                    +------+------+
                    |             |
                    | LP Position |<---------+
                    |             |          |
                    |             |          | addLiquidity()
                    +------+------+          |
                           |                 |
                           |                 |
                           | removeLiquidity(partial)
                           |                 |
                           v                 |
                    +------+------+          |
                    |             |          |
                    | Reduced LP  |---------+
                    |             |
                    +------+------+
```
