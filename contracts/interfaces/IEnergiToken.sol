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

interface IEnergiToken {

    function owner() external view returns (address);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function initialized() external view returns (bool);

    function initialize(
        address _owner,
        string calldata _name,
        string calldata _symbol,
        uint8 _decimals
    ) external;

    function setOwner(address _owner) external;

    function mint(address recipient, uint amount) external;

    function burn(address recipient, uint amount) external;
}
