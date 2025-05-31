// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/INXSToken.sol"; // Using your NXS interface
import "./interfaces/IERC721.sol"; 
import "./KKNFT.sol";

contract TheKingdomsForge is Ownable, Pausable {
    struct InputNftIdentifier {
        address contractAddress;
        uint256 tokenId;
    }

    struct PrioritizedAttributeInput {
        uint256 inputNftIndex; 
        bytes32 traitType;     
        string traitValue;    
    }

    INXSToken public nxsToken; 
    KKNFT public kkNftContract;
    address public oracleAddress;
    address public feeCollectorAddress;

    uint256 public standardForgeNxsFee; 
    uint256 public enhancedForgeNxsFeeTier1;
    uint256 public primeForgeNxsFeeTier2;
    // Add more NXS fee tiers here if needed for APEX, etc.

    uint256 public nextRequestId;

    mapping(uint256 => ForgeRequest) public forgeRequests;
    mapping(address => mapping(uint256 => bool)) public hasBeenForgedWith;

    struct ForgeRequest {
        uint256 id;
        address user;
        InputNftIdentifier[] inputNfts; 
        uint256 nxsCommitted; 
        PrioritizedAttributeInput prioritizedAttribute;
        bool prioritizedAttributeProvided;
        uint256 requestTimestamp;
        bool processed;
        uint256 forgedKkNftId; 
    }

    event ForgeRequested(
        uint256 indexed requestId,
        address indexed user,
        InputNftIdentifier[] inputNfts,
        uint256 nxsCommitted,
        PrioritizedAttributeInput prioritizedAttribute,
        bool prioritizedAttributeProvided
    );

    event ItemForgedByOracle(
        uint256 indexed requestId,
        uint256 indexed newKkNftId,
        address indexed recipient,
        string tokenURI,
        bytes32 lineageHash, 
        uint8 tier,
        bool isFromFullKkGrandparentage 
    );

    event InputNftCommitted(
        uint256 indexed requestId,
        address indexed nftContract,
        uint256 indexed tokenId
    );

    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Forge: Caller is not the oracle");
        _;
    }

    constructor(
        address initialOwner,
        address _nxsTokenAddress,
        address _feeCollectorAddress,
        address _initialOracleAddress,
        uint256 _initialStandardNxsFee,
        uint256 _initialEnhancedNxsFee,
        uint256 _initialPrimeNxsFee
    ) Ownable(initialOwner) {
        require(_nxsTokenAddress != address(0), "NXS address cannot be zero");
        require(_feeCollectorAddress != address(0), "Fee collector cannot be zero");
        require(_initialOracleAddress != address(0), "Oracle address cannot be zero");

        nxsToken = INXSToken(_nxsTokenAddress);
        feeCollectorAddress = _feeCollectorAddress;
        oracleAddress = _initialOracleAddress;
        
        standardForgeNxsFee = _initialStandardNxsFee; 
        enhancedForgeNxsFeeTier1 = _initialEnhancedNxsFee; 
        primeForgeNxsFeeTier2 = _initialPrimeNxsFee; 
    }

    function requestForge(
        InputNftIdentifier[] calldata _inputNfts,
        uint256 _nxsCommitted, 
        PrioritizedAttributeInput calldata _prioritizedAttribute,
        bool _prioritizedAttributeProvided
    ) external whenNotPaused {
        require(msg.value == 0, "Forge: Do not send RON; NXS is fee token");
        require(_inputNfts.length == 2, "Forge: Exactly 2 input NFTs required");
        require(_nxsCommitted >= standardForgeNxsFee, "Forge: Insufficient NXS for standard forge");
        // TODO: Add checks for other NXS fee tiers if _nxsCommitted should match a specific tier precisely.

        for (uint i = 0; i < _inputNfts.length; i++) {
            require(_inputNfts[i].contractAddress != address(0), "Forge: Input NFT contract address cannot be zero");
            require(
                !hasBeenForgedWith[_inputNfts[i].contractAddress][_inputNfts[i].tokenId],
                "Forge: Input NFT already used"
            );
        }
        if (_prioritizedAttributeProvided) {
            require(_prioritizedAttribute.inputNftIndex < _inputNfts.length, "Forge: Invalid index for prioritized NFT");
        }

        nxsToken.transferFrom(msg.sender, feeCollectorAddress, _nxsCommitted);

        uint256 currentRequestId = nextRequestId;
        nextRequestId++;

        InputNftIdentifier[] memory inputNftsCopy = new InputNftIdentifier[](_inputNfts.length);
        for(uint i = 0; i < _inputNfts.length; i++) {
            inputNftsCopy[i] = _inputNfts[i];
        }

        forgeRequests[currentRequestId] = ForgeRequest({
            id: currentRequestId,
            user: msg.sender,
            inputNfts: inputNftsCopy,
            nxsCommitted: _nxsCommitted,
            prioritizedAttribute: _prioritizedAttribute,
            prioritizedAttributeProvided: _prioritizedAttributeProvided,
            requestTimestamp: block.timestamp,
            processed: false,
            forgedKkNftId: 0
        });

        emit ForgeRequested(
            currentRequestId,
            msg.sender,
            _inputNfts,
            _nxsCommitted,
            _prioritizedAttribute,
            _prioritizedAttributeProvided
        );
    }

    function secureMintForgedItem(
        uint256 _requestId,
        address _recipient,
        string calldata _kkNftTokenURI,
        bytes32 _kkNftLineageHash,
        uint8 _kkNftTier,
        bool _isFromFullKkGrandparentage 
    ) external onlyOracle whenNotPaused {
        ForgeRequest storage requestToProcess = forgeRequests[_requestId];
        require(requestToProcess.id != 0, "Forge: Invalid request ID"); 
        require(requestToProcess.user == _recipient, "Forge: Recipient mismatch");
        require(!requestToProcess.processed, "Forge: Request already processed");
        require(address(kkNftContract) != address(0), "Forge: KKNFT contract not set");

        requestToProcess.processed = true;

        uint256 newKkNftId = kkNftContract.mintForgedItem(
            _recipient,
            _kkNftTokenURI,
            _kkNftLineageHash,
            _isFromFullKkGrandparentage 
        );
        requestToProcess.forgedKkNftId = newKkNftId;

        for (uint i = 0; i < requestToProcess.inputNfts.length; i++) {
            InputNftIdentifier memory inputNft = requestToProcess.inputNfts[i];
            hasBeenForgedWith[inputNft.contractAddress][inputNft.tokenId] = true;
            emit InputNftCommitted(_requestId, inputNft.contractAddress, inputNft.tokenId);
        }

        emit ItemForgedByOracle(
            _requestId,
            newKkNftId,
            _recipient,
            _kkNftTokenURI,
            _kkNftLineageHash,
            _kkNftTier,
            _isFromFullKkGrandparentage
        );
    }

    function setKkNftContractAddress(address _newKkNftAddress) public onlyOwner {
        require(_newKkNftAddress != address(0), "Forge: KKNFT address cannot be zero");
        kkNftContract = KKNFT(_newKkNftAddress);
    }

    function setNxsTokenAddress(address _newNxsAddress) public onlyOwner {
        require(_newNxsAddress != address(0), "Forge: NXS address cannot be zero");
        nxsToken = INXSToken(_newNxsAddress);
    }

    function setOracleAddress(address _newOracleAddress) public onlyOwner {
        require(_newOracleAddress != address(0), "Forge: Oracle address cannot be zero");
        oracleAddress = _newOracleAddress;
    }

    function setFeeCollectorAddress(address _newFeeCollectorAddress) public onlyOwner {
        require(_newFeeCollectorAddress != address(0), "Forge: Fee collector cannot be zero");
        feeCollectorAddress = _newFeeCollectorAddress;
    }

    function setNxsFeeTiers(uint256 _standard, uint256 _enhanced, uint256 _prime /*, uint256 _apex */) public onlyOwner {
        // Add more parameters if you have more tiers like APEX
        standardForgeNxsFee = _standard;
        enhancedForgeNxsFeeTier1 = _enhanced;
        primeForgeNxsFeeTier2 = _prime;
        // apexForgeNxsFeeTier3 = _apex;
    }

    function pauseForge() public onlyOwner {
        _pause();
    }

    function unpauseForge() public onlyOwner {
        _unpause();
    }

    function withdrawStuckTokens(address _tokenAddress, address _to, uint256 _amount) public onlyOwner {
        // Ensure this is not the NXS fee token, as NXS fees are handled by feeCollectorAddress logic
        require(_tokenAddress != address(nxsToken), "Forge: Use fee distribution for NXS");
        IERC20(_tokenAddress).transfer(_to, _amount);
    }

    function withdrawStuckRonin(address payable _to, uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Forge: Insufficient Ronin balance");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Forge: Ronin transfer failed");
    }
}
