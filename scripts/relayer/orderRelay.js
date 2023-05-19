const hre = require('hardhat');
const fs = require('fs');
const setupEventListener = require('./eventListener');
const processOrderCreatedEvent = require('./processEvent');

async function main() {
    const contractArtifact = await hre.artifacts.readArtifact('ProofMarketEndpoint');
    const contractABI = contractArtifact.abi;
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const contractAddress = addresses.proofMarket;

    setupEventListener('OrderCreated', processOrderCreatedEvent, contractAddress, contractABI)
        .then(() => console.log('Listening for events...'))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

main();
