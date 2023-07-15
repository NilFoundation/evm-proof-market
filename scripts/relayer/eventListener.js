const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const blockNumberFilePath = path.join(__dirname, 'lastProcessedBlock.json');

async function getLastProcessedBlock() {
    try {
        if (!fs.existsSync(blockNumberFilePath)) {
            fs.writeFileSync(blockNumberFilePath, '0');
            return 0;
        }
        const data = fs.readFileSync(blockNumberFilePath, 'utf-8');
        return Number(data);
    } catch (error) {
        console.error('Failed to get last processed block:', error);
        return 0;
    }
}

async function saveLastProcessedBlock(blockNumber) {
    try {
        fs.writeFileSync(blockNumberFilePath, String(blockNumber));
    } catch (error) {
        console.error('Failed to save last processed block:', error);
    }
}

async function setupEventListener(eventProcessingDescriptors, contractAddress, contractABI) {
    const provider = hre.ethers.provider;
    const contract = new hre.ethers.Contract(contractAddress, contractABI, provider);

    let lastProcessedBlock = await getLastProcessedBlock();

    const network = await provider.getNetwork();
    console.log(`Connected to ${network.name} network`);

    provider.on('block', async (blockNumber) => {
        if (blockNumber <= lastProcessedBlock) return;

        for (let descriptor of eventProcessingDescriptors) {
            const events = await contract.queryFilter(descriptor.eventName, lastProcessedBlock + 1, blockNumber);

            for (let event of events) {
                await descriptor.processEventFunc(event);
            }
        }

        lastProcessedBlock = blockNumber;
        await saveLastProcessedBlock(lastProcessedBlock);
    });

    provider.on('error', async (error) => {
        console.log('Connection error:', error.message, '. Trying to reconnect...');
        await handleConnectionError(eventProcessingDescriptors, contractAddress, contractABI);
    });

    console.log('Total listeners:', provider.listenerCount('block'));
}

async function handleConnectionError(eventProcessDescriptors, contractAddress, contractABI) {
    const provider = hre.ethers.provider;
    const waitTime = 10 * 1000; // 10 seconds
    console.log(`Waiting for ${waitTime / 1000} seconds before retrying...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    console.log('Removing all listeners...');
    provider.removeAllListeners();
    
    console.log('Attempting to reconnect...');
    await setupEventListener(eventProcessDescriptors, contractAddress, contractABI);
}


module.exports = setupEventListener;
