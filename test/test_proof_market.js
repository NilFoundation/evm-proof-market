
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Proof Market contract", function () {
  it("Deployment should do something", async function () {
    const [owner] = await ethers.getSigners();

    const proof_market = await ethers.getContractFactory("ProofMarketEndpoint");

    const hardhatPM = await proof_market.deploy();

    // Test that the contract is deployed
    expect(await hardhatPM.deployed()).to.equal(hardhatPM);
  });
});