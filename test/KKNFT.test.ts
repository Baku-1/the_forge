import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// Assuming TypeChain generates types, import your contract type
// For example: import { KKNFT } from "../typechain-types";

describe("KKNFT Contract", function () {
    // Type placeholder for your contract - replace with actual TypeChain type if available
    let kknftContract: any; // KKNFT;

    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let authorizedForgeSigner: SignerWithAddress; // Will act as the authorized KingdomsForgeContract
    let otherAddress: SignerWithAddress;

    const NFT_NAME = "Kingdom Koders Forged NFT";
    const NFT_SYMBOL = "KKF";
    const ZERO_ADDRESS = ethers.constants.AddressZero;

    beforeEach(async function () {
        [owner, user1, authorizedForgeSigner, otherAddress] = await ethers.getSigners();

        const KKNFTFactory = await ethers.getContractFactory("KKNFT");
        kknftContract = await KKNFTFactory.connect(owner).deploy(owner.address, NFT_NAME, NFT_SYMBOL);
        // await kknftContract.deployed(); // For older Hardhat versions
    });

    describe("Deployment and Initialization", function () {
        it("Should set the correct owner", async function () {
            expect(await kknftContract.owner()).to.equal(owner.address);
        });

        it("Should have the correct name and symbol", async function () {
            expect(await kknftContract.name()).to.equal(NFT_NAME);
            expect(await kknftContract.symbol()).to.equal(NFT_SYMBOL);
        });

        it("Should initialize kingdomsForgeContract to address(0)", async function () {
            expect(await kknftContract.kingdomsForgeContract()).to.equal(ZERO_ADDRESS);
        });

        it("Should initialize _nextTokenId to 0 (or 1 depending on your logic start)", async function () {
            // Since _nextTokenId is private, we test its effect via minting the first token
            // This test is better placed in the minting section to see if first token is ID 0 or 1
        });
    });

    describe("Ownable Standard Functions", function () {
        it("Owner should be able to transfer ownership", async function () {
            await kknftContract.connect(owner).transferOwnership(user1.address);
            expect(await kknftContract.owner()).to.equal(user1.address);
        });

        it("Non-owner should not be able to transfer ownership", async function () {
            await expect(kknftContract.connect(user1).transferOwnership(otherAddress.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should emit OwnershipTransferred event on ownership transfer", async function () {
            await expect(kknftContract.connect(owner).transferOwnership(user1.address))
                .to.emit(kknftContract, "OwnershipTransferred")
                .withArgs(owner.address, user1.address);
        });
    });

    describe("setKingdomsForgeContract", function () {
        it("Owner should be able to set the KingdomsForge contract address", async function () {
            await kknftContract.connect(owner).setKingdomsForgeContract(authorizedForgeSigner.address);
            expect(await kknftContract.kingdomsForgeContract()).to.equal(authorizedForgeSigner.address);
        });

        it("Should emit an event when KingdomsForge contract address is set (if you add one)", async function () {
            // If you add an event for this function, test its emission here
            // await expect(kknftContract.connect(owner).setKingdomsForgeContract(authorizedForgeSigner.address))
            //     .to.emit(kknftContract, "KingdomsForgeContractSet")
            //     .withArgs(authorizedForgeSigner.address);
        });

        it("Non-owner should not be able to set the KingdomsForge contract address", async function () {
            await expect(kknftContract.connect(user1).setKingdomsForgeContract(authorizedForgeSigner.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert if setting KingdomsForge contract address to the zero address", async function () {
            await expect(kknftContract.connect(owner).setKingdomsForgeContract(ZERO_ADDRESS))
                .to.be.revertedWith("KKNFT: Forge address cannot be zero");
        });
    });

    describe("mintForgedItem", function () {
        const recipient = user1.address;
        const tokenURI = "ipfs://QmMetadataHash123";
        const lineageHash = ethers.utils.formatBytes32String("lineageExample123");
        const isGrandparent = true;

        beforeEach(async function () {
            // Authorize the `authorizedForgeSigner` to mint
            await kknftContract.connect(owner).setKingdomsForgeContract(authorizedForgeSigner.address);
        });

        it("Should allow authorized KingdomsForge contract to mint a new KKNFT", async function () {
            const expectedTokenId = ethers.BigNumber.from(0); // Assuming _nextTokenId starts at 0

            await expect(kknftContract.connect(authorizedForgeSigner)
                .mintForgedItem(recipient, tokenURI, lineageHash, isGrandparent))
                .to.emit(kknftContract, "Transfer")
                .withArgs(ZERO_ADDRESS, recipient, expectedTokenId)
                .and.to.emit(kknftContract, "ItemForgedWithLineage")
                .withArgs(expectedTokenId, recipient, tokenURI, lineageHash, isGrandparent);

            expect(await kknftContract.ownerOf(expectedTokenId)).to.equal(recipient);
            expect(await kknftContract.tokenURI(expectedTokenId)).to.equal(tokenURI);
            expect(await kknftContract.tokenLineageHash(expectedTokenId)).to.equal(lineageHash);
            expect(await kknftContract.isFromFullKkGrandparentage(expectedTokenId)).to.equal(isGrandparent);
            // _nextTokenId should be 1 now
        });

        it("Should increment _nextTokenId for sequential mints", async function () {
            const tokenId0 = await kknftContract.connect(authorizedForgeSigner).callStatic.mintForgedItem(recipient, tokenURI, lineageHash, isGrandparent);
            await kknftContract.connect(authorizedForgeSigner).mintForgedItem(recipient, tokenURI, lineageHash, isGrandparent);
            expect(tokenId0).to.equal(0);

            const tokenURI2 = "ipfs://QmMetadataHash456";
            const lineageHash2 = ethers.utils.formatBytes32String("lineageExample456");
            const isGrandparent2 = false;
            const tokenId1 = await kknftContract.connect(authorizedForgeSigner).callStatic.mintForgedItem(otherAddress.address, tokenURI2, lineageHash2, isGrandparent2);
            await kknftContract.connect(authorizedForgeSigner).mintForgedItem(otherAddress.address, tokenURI2, lineageHash2, isGrandparent2);
            expect(tokenId1).to.equal(1);

            expect(await kknftContract.ownerOf(0)).to.equal(recipient);
            expect(await kknftContract.ownerOf(1)).to.equal(otherAddress.address);
        });

        it("Should FAIL if minting is attempted by a non-authorized address (not the KingdomsForge contract)", async function () {
            await expect(kknftContract.connect(otherAddress) // Attempting from 'otherAddress'
                .mintForgedItem(recipient, tokenURI, lineageHash, isGrandparent))
                .to.be.revertedWith("KKNFT: Caller is The Kingdom's Forge contract");
        });

        it("Should FAIL if minting is attempted by the KKNFT owner (if owner is not the authorized Forge contract)", async function () {
            // This assumes owner is not the same as authorizedForgeSigner for this test case.
            // If owner *could* be the forge contract, this test needs adjustment or conditional skip.
            if (owner.address.toLowerCase() !== authorizedForgeSigner.address.toLowerCase()){
                 await expect(kknftContract.connect(owner)
                    .mintForgedItem(recipient, tokenURI, lineageHash, isGrandparent))
                    .to.be.revertedWith("KKNFT: Caller is The Kingdom's Forge contract");
            }
        });


        it("Should FAIL if minting to the zero address", async function () {
            await expect(kknftContract.connect(authorizedForgeSigner)
                .mintForgedItem(ZERO_ADDRESS, tokenURI, lineageHash, isGrandparent))
                .to.be.revertedWith("KKNFT: Mint to the zero address");
        });

        it("Should correctly assign and retrieve lineage hash and grandparentage flag", async function () {
            const tokenId = await kknftContract.connect(authorizedForgeSigner).callStatic.mintForgedItem(recipient, tokenURI, lineageHash, isGrandparent);
            await kknftContract.connect(authorizedForgeSigner).mintForgedItem(recipient, tokenURI, lineageHash, isGrandparent);

            expect(await kknftContract.tokenLineageHash(tokenId)).to.equal(lineageHash);
            expect(await kknftContract.isFromFullKkGrandparentage(tokenId)).to.equal(isGrandparent);

            const anotherLineageHash = ethers.utils.formatBytes32String("anotherHash");
            const anotherTokenId = await kknftContract.connect(authorizedForgeSigner).callStatic.mintForgedItem(recipient, "uri2", anotherLineageHash, false);
            await kknftContract.connect(authorizedForgeSigner).mintForgedItem(recipient, "uri2", anotherLineageHash, false);

            expect(await kknftContract.tokenLineageHash(anotherTokenId)).to.equal(anotherLineageHash);
            expect(await kknftContract.isFromFullKkGrandparentage(anotherTokenId)).to.be.false;
        });
    });

    describe("ERC721 and ERC721URIStorage Standard Functionality", function () {
        let tokenId0: any; // BigNumber
        const tokenURI0 = "ipfs://firstNFT";
        const lineageHash0 = ethers.utils.formatBytes32String("firstLineage");

        beforeEach(async function() {
            await kknftContract.connect(owner).setKingdomsForgeContract(authorizedForgeSigner.address);
            // Mint a token to owner for testing transfer/approval
            tokenId0 = await kknftContract.connect(authorizedForgeSigner).callStatic.mintForgedItem(owner.address, tokenURI0, lineageHash0, false);
            await kknftContract.connect(authorizedForgeSigner).mintForgedItem(owner.address, tokenURI0, lineageHash0, false);
        });

        it("tokenURI should return correct URI for an owned token", async function () {
            expect(await kknftContract.tokenURI(tokenId0)).to.equal(tokenURI0);
        });

        it("tokenURI should revert for a non-existent token", async function () {
            await expect(kknftContract.tokenURI(ethers.BigNumber.from(999)))
                .to.be.revertedWith("ERC721: invalid token ID"); // ERC721URIStorage might use "ERC721URIStorage: URI query for nonexistent token"
        });

        it("Owner should be able to transfer their token", async function () {
            await expect(kknftContract.connect(owner).transferFrom(owner.address, user1.address, tokenId0))
                .to.emit(kknftContract, "Transfer")
                .withArgs(owner.address, user1.address, tokenId0);
            expect(await kknftContract.ownerOf(tokenId0)).to.equal(user1.address);
        });

        it("Approved address should be able to transfer token", async function () {
            await kknftContract.connect(owner).approve(user1.address, tokenId0);
            await expect(kknftContract.connect(user1).transferFrom(owner.address, otherAddress.address, tokenId0))
                .to.emit(kknftContract, "Transfer")
                .withArgs(owner.address, otherAddress.address, tokenId0);
            expect(await kknftContract.ownerOf(tokenId0)).to.equal(otherAddress.address);
        });

        it("Operator (approved for all) should be able to transfer token", async function () {
            await kknftContract.connect(owner).setApprovalForAll(user1.address, true);
            await expect(kknftContract.connect(user1).transferFrom(owner.address, otherAddress.address, tokenId0))
                .to.emit(kknftContract, "Transfer")
                .withArgs(owner.address, otherAddress.address, tokenId0);
            expect(await kknftContract.ownerOf(tokenId0)).to.equal(otherAddress.address);
        });

        it("Should FAIL if non-owner/non-approved tries to transfer", async function () {
            await expect(kknftContract.connect(user1).transferFrom(owner.address, otherAddress.address, tokenId0))
                .to.be.revertedWith("ERC721: caller is not token owner or approved");
        });

        it("supportsInterface should return true for ERC721, ERC721URIStorage, and ERC165", async function () {
            expect(await kknftContract.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
            expect(await kknftContract.supportsInterface("0x5b5e139f")).to.be.true; // ERC721Metadata (which ERC721URIStorage implies)
            expect(await kknftContract.supportsInterface("0x49064906")).to.be.true; // ERC721URIStorage
            expect(await kknftContract.supportsInterface("0x01ffc9a7")).to.be.true; // ERC165
        });
    });

     describe("Private _nextTokenId behavior", function () {
        it("Should correctly increment token IDs starting from 0", async function () {
            await kknftContract.connect(owner).setKingdomsForgeContract(authorizedForgeSigner.address);

            let mintedTokenId;
            // Mint first token
            mintedTokenId = await kknftContract.connect(authorizedForgeSigner).callStatic.mintForgedItem(user1.address, "uri1", ethers.utils.formatBytes32String("L1"), false);
            await kknftContract.connect(authorizedForgeSigner).mintForgedItem(user1.address, "uri1", ethers.utils.formatBytes32String("L1"), false);
            expect(mintedTokenId).to.equal(0);

            // Mint second token
            mintedTokenId = await kknftContract.connect(authorizedForgeSigner).callStatic.mintForgedItem(user2.address, "uri2", ethers.utils.formatBytes32String("L2"), true);
            await kknftContract.connect(authorizedForgeSigner).mintForgedItem(user2.address, "uri2", ethers.utils.formatBytes32String("L2"), true);
            expect(mintedTokenId).to.equal(1);

            // Mint third token
            mintedTokenId = await kknftContract.connect(authorizedForgeSigner).callStatic.mintForgedItem(user1.address, "uri3", ethers.utils.formatBytes32String("L3"), false);
            await kknftContract.connect(authorizedForgeSigner).mintForgedItem(user1.address, "uri3", ethers.utils.formatBytes32String("L3"), false);
            expect(mintedTokenId).to.equal(2);

            expect(await kknftContract.totalSupply()).to.equal(3);
        });
    });
});
