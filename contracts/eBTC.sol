// Copyright (C) 2020 Energi Core

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity 0.5.16;

import './interfaces/IeBTC.sol';
import './ERC20.sol';

/**
 * @title Implementation of the IeBTC{} interface.
 */

contract eBTC is ERC20, IeBTC {

    /* Variables */
    address public owner;
    address public vault;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public minRedemptionAmount;
    bool public initialized = false; // There is no previous impl yet
    bool public upgradeInitialized = false; // There is no previous upgrade yet

    /* Modifier */
    modifier onlyOwner {
        require(msg.sender == owner, 'eBTC: FORBIDDEN');
        _;
    }

    /* External Functions */
    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function setName(string calldata _name) external onlyOwner {
        name = _name;
    }

    function setSymbol(string calldata _symbol) external onlyOwner {
        symbol = _symbol;
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    function setMinRedemptionAmount(uint _minRedemptionAmount) external onlyOwner {
        minRedemptionAmount = _minRedemptionAmount;
    }

    function mint(address recipient, uint amount) external onlyOwner {
        _mint(recipient, amount);
    }

    function burn(address recipient, uint amount) external onlyOwner {
        _burn(recipient, amount);
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        if(recipient == vault) {
            require(amount >= minRedemptionAmount, "EnergiToken: redemption amount too small");
        }
        _transfer(_msgSender(), recipient, amount);
        emit Approval(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        if(recipient == vault) {
            require(amount >= minRedemptionAmount, "EnergiToken: redemption amount too small");
        }
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }
}
