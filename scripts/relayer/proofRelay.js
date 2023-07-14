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

async function closeOrder(contract, relayer, order) {
    try {
        // TODO: relay statuses independently
        await setProducer(contract, relayer, order);
        
        const id = parseInt(order.eth_id);
        const proof_key = order.proof_key;

        if (isNaN(id)) {
            throw new Error(`Invalid order ID: ${order.eth_id}`);
        }

        console.log(`Closing order ${order.eth_id} with proof ${proof_key}...`)
        let response = await getAuthenticated(`${constants.serviceUrl}/proof/${proof_key}`);
        const proof = [response.data.proof];
        const price = ethers.utils.parseUnits(order.cost.toString(), 18);
        return contract.connect(relayer).closeOrder(id, proof, price, {gasLimit: 30_500_000});
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
        console.log('Setting producer', producerAddress, 'for order', id, '...');
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
        if (orders.length === 0) {
            return;
        }
        console.log(`Relaying ${orders.length} proofs...`)
        console.log(orders);
        const closeOrderPromises = orders.map(order => closeOrder(contract, relayer, order));
        const results = await Promise.all(closeOrderPromises);
        results.forEach(result => console.log(result));

        const maxTimestamp = orders.length > 0 ? Math.max(...orders.map(order => order.updatedOn)) : 0;
        if (maxTimestamp > 0) {
            await saveLastProcessedTimestamp('completed', maxTimestamp);
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
        // console.log(response.data);
        const orders = response.data;
        if (orders.length === 0) {
            return;
        }
        console.log(`Relaying ${orders.length} statuses...`)
        console.log(orders);

        const setProducerPromises = orders.map(async (order) => {
            // TODO: remove this by setting relayerFetched flag
            try {
                return await setProducer(contract, relayer, order);
            } catch (error) {
                if (error.message.includes("Order is not open")) {
                    console.log(`Order ${order.eth_id} is not open. Skipping...`);
                } else {
                    console.error(`Error processing order ${order.eth_id}:`, error);
                }
                return null;
            }
        
        });

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
