// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INXSToken {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    // function decimals() external view returns (uint8); // Add if your NXS fee logic needs decimals
}
