import "./Ownable.sol";
import "./Destroyable.sol";
import "./Safemath.sol";

pragma solidity 0.5.12;

contract Token is Ownable, Destroyable{
   
    using SafeMath for uint256;

    string private _name;
    string private _symbol;
    uint8 private _decimals;
    
    uint256 private _totalSupply;
    
    mapping (address => uint256) private _balances;
    
    constructor(string memory name, string memory symbol, uint8 decimals) public {
        _name = name;
        _symbol = symbol;
        _decimals = decimals;
    }
    
    function name() public view returns (string memory){
        return _name;
    }
    
    function symbol() public view returns (string memory){
        return _symbol;
    }
    
    function decimals() public view returns (uint8){
        return _decimals;
    }
    
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view returns (uint256){
        return _balances[account];
    }
    
     function mint(address account, uint256 amount) public onlyOwner{
        require(account != address(0), "You can't mint to the burn address!");
        _balances[account] = _balances[account].add(amount);
        _totalSupply - _totalSupply.add(amount);
    }
    
    function transfer(address recipient, uint256 amount) public payable returns (bool){
        require(recipient != address(0), "Use the burn function for burning!");
        require(msg.value >= amount, "Insufficient Funds!");
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        return true;
    }
}