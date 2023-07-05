const hre = require('hardhat');
const fs = require('fs');
const setupEventListener = require('./eventListener');
const { processOrderCreatedEvent, processOrderClosedEvent }  = require('./processEvent');

async function main() {
    const contractArtifact = await hre.artifacts.readArtifact('ProofMarketEndpoint');
    const contractABI = contractArtifact.abi;
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const contractAddress = addresses.proofMarket;

    // Listen for OrderCreated events
    setupEventListener('OrderCreated', processOrderCreatedEvent, contractAddress, contractABI)
        .then(() => console.log('Listening for events...'))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
    
    // Listen for OrderClosed events
    setupEventListener('OrderClosed', processOrderClosedEvent, contractAddress, contractABI)
    .then(() => console.log('Listening for OrderClosed events...'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

}

main();
