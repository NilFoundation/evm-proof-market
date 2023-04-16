const hre = require('hardhat');
const fs = require('fs');

async function main() {
    const contractArtifact = await hre.artifacts.readArtifact('ProofMarketEndpoint');
    const contractABI = contractArtifact.abi;
    // Address of the deployed smart contract
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const tokenAddress = addresses.token;
    const contractAddress = addresses.proofMarket;

    // Get a provider instance
    const provider = hre.ethers.provider;

    // Create a contract instance
    const contract = new hre.ethers.Contract(contractAddress, contractABI, provider);

    // Listen for an event
    contract.on('OrderCreated', (id, orderInput, buyer, event) => {
        console.log('Event:', event);
        console.log('Parameters:', id, orderInput, buyer);
    });
}

main()
.then(() => console.log('Listening for events...'))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
