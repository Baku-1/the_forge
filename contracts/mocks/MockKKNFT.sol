// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockKKNFT is ERC721, Ownable {
    address public authorizedForgeContract;
    uint256 public nextTokenIdToMint = 1; // To simulate incrementing token IDs

    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => bytes32) public tokenLineageHashes;
    mapping(uint256 => bool) public tokenGrandparentageFlags;

    event KKNFTMintedWithDetails( // Simplified event for mock
        address indexed recipient,
        uint256 indexed tokenId,
        string tokenURI,
        bytes32 lineageHash,
        bool isFromFullKkGrandparentage
    );

    constructor(string memory name, string memory symbol, address initialOwner) ERC721(name, symbol) Ownable(initialOwner) {}

    function setForgeContract(address _forgeAddress) public onlyOwner {
        authorizedForgeContract = _forgeAddress;
    }

    function mintForgedItem(
        address _recipient,
        string calldata _kkNftTokenURI,
        bytes32 _kkNftLineageHash,
        bool _isFromFullKkGrandparentage
    ) external returns (uint256) {
        require(msg.sender == authorizedForgeContract, "MockKKNFT: Not authorized forge contract");
        uint256 newItemId = nextTokenIdToMint++;
        _safeMint(_recipient, newItemId);
        _tokenURIs[newItemId] = _kkNftTokenURI;
        tokenLineageHashes[newItemId] = _kkNftLineageHash;
        tokenGrandparentageFlags[newItemId] = _isFromFullKkGrandparentage;

        emit KKNFTMintedWithDetails(_recipient, newItemId, _kkNftTokenURI, _kkNftLineageHash, _isFromFullKkGrandparentage);
        return newItemId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    // Add simple getters if needed for tests
    function getLineageHash(uint256 tokenId) external view returns (bytes32) {
        return tokenLineageHashes[tokenId];
    }

    function getGrandparentageFlag(uint256 tokenId) external view returns (bool) {
        return tokenGrandparentageFlags[tokenId];
    }
}
