// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/INXSToken.sol"; 
import "./interfaces/IERC721.sol"; 
import "./KKNFT.sol"; // Assuming KKNFT.sol is in the same directory or adjust path

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
    KKNFT public kkNftContract; // Changed from interface to actual contract type for direct calls
    address public oracleAddress;
    address public feeCollectorAddress;

    uint256 public standardForgeNxsFee; 
    uint256 public enhancedForgeNxsFeeTier1;
    uint256 public primeForgeNxsFeeTier2;
    // Add more NXS fee tiers here if needed for APEX, etc.
    // Example: uint256 public apexForgeNxsFeeTier3;

    uint256 public nextRequestId; // Starts at 0

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
        InputNftIdentifier[] inputNfts, // Note: For complex structs, consider hashing for direct indexing or use simpler parameters if not needing full struct in event.
        uint256 nxsCommitted,
        PrioritizedAttributeInput prioritizedAttribute, // Same consideration as above for event parameters
        bool prioritizedAttributeProvided
    );

    event ItemForgedByOracle(
        uint256 indexed requestId,
        uint256 indexed newKkNftId,
        address indexed recipient,
        string tokenURI, // This is a string, can be long. Consider if essential for event.
        bytes32 lineageHash, 
        uint8 tier,
        bool isFromFullKkGrandparentage 
    );

    event InputNftCommitted(
        uint256 indexed requestId,
        address indexed nftContract,
        uint256 indexed tokenId
    );
    
    // Event for admin changes
    event KkNftContractAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event NxsTokenAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event OracleAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event FeeCollectorAddressUpdated(address indexed oldAddress, address indexed newAddress);
    event NxsFeeTiersUpdated(uint256 standard, uint256 enhanced, uint256 prime /*, uint256 apex */);


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
        // uint256 _initialApexNxsFee // Example for more tiers
    ) Ownable(initialOwner) {
        require(_nxsTokenAddress != address(0), "Forge: NXS address cannot be zero");
        require(_feeCollectorAddress != address(0), "Forge: Fee collector cannot be zero");
        require(_initialOracleAddress != address(0), "Forge: Oracle address cannot be zero");

        nxsToken = INXSToken(_nxsTokenAddress);
        feeCollectorAddress = _feeCollectorAddress;
        oracleAddress = _initialOracleAddress;
        
        standardForgeNxsFee = _initialStandardNxsFee; 
        enhancedForgeNxsFeeTier1 = _initialEnhancedNxsFee; 
        primeForgeNxsFeeTier2 = _initialPrimeNxsFee; 
        // apexForgeNxsFeeTier3 = _initialApexNxsFee;
    }

    function requestForge(
        InputNftIdentifier[] calldata _inputNfts,
        uint256 _nxsCommitted, 
        PrioritizedAttributeInput calldata _prioritizedAttribute,
        bool _prioritizedAttributeProvided
    ) external whenNotPaused { // removed payable
        require(msg.value == 0, "Forge: Do not send RON; NXS is fee token");
        require(_inputNfts.length == 2, "Forge: Exactly 2 input NFTs required");

        // Check for duplicate input NFTs (same contract and token ID for both inputs)
        if (_inputNfts[0].contractAddress == _inputNfts[1].contractAddress && 
            _inputNfts[0].tokenId == _inputNfts[1].tokenId) {
            revert("Forge: Input NFTs must be unique within the same request");
        }

        // NXS fee check - design choice needed here for precise tier matching vs. minimum
        // Current: requires at least standard. Backend would determine actual tier from _nxsCommitted.
        // TODO: If _nxsCommitted must *exactly* match a tier fee (e.g., standard, enhanced, prime),
        // add more specific checks here or ensure the off-chain logic validates this.
        // Example:
        // bool isValidTierCommitment = (_nxsCommitted == standardForgeNxsFee ||
        //                             _nxsCommitted == enhancedForgeNxsFeeTier1 ||
        //                             _nxsCommitted == primeForgeNxsFeeTier2);
        // require(isValidTierCommitment, "Forge: NXS amount does not match a defined tier");
        require(_nxsCommitted >= standardForgeNxsFee, "Forge: Insufficient NXS for standard forge");


        for (uint i = 0; i < _inputNfts.length; i++) {
            require(_inputNfts[i].contractAddress != address(0), "Forge: Input NFT contract address cannot be zero");
            // Verify caller owns the input NFT
            require(IERC721(_inputNfts[i].contractAddress).ownerOf(_inputNfts[i].tokenId) == msg.sender, "Forge: Caller must own input NFT");
            // Check if already used
            require(
                !hasBeenForgedWith[_inputNfts[i].contractAddress][_inputNfts[i].tokenId],
                "Forge: Input NFT already used"
            );
        }

        if (_prioritizedAttributeProvided) {
            require(_prioritizedAttribute.inputNftIndex < _inputNfts.length, "Forge: Invalid index for prioritized NFT");
            // Optional: Could add checks for traitType/Value length if needed, but usually handled off-chain.
        }

        // Transfer NXS from user to fee collector
        nxsToken.transferFrom(msg.sender, feeCollectorAddress, _nxsCommitted);

        uint256 currentRequestId = nextRequestId;
        nextRequestId++; // Increment for next request

        // Copy calldata to memory for storage
        InputNftIdentifier[] memory inputNftsCopy = new InputNftIdentifier[](_inputNfts.length);
        for(uint i = 0; i < _inputNfts.length; i++) {
            inputNftsCopy[i] = _inputNfts[i];
        }

        forgeRequests[currentRequestId] = ForgeRequest({
            id: currentRequestId, // Store the ID
            user: msg.sender,
            inputNfts: inputNftsCopy,
            nxsCommitted: _nxsCommitted,
            prioritizedAttribute: _prioritizedAttribute,
            prioritizedAttributeProvided: _prioritizedAttributeProvided,
            requestTimestamp: block.timestamp,
            processed: false,
            forgedKkNftId: 0 // Will be updated upon successful minting
        });

        emit ForgeRequested(
            currentRequestId,
            msg.sender,
            _inputNfts, // Emitting calldata directly
            _nxsCommitted,
            _prioritizedAttribute, // Emitting calldata directly
            _prioritizedAttributeProvided
        );
    }

    function secureMintForgedItem(
        uint256 _requestId,
        address _recipient, // Should be the user who made the request
        string calldata _kkNftTokenURI,
        bytes32 _kkNftLineageHash,
        uint8 _kkNftTier, // Tier determined by backend, passed by oracle
        bool _isFromFullKkGrandparentage // Determined by backend
    ) external onlyOracle whenNotPaused {
        ForgeRequest storage requestToProcess = forgeRequests[_requestId];
        
        // Changed from requestToProcess.id != 0 to user != address(0)
        require(requestToProcess.user != address(0), "Forge: Request not initialized or invalid ID"); 
        require(requestToProcess.user == _recipient, "Forge: Recipient mismatch with original request user");
        require(!requestToProcess.processed, "Forge: Request already processed");
        require(address(kkNftContract) != address(0), "Forge: KKNFT contract not set");

        // IMPORTANT: Consider implications if kkNftContract.mintForgedItem reverts.
        // If it reverts, `processed` is true, and this `_requestId` cannot be retried by the oracle.
        // This ensures one attempt at minting per request ID.
        // If retries are needed for certain types of mint failures (e.g., KKNFT contract temporarily paused),
        // you might move `requestToProcess.processed = true;` to after the mint call.
        requestToProcess.processed = true; 

        uint256 newKkNftId = kkNftContract.mintForgedItem(
            _recipient,
            _kkNftTokenURI,
            _kkNftLineageHash,
            _isFromFullKkGrandparentage
        );
        requestToProcess.forgedKkNftId = newKkNftId;

        // Mark input NFTs as used *after* successful minting
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

    // --- Admin Functions ---

    function setKkNftContractAddress(address _newKkNftAddress) public onlyOwner {
        require(_newKkNftAddress != address(0), "Forge: KKNFT address cannot be zero");
        address oldAddress = address(kkNftContract);
        kkNftContract = KKNFT(_newKkNftAddress); // Cast to KKNFT contract type
        emit KkNftContractAddressUpdated(oldAddress, _newKkNftAddress);
    }

    function setNxsTokenAddress(address _newNxsAddress) public onlyOwner {
        require(_newNxsAddress != address(0), "Forge: NXS address cannot be zero");
        address oldAddress = address(nxsToken);
        nxsToken = INXSToken(_newNxsAddress);
        emit NxsTokenAddressUpdated(oldAddress, _newNxsAddress);
    }

    function setOracleAddress(address _newOracleAddress) public onlyOwner {
        require(_newOracleAddress != address(0), "Forge: Oracle address cannot be zero");
        address oldAddress = oracleAddress;
        oracleAddress = _newOracleAddress;
        emit OracleAddressUpdated(oldAddress, _newOracleAddress);
    }

    function setFeeCollectorAddress(address _newFeeCollectorAddress) public onlyOwner {
        require(_newFeeCollectorAddress != address(0), "Forge: Fee collector cannot be zero");
        address oldAddress = feeCollectorAddress;
        feeCollectorAddress = _newFeeCollectorAddress;
        emit FeeCollectorAddressUpdated(oldAddress, _newFeeCollectorAddress);
    }

    function setNxsFeeTiers(
        uint256 _standard, 
        uint256 _enhanced, 
        uint256 _prime 
        /*, uint256 _apex */ // Add more parameters if you have more tiers like APEX
    ) public onlyOwner {
        // Add require checks for sensible fee values, e.g., standard <= enhanced <= prime
        require(_standard > 0, "Forge: Standard fee must be positive"); // Or some minimum
        require(_enhanced >= _standard, "Forge: Enhanced fee not less than standard");
        require(_prime >= _enhanced, "Forge: Prime fee not less than enhanced");
        // require(_apex >= _prime, "Forge: Apex fee not less than prime");


        standardForgeNxsFee = _standard;
        enhancedForgeNxsFeeTier1 = _enhanced;
        primeForgeNxsFeeTier2 = _prime;
        // apexForgeNxsFeeTier3 = _apex;

        emit NxsFeeTiersUpdated(_standard, _enhanced, _prime /*, _apex */);
    }

    function pauseForge() public onlyOwner {
        _pause(); // Emits Paused(msg.sender)
    }

    function unpauseForge() public onlyOwner {
        _unpause(); // Emits Unpaused(msg.sender)
    }

    // --- Emergency Withdraw Functions ---

    function withdrawStuckTokens(address _tokenAddress, address _to, uint256 _amount) public onlyOwner {
        require(_to != address(0), "Forge: Withdraw to zero address");
        // Ensure this is not the NXS fee token, as NXS fees are handled by feeCollectorAddress logic
        // and subsequent distribution from there (as per your compendium).
        require(_tokenAddress != address(nxsToken), "Forge: NXS token cannot be withdrawn this way; use fee distribution logic");
        
        // Using IERC20 interface, ensure you have it imported or OpenZeppelin's IERC20.sol
        IERC20 token = IERC20(_tokenAddress);
        require(token.balanceOf(address(this)) >= _amount, "Forge: Insufficient token balance in contract");
        token.transfer(_to, _amount);
    }

    function withdrawStuckRonin(address payable _to, uint256 _amount) public onlyOwner {
        require(_to != address(0), "Forge: Withdraw to zero address");
        require(address(this).balance >= _amount, "Forge: Insufficient Ronin balance in contract");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Forge: Ronin transfer failed");
    }

    // --- View Functions (Optional Examples) ---
    function getForgeRequestDetails(uint256 _requestId) public view returns (ForgeRequest memory) {
        // Solidity cannot return a struct with a dynamically-sized array (inputNfts) directly to external callers
        // without ABIEncoderV2 and careful handling.
        // For external calls, you might return individual fields or hash the struct.
        // This internal getter is fine, but for external view, be mindful.
        return forgeRequests[_requestId];
    }
}
