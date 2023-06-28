
const { ethers, upgrades } = require("hardhat");
const { deployments } = hre;

async function deployProofMarketFixture() {
    const ProofMarket = await ethers.getContractFactory("ProofMarketEndpoint");
	const ERC20 = await ethers.getContractFactory("MockTocken");

    let [owner, user, producer, relayer] = await ethers.getSigners();

	// Deploy the token contract
	const token = await ERC20.deploy();
	await token.deployed();
	// Deploy the proof market contract
	const proofMarket = await upgrades.deployProxy(ProofMarket, [token.address]);
    await proofMarket.deployed();
	// Set the relayer role
	await proofMarket.grantRole(proofMarket.RELAYER_ROLE(), relayer.address);
	// Mint some tokens to the user
	const initialBalance = ethers.utils.parseUnits("1000", 18);
	await token.mint(user.address, initialBalance);
	// Approve the contract to spend the user's tokens
	await token.connect(user).approve(proofMarket.address, initialBalance);

    return { proofMarket, token, owner, user, producer, relayer };
}

module.exports = {
	deployProofMarketFixture
};
