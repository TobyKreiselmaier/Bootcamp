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

pragma solidity ^0.5.0;

import './interfaces/IEnergiTokenUpgrade.sol';
import './ERC20Upgrade.sol';

contract EnergiTokenUpgrade is ERC20Upgrade, IEnergiTokenUpgrade {

    address public owner; // Initialised on previous impl

    string public name; // Initialised on previous impl

    string public symbol; // Initialised on previous impl

    uint8 public decimals; // Initialised on previous impl

    bool public initialized = true; // Previous impl was already initialised

    address public vault;

    uint public minRedemptionAmount;

    bool public upgradeInitialized = false;

    modifier onlyOwner {
        require(msg.sender == owner, 'EnergiToken: FORBIDDEN');
        _;
    }

    function initializeUpgrade(
        address _vault,
        uint _minRedemptionAmount
    ) external {
        require(upgradeInitialized == false, 'EnergiTokenUpgrade: ALREADY_INITIALIZED');
        vault = _vault;
        minRedemptionAmount = _minRedemptionAmount;
        upgradeInitialized = true;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
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
