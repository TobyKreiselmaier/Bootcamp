pragma solidity 0.5.16;

/**
 * @title Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see ERC20Detailed{}.
 */

interface IERC20 {

    /**
     * @dev Minted supply of tokens.
     * @return Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Balance of individual accounts.
     * @return Returns the amount of tokens owned by @param account.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves @param amount tokens from the caller's account to @param recipient.
     * @return Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a Transfer() event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that @param spender will be
     * allowed to spend on behalf of @param owner through transferFrom(). This is
     * zero by default.
     * This value changes when approve() or transferFrom() are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets @param amount as the allowance of @param spender over the caller's tokens.
     * @return Returns a boolean value indicating whether the operation succeeded.
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this risk
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an Approval() event.
     *
     * Requirements:
     *
     * - @param spender cannot be the zero address.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves @param amount tokens from @param sender to @param recipient using the
     * allowance mechanism. @param amount is then deducted from the caller's
     * allowance.
     * @return Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a Transfer() event.
     *
     * Requirements:
     *
     * - @param sender and @param recipient cannot be the zero address.
     * - @param sender must have a balance of at least @param amount.
     * - the caller must have allowance for sender's tokens of at least @param amount.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Atomically increases the allowance granted to @param spender by the caller
     *      by @param addedValue.
     *      This is an alternative to approve() that can be used as a mitigation for
     *      problems described there.
     * @return Returns a boolean value indicating whether the operation succeeded.

     * Emits an Approval() event indicating the updated allowance.
     *
     * Requirements:
     *
     * - @param spender cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool);

    /**
     * @dev Atomically decreases the allowance granted to @param spender by the caller
     *      by @param subtractedValue.
     *      This is an alternative to approve() that can be used as a mitigation for
     *      problems described there.
     * @return Returns a boolean value indicating whether the operation succeeded.
     
     * Emits an Approval() event indicating the updated allowance.
     *
     * Requirements:
     *
     * - @param spender cannot be the zero address.
     * - @param spender must have allowance for the caller of at least @param subtractedValue.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);

    /**
     * @dev Emitted when @param value tokens are moved from one account @param from to
     * another @param to.
     *
     * Note that @param value may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a @param spender for an @param owner is set by
     * a call to approve. @param value is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
