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

    event KingdomsForgeContractUpdated(address indexed oldForgeContract, address indexed newForgeContract);

    constructor(address initialOwner, string memory name, string memory symbol) ERC721(name, symbol) Ownable(initialOwner) {
    }

    function setKingdomsForgeContract(address _forgeAddress) public onlyOwner {
        require(_forgeAddress != address(0), "KKNFT: Forge address cannot be zero");
        address oldForgeContract = kingdomsForgeContract;
        kingdomsForgeContract = _forgeAddress;
        emit KingdomsForgeContractUpdated(oldForgeContract, _forgeAddress);
    }

    function mintForgedItem(
        address recipient,
        string memory _tokenURI,
        bytes32 _lineageHash,
        bool _isFromFullKkGrandparentage
    ) public returns (uint256) {
        require(msg.sender == kingdomsForgeContract, "KKNFT: Caller is not The Kingdom's Forge contract"); // Corrected error message
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

    // ERC721URIStorage requires these internal functions to be overridden when inheriting ERC721 and ERC721URIStorage
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
        // ERC721's _requireOwned calls _requireMinted which checks for existence.
        // OpenZeppelin's standard ERC721.tokenURI also calls _requireMinted (or _exists).
        // The _requireOwned in your original code is fine, effectively just an existence check.
        _requireOwned(tokenId); // This effectively means _requireMinted for tokenURI queries
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
