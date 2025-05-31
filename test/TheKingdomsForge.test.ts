import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// Assuming TypeChain generates types for your actual contracts and mocks
// import { TheKingdomsForge, MockKKNFT, MockERC20, MockParentNFT } from "../typechain-types";

describe("TheKingdomsForge Contract", function () {
    // Type placeholders - replace with actual TypeChain types when available
    let forgeContract: any; // TheKingdomsForge;
    let mockKkNftContract: any; // MockKKNFT;
    let mockNxsToken: any; // MockERC20;
    let mockParentNft1: any; // MockParentNFT;
    let mockParentNft2: any; // MockParentNFT;

    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let oracle: SignerWithAddress;
    let feeCollector: SignerWithAddress;
    let otherAddress: SignerWithAddress;

    const ZERO_ADDRESS = ethers.constants.AddressZero;

    // Default Fee Tiers
    const STANDARD_FEE = ethers.utils.parseUnits("100", 18); // 100 NXS
    const ENHANCED_FEE = ethers.utils.parseUnits("200", 18); // 200 NXS
    const PRIME_FEE = ethers.utils.parseUnits("300", 18);    // 300 NXS

    async function deployContracts() {
        [owner, user1, user2, oracle, feeCollector, otherAddress] = await ethers.getSigners();

        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        mockNxsToken = await MockERC20Factory.deploy("Mock NXS", "mNXS", ethers.utils.parseUnits("1000000", 18));

        const MockKKNFTFactory = await ethers.getContractFactory("MockKKNFT");
        mockKkNftContract = await MockKKNFTFactory.deploy("Mock KKNFT", "mKKN", owner.address);
        
        const TheKingdomsForgeFactory = await ethers.getContractFactory("TheKingdomsForge");
        forgeContract = await TheKingdomsForgeFactory.deploy(
            owner.address, // initialOwner for Ownable
            mockNxsToken.address,
            feeCollector.address,
            oracle.address,
            STANDARD_FEE,
            ENHANCED_FEE,
            PRIME_FEE
        );

        // Set the KKNFT contract address in TheKingdomsForge
        await forgeContract.connect(owner).setKkNftContractAddress(mockKkNftContract.address);
        // Authorize TheKingdomsForge contract to mint MockKKNFTs
        await mockKkNftContract.connect(owner).setForgeContract(forgeContract.address);

        // Distribute NXS to users
        await mockNxsToken.connect(owner).mint(user1.address, ethers.utils.parseUnits("5000", 18));
        await mockNxsToken.connect(owner).mint(user2.address, ethers.utils.parseUnits("5000", 18));

        // Deploy Mock Parent NFTs
        const MockParentNFTFactory = await ethers.getContractFactory("MockParentNFT");
        mockParentNft1 = await MockParentNFTFactory.deploy("Parent NFT One", "PN1");
        mockParentNft2 = await MockParentNFTFactory.deploy("Parent NFT Two", "PN2");

        // User approvals for NXS
        await mockNxsToken.connect(user1).approve(forgeContract.address, ethers.constants.MaxUint256);
        await mockNxsToken.connect(user2).approve(forgeContract.address, ethers.constants.MaxUint256);
    }

    beforeEach(async function () {
        await deployContracts();
    });

    describe("Constructor and Initial State", function () {
        it("Should set the initial owner correctly", async function () {
            expect(await forgeContract.owner()).to.equal(owner.address);
        });

        it("Should set NXS token address", async function () {
            expect(await forgeContract.nxsToken()).to.equal(mockNxsToken.address);
        });

        it("Should set fee collector address", async function () {
            expect(await forgeContract.feeCollectorAddress()).to.equal(feeCollector.address);
        });

        it("Should set oracle address", async function () {
            expect(await forgeContract.oracleAddress()).to.equal(oracle.address);
        });

        it("Should set NXS fee tiers correctly", async function () {
            expect(await forgeContract.standardForgeNxsFee()).to.equal(STANDARD_FEE);
            expect(await forgeContract.enhancedForgeNxsFeeTier1()).to.equal(ENHANCED_FEE);
            expect(await forgeContract.primeForgeNxsFeeTier2()).to.equal(PRIME_FEE);
        });

        it("Should revert if NXS token address is zero", async function () {
            const TheKingdomsForgeFactory = await ethers.getContractFactory("TheKingdomsForge");
            await expect(TheKingdomsForgeFactory.deploy(owner.address, ZERO_ADDRESS, feeCollector.address, oracle.address, 1,1,1))
                .to.be.revertedWith("NXS address cannot be zero");
        });
        // Add similar reverts for other zero addresses in constructor
         it("Should revert if fee collector address is zero", async function () {
            const TheKingdomsForgeFactory = await ethers.getContractFactory("TheKingdomsForge");
            await expect(TheKingdomsForgeFactory.deploy(owner.address, mockNxsToken.address, ZERO_ADDRESS, oracle.address, 1,1,1))
                .to.be.revertedWith("Fee collector cannot be zero");
        });
         it("Should revert if oracle address is zero", async function () {
            const TheKingdomsForgeFactory = await ethers.getContractFactory("TheKingdomsForge");
            await expect(TheKingdomsForgeFactory.deploy(owner.address, mockNxsToken.address, feeCollector.address, ZERO_ADDRESS, 1,1,1))
                .to.be.revertedWith("Oracle address cannot be zero");
        });
    });

    describe("requestForge", function () {
        let inputNftData: any[];
        const p1Id = 1;
        const p2Id = 2;

        beforeEach(async function () {
            await mockParentNft1.connect(owner).mint(user1.address, p1Id);
            await mockParentNft2.connect(owner).mint(user1.address, p2Id);
            await mockParentNft1.connect(user1).approve(forgeContract.address, p1Id);
            await mockParentNft2.connect(user1).approve(forgeContract.address, p2Id);

            inputNftData = [
                { contractAddress: mockParentNft1.address, tokenId: p1Id },
                { contractAddress: mockParentNft2.address, tokenId: p2Id },
            ];
        });

        it("Should successfully process a forge request and emit ForgeRequested event", async function () {
            const nxsToCommit = STANDARD_FEE;
            const prioritizedAttr = { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String("Color"), traitValue: "Blue" };
            const prioritizedProvided = true;

            const initialRequestId = await forgeContract.nextRequestId();

            await expect(forgeContract.connect(user1).requestForge(inputNftData, nxsToCommit, prioritizedAttr, prioritizedProvided))
                .to.emit(forgeContract, "ForgeRequested")
                .withArgs(
                    initialRequestId, // or use a matcher for BigNumber
                    user1.address,
                    // Need to deep match array of structs. Chai-ethers might need custom matchers for this.
                    // For now, check event emission and manually inspect args if needed.
                    (inputs) => inputs.length === 2 && inputs[0].contractAddress === mockParentNft1.address,
                    nxsToCommit,
                    (attr) => attr.traitType === prioritizedAttr.traitType,
                    prioritizedProvided
                );

            expect(await mockNxsToken.balanceOf(feeCollector.address)).to.equal(nxsToCommit);
            const request = await forgeContract.forgeRequests(initialRequestId);
            expect(request.user).to.equal(user1.address);
            expect(request.nxsCommitted).to.equal(nxsToCommit);
            expect(request.processed).to.be.false;
            expect(await forgeContract.nextRequestId()).to.equal(initialRequestId.add(1));
        });

        it("Should revert if RON is sent with the request (msg.value > 0)", async function () {
            const nxsToCommit = STANDARD_FEE;
            const prioritizedAttr = { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String("Color"), traitValue: "Blue" };
            await expect(forgeContract.connect(user1).requestForge(
                inputNftData, nxsToCommit, prioritizedAttr, true,
                { value: ethers.utils.parseEther("0.1") }
            )).to.be.revertedWith("Forge: Do not send RON; NXS is fee token");
        });

        it("Should revert if not exactly 2 input NFTs are provided", async function () {
            const singleInput = [{ contractAddress: mockParentNft1.address, tokenId: p1Id }];
            await expect(forgeContract.connect(user1).requestForge(singleInput, STANDARD_FEE, { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String(""), traitValue: "" }, false))
                .to.be.revertedWith("Forge: Exactly 2 input NFTs required");
        });

        it("Should revert if NXS committed is less than standardForgeNxsFee", async function () {
            const insufficientNxs = STANDARD_FEE.sub(1);
            await expect(forgeContract.connect(user1).requestForge(inputNftData, insufficientNxs, { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String(""), traitValue: "" }, false))
                .to.be.revertedWith("Forge: Insufficient NXS for standard forge");
        });

        it("Should revert if an input NFT contract address is zero", async function () {
            const badInputData = [
                { contractAddress: ZERO_ADDRESS, tokenId: p1Id },
                { contractAddress: mockParentNft2.address, tokenId: p2Id },
            ];
            await expect(forgeContract.connect(user1).requestForge(badInputData, STANDARD_FEE, { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String(""), traitValue: "" }, false))
                .to.be.revertedWith("Forge: Input NFT contract address cannot be zero");
        });

        it("Should revert if an input NFT has already been used (hasBeenForgedWith)", async function () {
            // First successful forge
            let tx = await forgeContract.connect(user1).requestForge(inputNftData, STANDARD_FEE, { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String(""), traitValue: "" }, false);
            let receipt = await tx.wait();
            let event = receipt.events.find((e:any) => e.event === "ForgeRequested");
            const requestId1 = event.args.requestId;

            await forgeContract.connect(oracle).secureMintForgedItem(
                requestId1, user1.address, "uri1", ethers.utils.formatBytes32String("hash1"), 1, false
            );
            // Attempt to use mockParentNft1 (p1Id) again
            const p3Id = 3;
            await mockParentNft2.connect(owner).mint(user1.address, p3Id); // New second parent
            await mockParentNft2.connect(user1).approve(forgeContract.address, p3Id);
            const reusedInputData = [
                { contractAddress: mockParentNft1.address, tokenId: p1Id }, // Reused
                { contractAddress: mockParentNft2.address, tokenId: p3Id },
            ];
            await expect(forgeContract.connect(user1).requestForge(reusedInputData, STANDARD_FEE, { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String(""), traitValue: "" }, false))
                .to.be.revertedWith("Forge: Input NFT already used");
        });

        it("Should revert if prioritizedAttribute.inputNftIndex is out of bounds", async function () {
            const prioritizedAttr = { inputNftIndex: 2, traitType: ethers.utils.formatBytes32String("Color"), traitValue: "Blue" }; // Invalid index
            await expect(forgeContract.connect(user1).requestForge(inputNftData, STANDARD_FEE, prioritizedAttr, true))
                .to.be.revertedWith("Forge: Invalid index for prioritized NFT");
        });
        
        it("Should revert if NXS transferFrom fails (e.g., insufficient allowance/balance)", async function () {
            await mockNxsToken.connect(user1).approve(forgeContract.address, STANDARD_FEE.sub(10)); // Not enough allowance
            await expect(forgeContract.connect(user1).requestForge(inputNftData, STANDARD_FEE, { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String(""), traitValue: "" }, false))
                .to.be.reverted; // ERC20: insufficient allowance
        });

        it("Should not allow requestForge when paused", async function() {
            await forgeContract.connect(owner).pauseForge();
            await expect(forgeContract.connect(user1).requestForge(inputNftData, STANDARD_FEE, { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String(""), traitValue: "" }, false))
                .to.be.revertedWith("Pausable: paused");
        });
    });

    describe("secureMintForgedItem", function () {
        let requestId: any;
        const recipientForMint = user1.address;
        const tokenURI = "ipfs://newNFT";
        const lineageHash = ethers.utils.formatBytes32String("lineageData");
        const tier = 1; // Example tier
        const isGrandparent = false;
        let p1Data: any, p2Data: any;

        beforeEach(async function () {
            const p1Id = 1;
            const p2Id = 2;
            await mockParentNft1.connect(owner).mint(user1.address, p1Id);
            await mockParentNft2.connect(owner).mint(user1.address, p2Id);
            await mockParentNft1.connect(user1).approve(forgeContract.address, p1Id);
            await mockParentNft2.connect(user1).approve(forgeContract.address, p2Id);
            
            p1Data = { contractAddress: mockParentNft1.address, tokenId: p1Id };
            p2Data = { contractAddress: mockParentNft2.address, tokenId: p2Id };

            const inputNftData = [p1Data, p2Data];
            const tx = await forgeContract.connect(user1).requestForge(inputNftData, STANDARD_FEE, { inputNftIndex: 0, traitType: ethers.utils.formatBytes32String(""), traitValue: "" }, false);
            const receipt = await tx.wait();
            const event = receipt.events.find((e:any) => e.event === "ForgeRequested");
            requestId = event.args.requestId;
        });

        it("Should allow oracle to mint KKNFT, update request, mark inputs, and emit events", async function () {
            const initialKkNftTotalSupply = await mockKkNftContract.nextTokenIdToMint(); // Mock specific

            await expect(forgeContract.connect(oracle).secureMintForgedItem(requestId, recipientForMint, tokenURI, lineageHash, tier, isGrandparent))
                .to.emit(forgeContract, "ItemForgedByOracle")
                // .withArgs(requestId, initialKkNftTotalSupply, recipientForMint, tokenURI, lineageHash, tier, isGrandparent) // nextTokenIdToMint is 1-based for mock
                .and.to.emit(forgeContract, "InputNftCommitted")
                .withArgs(requestId, p1Data.contractAddress, p1Data.tokenId)
                .and.to.emit(forgeContract, "InputNftCommitted")
                .withArgs(requestId, p2Data.contractAddress, p2Data.tokenId);

            const request = await forgeContract.forgeRequests(requestId);
            expect(request.processed).to.be.true;
            expect(request.forgedKkNftId).to.equal(initialKkNftTotalSupply); // Mock specific
            
            expect(await forgeContract.hasBeenForgedWith(p1Data.contractAddress, p1Data.tokenId)).to.be.true;
            expect(await forgeContract.hasBeenForgedWith(p2Data.contractAddress, p2Data.tokenId)).to.be.true;

            expect(await mockKkNftContract.ownerOf(initialKkNftTotalSupply)).to.equal(recipientForMint);
            expect(await mockKkNftContract.tokenURI(initialKkNftTotalSupply)).to.equal(tokenURI);
        });

        it("Should revert if caller is not the oracle", async function () {
            await expect(forgeContract.connect(otherAddress).secureMintForgedItem(requestId, recipientForMint, tokenURI, lineageHash, tier, isGrandparent))
                .to.be.revertedWith("Forge: Caller is not the oracle");
        });

        it("Should revert for an invalid request ID", async function () {
            const invalidRequestId = 9999;
            await expect(forgeContract.connect(oracle).secureMintForgedItem(invalidRequestId, recipientForMint, tokenURI, lineageHash, tier, isGrandparent))
                .to.be.revertedWith("Forge: Invalid request ID");
        });

        it("Should revert if recipient mismatches request user", async function () {
            await expect(forgeContract.connect(oracle).secureMintForgedItem(requestId, otherAddress.address, tokenURI, lineageHash, tier, isGrandparent))
                .to.be.revertedWith("Forge: Recipient mismatch");
        });
        
        it("Should revert if request already processed", async function () {
            await forgeContract.connect(oracle).secureMintForgedItem(requestId, recipientForMint, tokenURI, lineageHash, tier, isGrandparent); // Process once
            await expect(forgeContract.connect(oracle).secureMintForgedItem(requestId, recipientForMint, "newURI", lineageHash, tier, isGrandparent)) // Process again
                .to.be.revertedWith("Forge: Request already processed");
        });

        it("Should revert if KKNFT contract address is not set", async function () {
            await forgeContract.connect(owner).setKkNftContractAddress(ZERO_ADDRESS); // Unset it
            await expect(forgeContract.connect(oracle).secureMintForgedItem(requestId, recipientForMint, tokenURI, lineageHash, tier, isGrandparent))
                .to.be.revertedWith("Forge: KKNFT contract not set");
        });
        
        it("Should not allow secureMintForgedItem when paused", async function() {
            await forgeContract.connect(owner).pauseForge();
            await expect(forgeContract.connect(oracle).secureMintForgedItem(requestId, recipientForMint, tokenURI, lineageHash, tier, isGrandparent))
                .to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Admin Setter Functions", function () {
        it("setKkNftContractAddress: owner can set, non-owner cannot", async function () {
            await expect(forgeContract.connect(owner).setKkNftContractAddress(otherAddress.address)).to.not.be.reverted;
            expect(await forgeContract.kkNftContract()).to.equal(otherAddress.address);
            await expect(forgeContract.connect(user1).setKkNftContractAddress(otherAddress.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
            await expect(forgeContract.connect(owner).setKkNftContractAddress(ZERO_ADDRESS))
                .to.be.revertedWith("Forge: KKNFT address cannot be zero");
        });

        // Add similar tests for:
        // setNxsTokenAddress
        // setOracleAddress
        // setFeeCollectorAddress
        // setNxsFeeTiers
        // Ensure they check for owner and zero address where appropriate.
        it("setNxsFeeTiers: owner can set fees", async function() {
            const newStandard = ethers.utils.parseUnits("50", 18);
            const newEnhanced = ethers.utils.parseUnits("150", 18);
            const newPrime = ethers.utils.parseUnits("250", 18);
            await forgeContract.connect(owner).setNxsFeeTiers(newStandard, newEnhanced, newPrime);
            expect(await forgeContract.standardForgeNxsFee()).to.equal(newStandard);
            // ... check other tiers
        });
    });

    describe("Pausable Functionality", function () {
        it("pauseForge: should pause contract operations", async function () {
            await forgeContract.connect(owner).pauseForge();
            expect(await forgeContract.paused()).to.be.true;
        });

        it("unpauseForge: should unpause contract operations", async function () {
            await forgeContract.connect(owner).pauseForge();
            await forgeContract.connect(owner).unpauseForge();
            expect(await forgeContract.paused()).to.be.false;
        });

        it("pauseForge: non-owner cannot pause", async function () {
            await expect(forgeContract.connect(user1).pauseForge()).to.be.revertedWith("Ownable: caller is not the owner");
        });
         it("unpauseForge: non-owner cannot unpause", async function () {
            await forgeContract.connect(owner).pauseForge();
            await expect(forgeContract.connect(user1).unpauseForge()).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Withdraw Functions", function () {
        const amountToWithdraw = ethers.utils.parseUnits("10", 18);

        it("withdrawStuckTokens: owner can withdraw other ERC20 tokens", async function () {
            const MockOtherTokenFactory = await ethers.getContractFactory("MockERC20");
            const otherToken = await MockOtherTokenFactory.deploy("Other Token", "OTK", amountToWithdraw);
            await otherToken.transfer(forgeContract.address, amountToWithdraw); // Send tokens to forge contract

            await expect(forgeContract.connect(owner).withdrawStuckTokens(otherToken.address, owner.address, amountToWithdraw))
                .to.changeTokenBalances(otherToken, [forgeContract, owner], [amountToWithdraw.mul(-1), amountToWithdraw]);
        });

        it("withdrawStuckTokens: should revert if non-owner tries", async function () {
             const MockOtherTokenFactory = await ethers.getContractFactory("MockERC20");
             const otherToken = await MockOtherTokenFactory.deploy("Other Token", "OTK", amountToWithdraw);
             await otherToken.transfer(forgeContract.address, amountToWithdraw);
            await expect(forgeContract.connect(user1).withdrawStuckTokens(otherToken.address, user1.address, amountToWithdraw))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("withdrawStuckTokens: should revert when trying to withdraw NXS token", async function () {
            // NXS is already in feeCollector, but for testing the require:
            await mockNxsToken.connect(owner).mint(forgeContract.address, amountToWithdraw); // Manually send some NXS
            await expect(forgeContract.connect(owner).withdrawStuckTokens(mockNxsToken.address, owner.address, amountToWithdraw))
                .to.be.revertedWith("Forge: Use fee distribution for NXS");
        });

        it("withdrawStuckRonin: owner can withdraw RON", async function () {
            const ronAmount = ethers.utils.parseEther("1.0");
            // Send RON to contract
            await owner.sendTransaction({ to: forgeContract.address, value: ronAmount });
            
            const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
            const tx = await forgeContract.connect(owner).withdrawStuckRonin(owner.address, ronAmount);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(tx.gasPrice);
            
            expect(await ethers.provider.getBalance(forgeContract.address)).to.equal(0);
            expect(await ethers.provider.getBalance(owner.address)).to.equal(initialOwnerBalance.add(ronAmount).sub(gasUsed));
        });

        it("withdrawStuckRonin: should revert if non-owner tries", async function () {
             const ronAmount = ethers.utils.parseEther("1.0");
             await owner.sendTransaction({ to: forgeContract.address, value: ronAmount });
            await expect(forgeContract.connect(user1).withdrawStuckRonin(user1.address, ronAmount))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("withdrawStuckRonin: should revert if insufficient contract RON balance", async function () {
            await expect(forgeContract.connect(owner).withdrawStuckRonin(owner.address, ethers.utils.parseEther("1.0")))
                .to.be.revertedWith("Forge: Insufficient Ronin balance");
        });
    });
});
