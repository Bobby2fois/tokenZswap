// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenSwap
 * @dev A minimal AMM implementation with constant product formula (x*y=k)
 */
contract TokenSwap is ERC20, Ownable, ReentrancyGuard {
    // Fee settings (0.3% fee = 997/1000)
    uint256 public constant FEE_NUMERATOR = 997;
    uint256 public constant FEE_DENOMINATOR = 1000;

    // Tokens in the liquidity pool
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;

    // Minimum liquidity to prevent division by zero attacks
    uint256 private constant MINIMUM_LIQUIDITY = 10**3;
    
    // Events
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed user, uint256 amountIn, address tokenIn, uint256 amountOut, address tokenOut);

    /**
     * @dev Constructor initializes the AMM with two tokens
     * @param _tokenA Address of the first token
     * @param _tokenB Address of the second token
     */
    constructor(
        address _tokenA,
        address _tokenB
    ) ERC20("TokenSwap LP Token", "TSLP") Ownable(msg.sender) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        require(_tokenA != _tokenB, "Tokens must be different");
        
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /**
     * @dev Returns the current reserves of both tokens
     */
    function getReserves() public view returns (uint256 reserveA, uint256 reserveB) {
        reserveA = tokenA.balanceOf(address(this));
        reserveB = tokenB.balanceOf(address(this));
    }

    /**
     * @dev Adds liquidity to the pool
     * @param amountADesired Amount of tokenA to add
     * @param amountBDesired Amount of tokenB to add
     * @return amountA Amount of tokenA actually added
     * @return amountB Amount of tokenB actually added
     * @return liquidity Amount of LP tokens minted
     */
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired
    ) external nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (uint256 reserveA, uint256 reserveB) = getReserves();
        
        // Determine optimal amounts to add
        if (reserveA == 0 && reserveB == 0) {
            // First liquidity provision
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            
            if (amountBOptimal <= amountBDesired) {
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }
        
        // Transfer tokens to the contract
        require(tokenA.transferFrom(msg.sender, address(this), amountA), "Transfer of tokenA failed");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "Transfer of tokenB failed");
        
        // Calculate liquidity tokens to mint
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            // Initial liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY
            liquidity = _sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            _mint(address(1), MINIMUM_LIQUIDITY); // Burn address gets minimum liquidity
        } else {
            // Mint proportional to existing reserves
            liquidity = _min(
                (amountA * _totalSupply) / reserveA,
                (amountB * _totalSupply) / reserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        _mint(msg.sender, liquidity);
        
        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
        return (amountA, amountB, liquidity);
    }

    /**
     * @dev Removes liquidity from the pool
     * @param liquidity Amount of LP tokens to burn
     * @return amountA Amount of tokenA received
     * @return amountB Amount of tokenB received
     */
    function removeLiquidity(
        uint256 liquidity
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(liquidity > 0, "Insufficient liquidity");
        
        uint256 _totalSupply = totalSupply();
        (uint256 reserveA, uint256 reserveB) = getReserves();
        
        // Calculate token amounts proportional to liquidity share
        amountA = (liquidity * reserveA) / _totalSupply;
        amountB = (liquidity * reserveB) / _totalSupply;
        
        // Burn LP tokens and transfer tokens back to user
        _burn(msg.sender, liquidity);
        require(tokenA.transfer(msg.sender, amountA), "Transfer of tokenA failed");
        require(tokenB.transfer(msg.sender, amountB), "Transfer of tokenB failed");
        
        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
        return (amountA, amountB);
    }

    /**
     * @dev Swaps tokenA for tokenB
     * @param amountIn Amount of tokenA to swap
     * @return amountOut Amount of tokenB received
     */
    function swapAForB(uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Insufficient input amount");
        (uint256 reserveA, uint256 reserveB) = getReserves();
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        // Calculate output amount using constant product formula with fee
        amountOut = getAmountOut(amountIn, reserveA, reserveB);
        
        // Transfer tokens
        require(tokenA.transferFrom(msg.sender, address(this), amountIn), "Transfer of tokenA failed");
        require(tokenB.transfer(msg.sender, amountOut), "Transfer of tokenB failed");
        
        emit Swap(msg.sender, amountIn, address(tokenA), amountOut, address(tokenB));
        return amountOut;
    }

    /**
     * @dev Swaps tokenB for tokenA
     * @param amountIn Amount of tokenB to swap
     * @return amountOut Amount of tokenA received
     */
    function swapBForA(uint256 amountIn) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Insufficient input amount");
        (uint256 reserveA, uint256 reserveB) = getReserves();
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        // Calculate output amount using constant product formula with fee
        amountOut = getAmountOut(amountIn, reserveB, reserveA);
        
        // Transfer tokens
        require(tokenB.transferFrom(msg.sender, address(this), amountIn), "Transfer of tokenB failed");
        require(tokenA.transfer(msg.sender, amountOut), "Transfer of tokenA failed");
        
        emit Swap(msg.sender, amountIn, address(tokenB), amountOut, address(tokenA));
        return amountOut;
    }

    /**
     * @dev Calculates the output amount for a swap using constant product formula with fee
     * @param amountIn Amount of input token
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return Amount of output token
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        // Apply fee: amountInWithFee = amountIn * fee
        uint256 amountInWithFee = amountIn * FEE_NUMERATOR;
        
        // Calculate output amount: (reserveOut * amountInWithFee) / (reserveIn * FEE_DENOMINATOR + amountInWithFee)
        uint256 numerator = reserveOut * amountInWithFee;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        
        return numerator / denominator;
    }

    /**
     * @dev Square root function
     * @param y Number to calculate square root of
     * @return z Square root of y
     */
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /**
     * @dev Returns the minimum of two numbers
     */
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
