const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");


const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json'), 'utf-8'));
const constants = JSON.parse(fs.readFileSync(path.join(__dirname, 'constants.json'), 'utf-8'));


async function relayProofs(contract, relayer) {
    try {
        const pattern = [
            {"key":"sender", "value": credentials.username},
            {"key":"status", "value":"complete"}
        ];
        const url = `${constants.serviceUrl}/request?q=${JSON.stringify(pattern)}`;
        const response = await axios.get(url, {
            auth: {
                username: credentials.username,
                password: credentials.password
            }
        });
        console.log(response.data);
        const orders = response.data;
        const closeOrderPromises = [];

        for (let order of orders) {
            const id = order.id;
            const proof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(order.proof));
            const price = ethers.utils.parseUnits(order.cost.toString(), 18);
            const producerAddress = order.producer;
            
            closeOrderPromises.push(
                contract.connect(relayer).closeOrder(id, proof, price, producerAddress)
            );
        }

        // Wait for all the closeOrder calls to finish
        const results = await Promise.all(closeOrderPromises);

        for (let result of results) {
            console.log(result);
        }
    } catch (error) {
        console.error(error);
    }
}

async function relayStatuses(contract, relayer) {
    try {
        const pattern = [
            {"key":"sender", "value": credentials.username},
            {"key":"status", "value":"processing"},
            {"key":"relayerFetched", "value":null},
        ];
        const url = `${constants.serviceUrl}/request?q=${JSON.stringify(pattern)}`;
        const response = await axios.get(url, {
            auth: {
                username: credentials.username,
                password: credentials.password
            }
        });
        console.log(response.data);
        // const orders = response.data;
        // TODO: update statuses on Endpoint contract
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
        await relayStatuses(proofMarket, relayer);
        await delay(10000);
    }
}

main();
