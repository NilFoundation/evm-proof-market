const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");
const { getVerifierParams } = require("../../test/utils.js");

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

async function closeOrder(contract, relayer, order) {
    try {
        const id = parseInt(order.eth_id);
        const proof_key = order.proof_key;

        if (isNaN(id)) {
            throw new Error(`Invalid order ID: ${order.eth_id}`);
        }

        let response = await getAuthenticated(`${constants.serviceUrl}/proof/${proof_key}`);
        const bytes = ethers.utils.toUtf8Bytes(response.data.proof);
        const proof = [ethers.utils.hexlify(bytes)];
        const price = ethers.utils.parseUnits(order.cost.toString(), 18);
        // console.log(proof, price);
        // get order from service
        // let configPath = "../test/data/unified_addition/lambda2.json"
        // let proofPath = "../test/data/unified_addition/lambda2.data"
        // let publicInputPath = "../test/data/unified_addition/public_input.json";
        // let params = getVerifierParams(configPath,proofPath, publicInputPath);
        // const proof = [params.proof];
        
        // const eth_order = await contract.connect(relayer).getOrder(id);
        // console.log(eth_order);
        return contract.connect(relayer).closeOrder(id, proof, price);
    } catch (error) {
        console.error(`Error processing order ${order.eth_id}:`, error);
    }
}

async function setProducer(contract, relayer, order) {
    try {
        const id = parseInt(order.eth_id);
        const proposal_key = order.proposal_key;
        let response = await getAuthenticated(`${constants.serviceUrl}/proposal/${proposal_key}`);
        const producerName = response.data.sender;

        response = await getAuthenticated(`${constants.serviceUrl}/producer/${producerName}`);
        const producerAddress = response.data.eth_address;
        if (producerAddress === null) {
            producerAddress = relayer.address;
        }

        return contract.connect(relayer).setProducer(id, producerAddress);

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
            {"key":"updatedOn", "value":lastTimestamp, "op":">"}
        ];
        const url = `${constants.serviceUrl}/request?q=${JSON.stringify(pattern)}`;
        const response = await getAuthenticated(url);
        const orders = response.data;
        console.log(`Relaying ${orders.length} proofs...`)
        console.log(orders);
        const closeOrderPromises = orders.map(order => closeOrder(contract, relayer, order));
        const results = await Promise.all(closeOrderPromises);
        results.forEach(result => console.log(result));

        const maxTimestamp = orders.length > 0 ? Math.max(...orders.map(order => order.updatedOn)) : 0;
        if (maxTimestamp > 0) {
            await saveLastProcessedTimestamp('completed', 0);
        }
    } catch (error) {
        console.error("Failed to relay proofs:", error);
    }
}

async function relayStatuses(contract, relayer) {
    try {
        const lastTimestamp = await getLastProcessedTimestamp('processing');

        const pattern = [
            {"key":"sender", "value":credentials.username},
            {"key":"status", "value":"created", "op":"~"},
            {"key":"updatedOn", "value":lastTimestamp, "op":">"},
            // TODO: set this flag after the order is fetched and the producer is set
            // add it in relayProofs
            {"key":"relayerFetched", "value":null},
        ];

        const url = `${constants.serviceUrl}/request?q=${JSON.stringify(pattern)}`;
        const response = await getAuthenticated(url);
        console.log(response.data);
        const orders = response.data;

        const setProducerPromises = response.data.map(order => setProducer(contract, relayer, order));
        const results = await Promise.all(setProducerPromises);
        results.forEach(result => console.log(result));
        const maxTimestamp = orders.length > 0 ? Math.max(...orders.map(order => order.updatedOn)) : 0;
        if (maxTimestamp > 0) {
            await saveLastProcessedTimestamp('processing', maxTimestamp);
        }
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
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const contractAddress = addresses.proofMarket;
    const ProofMarketEndpoint = await ethers.getContractFactory("ProofMarketEndpoint");
    const proofMarket = ProofMarketEndpoint.attach(contractAddress);

    while (true) {
        await relayProofs(proofMarket, relayer);
        // await relayStatuses(proofMarket, relayer);
        await delay(10000);
    }
}

main();
