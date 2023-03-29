
const { ethers } = require("hardhat");

async function deployProofMarketFixture() {
    const ProofMarket = await ethers.getContractFactory("ProofMarketEndpoint");
	const ERC20 = await ethers.getContractFactory("MockTocken");

    let [owner, user, producer, relayer] = await ethers.getSigners();

	const token = await ERC20.deploy();
	await token.deployed();

    const proofMarket = await ProofMarket.deploy(token.address);
    await proofMarket.deployed();

	const initialBalance = ethers.utils.parseUnits("1000", 18);
	// await token.transfer(user.address, initialBalance);
	await token.mint(user.address, initialBalance);
	// Approve the contract to spend the user's tokens
	await token.connect(user).approve(proofMarket.address, initialBalance);

    return { proofMarket, token, owner, user, producer, relayer };
}

module.exports = {
	deployProofMarketFixture
};
