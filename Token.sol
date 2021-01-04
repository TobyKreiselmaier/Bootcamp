import "./Ownable.sol";
pragma solidity 0.5.12;

contract Token is Ownable{
   
    string private _name;//it is common practice to use underscore for private variables
    string private _symbol;
    uint8 private _decimals;
    
    uint256 private _totalSupply;
    
    mapping (address => uint256) private _balances;
    
    constructor(string memory name, string memory symbol, uint8 decimals) public {
        _name = name;
        _symbol = symbol;
        _decimals = decimals; //18 digits is the maximum
    }
    
    function name() public view returns (string memory){//using public functions over public state variables is clearer and a more common way of doing things
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
        require(account != address(0), "You can't mint to the burn address!")
        _balances[account] += amount;
        _totalSupply += amount;
    }
    
    function transfer(address recipient, uint256 amount) public payable returns (bool){
        require(recipient != address(0), "Use the burn function for burning!");
        require(msg.value >= amount, "Insufficient Funds!");
        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;
        return true; //ERC20 requirement.
    }
}