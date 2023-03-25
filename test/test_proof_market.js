
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Proof Market contract", function () {
    it("Deployment should do something", async function () {
        const [owner] = await ethers.getSigners();
        
        const proof_market = await ethers.getContractFactory("ProofMarketEndpoint");
        
        // USDT token address
        const tokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
        const hardhatPM = await proof_market.deploy(tokenAddress);

        // Test that the contract is deployed
        expect(await hardhatPM.deployed()).to.equal(hardhatPM);

        console.log("ProofMarket deployed to:", hardhatPM.address);
    });
});