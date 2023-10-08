const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
    const ProofMarket = await ethers.getContractFactory("ProofMarketEndpoint");
    const ERC20 = await ethers.getContractFactory("MockToken");

    let [deployer, relayer] = await ethers.getSigners();

    // Log the deployer address
    console.log('Deploying contracts with the account:', deployer.address);
    // Deploy the token contract
    const token = await ERC20.connect(deployer).deploy();
    await token.deployed();
    console.log('MockToken deployed to:', token.address);
    // Deploy the proof market contract
    const proofMarket = await upgrades.deployProxy(ProofMarket.connect(deployer), [token.address]);
    await proofMarket.deployed();
    console.log('ProofMarketEndpoint deployed to:', proofMarket.address);
    // Set the relayer role
    await proofMarket.grantRole(proofMarket.RELAYER_ROLE(), relayer.address);
    console.log('Relayer role granted to:', relayer.address);
    const addresses = {
        token: token.address,
        proofMarket: proofMarket.address,
        relayer: relayer.address,
    };

    fs.writeFileSync('deployed_addresses.json', JSON.stringify(addresses, null, 2));
}
    
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
