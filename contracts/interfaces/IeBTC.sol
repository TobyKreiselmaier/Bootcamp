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

/**
 * @title Interface of the eBTC token.
 */

interface IeBTC {

    /* Getter Functions for state variables */
    function owner() external view returns (address);
    function vault() external view returns (address);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function minRedemptionAmount() external view returns (uint256);
    function initialized() external view returns (bool);
    function upgradeInitialized() external view returns (bool);

    /* Setter Functions for state variables for contract owner only */
    function setOwner(address _owner) external;
    function setName(string calldata _name) external;
    function setSymbol(string calldata _symbol) external;
    function setVault(address _vault) external;
    function setMinRedemptionAmount(uint256 _minRedemptionAmount) external;

    /* External Functions */
    /**
     * @dev Call the internal function in the parent contract ERC20{}.
     */
    function mint(address recipient, uint256 amount) external;

    /**
     * @dev Call the internal function in the parent contract ERC20{}.
     */
    function burn(address account, uint256 amount) external;

    /**
     * @dev Call the internal function in the parent contract ERC20{}.
     */
    function burnFrom(address sender, address account, uint256 amount) external;
}
