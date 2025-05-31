// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KKNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    address public kingdomsForgeContract;

    mapping(uint256 => bytes32) public tokenLineageHash;
    mapping(uint256 => bool) public isFromFullKkGrandparentage;

    event ItemForgedWithLineage(
        uint256 indexed tokenId,
        address indexed recipient,
        string tokenURI,
        bytes32 lineageHash,
        bool isFromFullKkGrandparentage
    );

    constructor(address initialOwner, string memory name, string memory symbol) ERC721(name, symbol) Ownable(initialOwner) {
    }

    function setKingdomsForgeContract(address _forgeAddress) public onlyOwner {
        require(_forgeAddress != address(0), "KKNFT: Forge address cannot be zero");
        kingdomsForgeContract = _forgeAddress;
    }

    function mintForgedItem(
        address recipient,
        string memory _tokenURI,
        bytes32 _lineageHash,
        bool _isFromFullKkGrandparentage
    ) public returns (uint256) {
        require(msg.sender == kingdomsForgeContract, "KKNFT: Caller is The Kingdom's Forge contract");
        require(recipient != address(0), "KKNFT: Mint to the zero address");

        uint256 newItemId = _nextTokenId;
        _nextTokenId++;

        _safeMint(recipient, newItemId);
        _setTokenURI(newItemId, _tokenURI);
        tokenLineageHash[newItemId] = _lineageHash;
        isFromFullKkGrandparentage[newItemId] = _isFromFullKkGrandparentage;

        emit ItemForgedWithLineage(newItemId, recipient, _tokenURI, _lineageHash, _isFromFullKkGrandparentage);
        return newItemId;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721URIStorage)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._increaseBalance(account, amount);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        _requireOwned(tokenId);
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
