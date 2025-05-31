// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address owner);
    // function safeTransferFrom(address from, address to, uint256 tokenId) external; // If needed by Forge
}
