const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json'), 'utf-8'));
const constants = JSON.parse(fs.readFileSync(path.join(__dirname, 'constants.json'), 'utf-8'));

const validStatementIds = ['32326'];

async function relayPrices(contract, relayer) {
    try {
        const url = `${constants.serviceUrl}/top`;
        console.log(url);
        const response = await axios.get(url, {
            auth: {
                username: credentials.username,
                password: credentials.password
            }
        });
        console.log(response.data[0]);
        for (let statBook of response.data) {
            const statementId = statBook.statement_key;
            if (!validStatementIds.includes(statementId)) {
                continue;
            }
            console.log('Relaying price for statement:', statBook.name, statementId);
            let prices = [[], []];
            for (let request of statBook.requests) {
                prices[0].push(request.cost);
            }
            for (let proposal of statBook.proposals) {
                prices[1].push(proposal.cost);
            }
            console.log(prices);
            try {
                const result = await contract.connect(relayer).updateStatementPrice(statementId, prices);
                console.log(result);
            } catch (error) {
                console.error(`Failed to update statement price ${statementId}:`, error);
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
        await relayPrices(proofMarket, relayer);
        await delay(10000);
    }
}

main();
