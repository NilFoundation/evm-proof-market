const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

let credentials, constants;

function readJSONFile(filePath) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, filePath), 'utf-8'));
}

async function getAuthenticated(url) {
    return await axios.get(url, {
        auth: {
            username: credentials.username,
            password: credentials.password
        }
    });
}

async function getLastProcessedTimestamp(status) {
    const filePath = path.join(__dirname, `${status}_lastTimestamp.json`);

    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '0');
            return 0;
        }
        
        const data = fs.readFileSync(filePath, 'utf-8');
        return Number(data);
    } catch (error) {
        console.error(`Failed to get last processed timestamp for status ${status}:`, error);
        return 0;
    }
}

async function saveLastProcessedTimestamp(status, timestamp) {
    try {
        fs.writeFileSync(path.join(__dirname, `${status}_lastTimestamp.json`), String(timestamp));
    } catch (error) {
        console.error(`Failed to save last processed timestamp for status ${status}:`, error);
    }
}

async function processOrder(contract, relayer, order) {
    try {
        const id = parseInt(order.eth_id);
        const proof_key = order.proof_key;

        if (isNaN(id)) {
            throw new Error(`Invalid order ID: ${order.eth_id}`);
        }

        let response = await getAuthenticated(`${constants.serviceUrl}/proof/${proof_key}`);
        const bytes = ethers.utils.toUtf8Bytes(response.data.proof);
        const proof = ethers.utils.hexlify(bytes);
        const producerName = response.data.sender;
        const price = ethers.utils.parseUnits(order.cost.toString(), 18);

        response = await getAuthenticated(`${constants.serviceUrl}/producer/${producerName}`);
        const producerAddress = response.data.eth_address;

        return contract.connect(relayer).closeOrder(id, proof, price, producerAddress);
    } catch (error) {
        console.error(`Error processing order ${order.eth_id}:`, error);
    }
}

async function relayProofs(contract, relayer) {
    try {
        const lastTimestamp = await getLastProcessedTimestamp('completed');

        const pattern = [
            {"key":"sender", "value":credentials.username},
            {"key":"status", "value":"completed"},
            {"key":"timestamp", "value":lastTimestamp, "op":">"}
        ];
        const url = `${constants.serviceUrl}/request?q=${JSON.stringify(pattern)}`;
        const response = await getAuthenticated(url);
        const orders = response.data;
        console.log(`Relaying ${orders.length} proofs...`)
        console.log(orders);
        const closeOrderPromises = orders.map(order => processOrder(contract, relayer, order));
        const results = await Promise.all(closeOrderPromises);
        results.forEach(result => console.log(result));

        const maxTimestamp = Math.max(...orders.map(order => order.updatedOn));
        await saveLastProcessedTimestamp('completed', maxTimestamp);
    } catch (error) {
        console.error("Failed to relay proofs:", error);
    }
}

async function relayStatuses(contract, relayer) {
    try {
        const lastTimestamp = await getLastProcessedTimestamp('processing');

        const pattern = [
            {"key":"sender", "value":credentials.username},
            {"key":"status", "value":"processing"},
            {"key":"timestamp", "value":lastTimestamp, "op":">"},
            {"key":"relayerFetched", "value":null},
        ];

        const url = `${constants.serviceUrl}/request?q=${JSON.stringify(pattern)}`;
        const response = await getAuthenticated(url);

        // TODO: update statuses on Endpoint contract

        const maxTimestamp = Math.max(...response.data.map(order => order.updatedOn));
        await saveLastProcessedTimestamp('processing', maxTimestamp);
    } catch (error) {
        console.error("Failed to relay statuses:", error);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    credentials = readJSONFile('credentials.json');
    constants = readJSONFile('constants.json');

    const [owner, user, producer, relayer] = await ethers.getSigners();
    const addresses = readJSONFile('deployed_addresses.json');
    const contractAddress = addresses.proofMarket;
    const ProofMarketEndpoint = await ethers.getContractFactory("ProofMarketEndpoint");
    const proofMarket = ProofMarketEndpoint.attach(contractAddress);

    while (true) {
        await relayProofs(proofMarket, relayer);
        await relayStatuses(proofMarket, relayer);
        await delay(10000);
    }
}

main();
