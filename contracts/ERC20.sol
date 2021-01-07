pragma solidity 0.5.16;

import "./Context.sol";
import "./interfaces/IERC20.sol";
import "./libraries/SafeMath.sol";

/**
 * @title Implementation of the IERC20{} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using _mint().
 * For a generic mechanism see ERC20Mintable{}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * We have followed general OpenZeppelin guidelines: functions revert instead
 * of returning `false` on failure. This behavior is nonetheless conventional
 * and does not conflict with the expectations of ERC20 applications.
 *
 * Additionally, an Approval() event is emitted on calls to transferFrom().
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard decreaseAllowance() and increaseAllowance()
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See IERC20.approve().
 */
contract ERC20 is Context, IERC20 {

    /* Library */
    using SafeMath for uint256;

    /* Variables */
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) internal _allowances;
    uint256 private _totalSupply;

    /* Public functions as outlined in IERC20 */
    /**
     * @dev Minted supply of tokens.
     * @return Returns the amount of tokens in existence.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Balance of individual accounts.
     * @return Returns the amount of tokens owned by @param account.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Moves @param amount tokens from the caller's account to @param recipient.
     * @return Returns a boolean value indicating whether the operation succeeded.
     * Note: this function is implemented in the token contract and was removed here
     * to avoid overriding.
     */
//    function transfer(address recipient, uint256 amount) public returns (bool) {
//        _transfer(_msgSender(), recipient, amount);
//        emit Approval(_msgSender(), recipient, amount);
//        return true;
//    }

    /**
     * @dev Returns the remaining number of tokens that @param spender will be
     * allowed to spend on behalf of @param owner through transferFrom(). This is
     * zero by default.
     * This value changes when approve() or transferFrom() are called.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev Sets @param amount as the allowance of @param spender over the caller's tokens.
     * @return Returns a boolean value indicating whether the operation succeeded.
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "ERC20: zero address not allowed");
        _approve(_msgSender(), spender, amount);
        emit Approval(_msgSender(), spender, amount);
        return true;
    }

    /**
     * @dev Moves @param amount tokens from @param sender to @param recipient using the
     * allowance mechanism. @param amount is then deducted from the caller's
     * allowance.
     * @return Returns a boolean value indicating whether the operation succeeded.
     * Note: this function is implemented in the token contract and was removed here
     * to avoid overriding.
     */
//    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
//        require(_balances[sender] >= amount, "ERC20: approval amount exceeds balance");
//        _transfer(sender, recipient, amount);
//        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount));
//        return true;
//    }

    /**
     * @dev Atomically increases the allowance granted to @param spender by the caller
     *      by @param addedValue.
     *      This is an alternative to approve() that can be used as a mitigation for
     *      problems described there.
     * @return Returns a boolean value indicating whether the operation succeeded.
     */
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        require(spender != address(0), "ERC20: zero address not allowed");
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(addedValue));
        emit Approval(_msgSender(), spender, _allowances[_msgSender()][spender]);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to @param spender by the caller
     *      by @param subtractedValue.
     *      This is an alternative to approve() that can be used as a mitigation for
     *      problems described there.
     * @return Returns a boolean value indicating whether the operation succeeded.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        require(spender != address(0), "ERC20: zero address not allowed");
        require(_allowances[_msgSender()][spender] >= subtractedValue, 
            "ERC20: decreased allowance below zero");
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].sub(subtractedValue));
        emit Approval(_msgSender(), spender, _allowances[_msgSender()][spender]);
        return true;
    }

    /* Internal Functions */
    /**
     * @dev Moves tokens @param amount from @param sender to @param recipient.
     */
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(_balances[sender] >= amount, "ERC20: transfer amount exceeds balance");
        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    /** 
     * @dev Creates @param amount tokens and assigns them to @param account,
     * increasing the total supply.
     */
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address not allowed");
        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    /**
     * @dev Destroys @param amount tokens from @param account,
     * reducing the total supply.
     */
    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");
        require(_balances[account] >= amount, "ERC20: burn amount exceeds balance");
        _balances[account] = _balances[account].sub(amount);
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }

    /**
     * @dev Sets @param amount as the allowance of @param spender
     * over the tokens of the @param owner.
     */
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        require(_balances[owner] >= amount, "ERC20: approval amount exceeds balance");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Destroys @param amount tokens from @param account.
     * The caller's allowance is also reduced.
     *
     * See _burn() and _approve().
     */
    function _burnFrom(address sender, address account, uint256 amount) internal {
        require(sender != address(0), "ERC20: zero address not allowed");
        require(_allowances[sender][account] >= amount, 
            "ERC20: decreased allowance below zero");
        _burn(account, amount);
        _approve(account, sender, _allowances[account][_msgSender()].sub(amount));
    }
}
