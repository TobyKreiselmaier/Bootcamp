pragma solidity 0.5.12;

contract Ownable{
   
    address payable internal owner;
      
    modifier onlyOwner(){
      require(msg.sender == owner, "Caller needs to be owner of the contract");
      _;
    }
    
    constructor() public{ 
      owner = msg.sender;
    }
}      