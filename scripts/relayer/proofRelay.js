const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json'), 'utf-8'));
const constants = JSON.parse(fs.readFileSync(path.join(__dirname, 'constants.json'), 'utf-8'));

async function updateOrderStatus(orderId, status) {
    try {
        // TODO: Update after renaming changes
        const url = `${constants.serviceUrl}/bid/${orderId}`;
        const response = await axios.patch(url, { status }, {
            auth: {
                username: credentials.username,
                password: credentials.password
            }
        });
        if (response.status !== 200) {
            throw new Error(`Received status code ${response.status}`);
        }
        console.log(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
        console.error(`Failed to update order ${orderId} status:`, error);
    }
}

async function relayProofs(contract, relayer) {
    try {
        const pattern = [
            {"key":"sender", "value": credentials.username},
            {"key":"status", "value":"complete"}
        ];
        const url = `${constants.serviceUrl}/bid?q=${JSON.stringify(pattern)}`;
        const response = await axios.get(url, {
            auth: {
                username: credentials.username,
                password: credentials.password
            }
        });
        console.log(response.data);
        const orders = response.data;
        for (let order of orders) {
            const id = order.id;
            const proof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(order.proof));
            const price = ethers.utils.parseUnits(order.cost.toString(), 18);
            const producerAddress = order.producer;
            try {
                const result = await contract.connect(relayer).closeOrder(id, proof, price, producerAddress);
                console.log(result);
                await updateOrderStatus(id, 'closed');
            } catch (error) {
                console.error(`Failed to close order ${id}:`, error);
                await updateOrderStatus(id, 'failed');
            }
        }
    } catch (error) {
        console.error(error);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const [owner, user, producer, relayer] = await ethers.getSigners();
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const contractAddress = addresses.proofMarket;
    const ProofMarketEndpoint = await hre.ethers.getContractFactory("ProofMarketEndpoint");
    const proofMarket = ProofMarketEndpoint.attach(contractAddress);
    while (true) {
        await relayProofs(proofMarket, relayer);
        await delay(10000);
    }
}

main();
