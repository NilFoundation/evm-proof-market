const hre = require('hardhat');
const fs = require('fs');
const setupEventListener = require('./eventListener');
const { processOrderCreatedEvent, processOrderClosedEvent }  = require('./processEvent');

async function main() {
    const contractArtifact = await hre.artifacts.readArtifact('ProofMarketEndpoint');
    if (!contractArtifact || !contractArtifact.abi) {
        console.error('Failed to load contract artifact or ABI is missing');
        process.exit(1);
    }

    const contractABI = contractArtifact.abi;
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const contractAddress = addresses.proofMarket;

    const eventProcessingDescriptors = [
        {eventName: 'OrderCreated', processEventFunc: processOrderCreatedEvent},
        {eventName: 'OrderClosed', processEventFunc: processOrderClosedEvent},
    ];

    await setupEventListener(eventProcessingDescriptors, contractAddress, contractABI)
        .then(() => console.log('Listening for events...'))
        .catch((error) => { 
            console.error("Error setting up listeners:", error);
    });
}

main();
