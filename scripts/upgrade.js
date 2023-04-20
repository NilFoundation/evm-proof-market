const { ethers, upgrades } = require('hardhat');
const fs = require('fs');

async function main() {
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const contractAddress = addresses.proofMarket;

    console.log('Upgrading ProofMarket contract...');
    const ProofMarket = await ethers.getContractFactory('ProofMarketEndpoint');
    await upgrades.upgradeProxy(contractAddress, ProofMarket);
    console.log('ProofMarket contract upgraded successfully');
}


main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
