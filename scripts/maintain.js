const fs = require('fs');
const { task } = require("hardhat/config");


/**
 * Script for maintaining and upgrading the deployed ProofMarketEndpoint contract.
 * This script provides utilities for:
 * - Adding new statements
 * - Updating verifiers for existing statements
 * - Upgrading the contract
 * 
 * Usage:
 * 1. Add a statement: node maintain.js addStatement --statementId <Statement ID>
 * 2. Update verifiers: node maintain.js updateStatementVerifiers --statementId <Statement ID>
 * 3. Upgrade the contract: node maintain.js upgradeContract
 */

const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf8'));
const proofMarketAddress = addresses.proofMarket;
const verifiersAddresses = addresses.verifiers;

/**
 * Add a new statement with the provided ID to the ProofMarket contract.
 * Verifiers for the statement are retrieved from the deployed_addresses.json file.
 */
async function addStatement(statementId) {
    const [owner, relayer] = await ethers.getSigners();
    const proofMarket =  await ethers.getContractAt('ProofMarketEndpoint', proofMarketAddress, relayer);
    if (!verifiersAddresses[statementId]) {
        console.error('Invalid statement ID');
        return;
    }
    const statementVerifiers = verifiersAddresses[statementId];
    const testStatement = {
        id: statementId,
        definition: {
            verificationKey: ethers.utils.formatBytes32String("Example verification key"),
            provingKey: ethers.utils.formatBytes32String("Example proving key")
        },
        price: { orderBook: [[100], [100]] },
        developer: proofMarket.signer.address,
        verifiers: statementVerifiers
    };

    try {
        const tx = await proofMarket.addStatement(testStatement);
        const receipt = await tx.wait();
        const event = receipt.events.find((e) => e.event === "StatementAdded");
        console.log('Statement added successfully: id ', event.args.id.toString());
    } catch (error) {
        if (error.message.includes('Statement ID already exists')) {
            console.error('Statement already exists, update it');
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

/**
 * Update the verifiers of an existing statement in the ProofMarket contract.
 */
async function updateStatementVerifiers(statementId) {
    const [owner, relayer] = await ethers.getSigners();
    const proofMarket =  await ethers.getContractAt('ProofMarketEndpoint', proofMarketAddress, relayer);
    if (!verifiersAddresses[statementId]) {
        console.error('Invalid statement ID');
        return;
    }
    const statementVerifiers = verifiersAddresses[statementId];
    try {
        const tx = await proofMarket.updateStatementVerifiers(statementId, statementVerifiers);
        const receipt = await tx.wait();
        const event = receipt.events.find((e) => e.event === "StatementVerifiersUpdated");
        console.log('Statement updated successfully: id ', event.args.id.toString());
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

/**
 * Deploy ProofMarketEndpoint contract
 */
async function deployContract() {
    const ProofMarket = await ethers.getContractFactory("ProofMarketEndpoint");
    const ERC20 = await ethers.getContractFactory("MockToken");

    let [deployer, relayer] = await ethers.getSigners();

    // Log the deployer address
    console.log('Deploying contracts with the account:', deployer.address);
    // Deploy the token contract
    const token = await ERC20.connect(deployer).deploy();
    await token.deployed();
    console.log('MockToken deployed to:', token.address);
    // Deploy the proof market contract
    const proofMarket = await upgrades.deployProxy(ProofMarket.connect(deployer), [token.address]);
    await proofMarket.deployed();
    console.log('ProofMarketEndpoint deployed to:', proofMarket.address);
    // Set the relayer role
    await proofMarket.grantRole(proofMarket.RELAYER_ROLE(), relayer.address);
    console.log('Relayer role granted to:', relayer.address);
    const addresses = {
        token: token.address,
        proofMarket: proofMarket.address,
        relayer: relayer.address,
    };

    fs.writeFileSync('deployed_addresses.json', JSON.stringify(addresses, null, 2));
}

/**
 * Upgrade the deployed ProofMarketEndpoint contract
 */
async function upgradeContract() {
    console.log('Upgrading ProofMarket contract...');
    const [owner] = await ethers.getSigners();
    const ProofMarket = await ethers.getContractFactory('ProofMarketEndpoint', owner);
    try {
        await upgrades.upgradeProxy(proofMarketAddress, ProofMarket);
        console.log('ProofMarket contract upgraded successfully');
    } catch (error) {
        console.error('Upgrade failed:', error);
    }
}

/**
 * Get balances
 */
async function getBalance() {
    const [signer, relayer] = await ethers.getSigners();
    console.log(`Signer: ${signer.address}`);
    const balance = await signer.getBalance();
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);

    console.log(`Relayer: ${relayer.address}`);
    const relayerBalance = await relayer.getBalance();
    console.log(`Balance: ${ethers.utils.formatEther(relayerBalance)} ETH`);
}


task("addStatement", "Add a new statement to the ProofMarket contract")
    .addParam("statementId", "The statement ID to add")
    .setAction(async (taskArgs, hre) => {
        try {
            await addStatement(taskArgs.statementId);
        } catch (error) {
            console.error(error);
        }
    });

task("updateStatementVerifiers", "Update verifiers for an existing statement in the ProofMarket contract")
    .addParam("statementId", "The statement ID to update")
    .setAction(async (taskArgs, hre) => {
        try {
        await updateStatementVerifiers(taskArgs.statementId);
        } catch (error) {
        console.error(error);
      }
    });

task("upgradeContract", "Upgrade the deployed contract")
    .setAction(async (taskArgs, hre) => {
        try {
            await upgradeContract();
        } catch (error) {
            console.error(error);
        }
    });

task("deployContract", "Deploy the contract")
    .setAction(async (taskArgs, hre) => {
        try {
            await deployContract();
        } catch (error) {
            console.error(error);
        }
    });

task("getBalance", "Get balances")
    .setAction(async (taskArgs, hre) => {
        try {
            await getBalance();
        } catch (error) {
            console.error(error);
        }
    });

module.exports = {
    addStatement,
    updateStatementVerifiers,
    upgradeContract,
    deployContract,
    getBalance,
};