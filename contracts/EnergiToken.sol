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

import './interfaces/IEnergiToken.sol';
import './ERC20.sol';

contract EnergiToken is ERC20, IEnergiToken {

    address public owner;

    string public name;

    string public symbol;

    uint8 public decimals;

    bool public initialized = false;

    modifier onlyOwner {
        require(msg.sender == owner, 'EnergiToken: FORBIDDEN');
        _;
    }

    function initialize(
        address _owner,
        string calldata _name,
        string calldata _symbol,
        uint8 _decimals
    ) external {
        require(initialized == false, 'EnergiToken: ALREADY_INITIALIZED');
        owner = _owner;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        initialized = true;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function mint(address recipient, uint amount) external onlyOwner {
        _mint(recipient, amount);
    }

    function burn(address recipient, uint amount) external onlyOwner {
        _burn(recipient, amount);
    }
}
