const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function getLastProcessedBlock(eventName) {
    const filePath = path.join(__dirname, `${eventName}_lastBlock.json`);

    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '0');
            return 0;
        }
        
        const data = fs.readFileSync(filePath, 'utf-8');
        return Number(data);
    } catch (error) {
        console.error(`Failed to get last processed block for event ${eventName}:`, error);
        return 0;
    }
}

async function saveLastProcessedBlock(eventName, blockNumber) {
    try {
        fs.writeFileSync(path.join(__dirname, `${eventName}_lastBlock.json`), String(blockNumber));
    } catch (error) {
        console.error(`Failed to save last processed block for event ${eventName}:`, error);
    }
}

let reconnecting = false;

async function setupEventListener(eventName, processEventFunc, contractAddress, contractABI) {
    const provider = hre.ethers.provider;
    const contract = new hre.ethers.Contract(contractAddress, contractABI, provider);

    let lastProcessedBlock = await getLastProcessedBlock(eventName);

    provider.on('block', async (blockNumber) => {
        if (blockNumber <= lastProcessedBlock) return;

        const events = await contract.queryFilter(eventName, lastProcessedBlock + 1, blockNumber);

        for (let event of events) {
            await processEventFunc(event);
        }

        lastProcessedBlock = blockNumber;
        await saveLastProcessedBlock(eventName, lastProcessedBlock);
    });

    provider.on('error', async (error) => {
        console.log('Connection error:', error.message, '. Trying to reconnect...');
        if (!reconnecting) {
            console.log('Trying to reconnect...');
            await handleConnectionError(eventName, processEventFunc, contractAddress, contractABI);
        }
    });  
}

async function handleConnectionError(eventName, processEventFunc, contractAddress, contractABI) {
    const provider = hre.ethers.provider;
    const waitTime = 10 * 1000; // 10 seconds
    console.log(`Waiting for ${waitTime / 1000} seconds before retrying...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    console.log(`Attempting to reconnect...`);
    reconnecting = true;
    provider.removeAllListeners();
    await setupEventListener(eventName, processEventFunc, contractAddress, contractABI);
    reconnecting = false;
}

module.exports = setupEventListener;
