
/**
 * Hardhat tasks script for maintenance the ProofMarketEndpoint contract.
 * This script provides utilities for:
 * - Adding new statements
 * - Updating verifiers for existing statements
 * - Upgrading the contract
 * - Deploying the contract
 * - Getting balances of contract's owner and relayer
 * 
 * Usage:
 * 1. Add a statement: node maintain.js addStatement --statement-id <Statement ID> --verifiers <verifier1,verifier2,...>
 * 2. Update verifiers: node maintain.js updateStatementVerifiers --statement-id <Statement ID> --verifiers <verifier1,verifier2,...>
 * 3. Upgrade the contract: node maintain.js upgradeContract
 * 4. Deploy the contract: node maintain.js deployContract
 * 5. Get balances: node maintain.js getBalance
 */

const fs = require('fs');
const { task } = require("hardhat/config");

// Constants
const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf8'));
const proofMarketAddress = addresses.proofMarket;

/**
 * Add a new statement with the provided ID to the ProofMarket contract.
 * Verifiers for the statement are passed as arguments.
 * Throws an error if any verifier address is invalid.
 * 
 * @param {string} statementId - The ID of the statement to add.
 * @param {Array<string>} verifiers - Array of verifier addresses.
 */
async function addStatement(statementId, verifiers) {
    const [owner, relayer] = await ethers.getSigners();
    const proofMarket =  await ethers.getContractAt('ProofMarketEndpoint', proofMarketAddress, relayer);
    verifiers.forEach(verifier => {
        if (!ethers.utils.isAddress(verifier)) {
            throw new Error(`Invalid verifier address: ${verifier}`);
        }
    });
    const statementDefinition = {
        verificationKey: ethers.utils.formatBytes32String("Example verification key"),
        provingKey: ethers.utils.formatBytes32String("Example proving key")
    };
    const statementPrice = { orderBook: [[100], [100]] };
    const statement = {
        id: statementId,
        definition: statementDefinition,
        price: statementPrice,
        developer: relayer.address,
        verifiers: verifiers,
    };
    console.log('Adding statement: ', statement);

    try {
        const addTx = await proofMarket.connect(relayer).addStatement(statement);
        const addReceipt = await addTx.wait();
        const addEvent = addReceipt.events.find((e) => e.event === "StatementAdded");
        console.log('Statement added successfully: id ', addEvent.args.id.toString());
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
 * 
 * @param {string} statementId - The ID of the statement to update.
 * @param {Array<string>} verifiers - Array of new verifier addresses.
 */
async function updateStatementVerifiers(statementId, verifiers) {
    const [owner, relayer] = await ethers.getSigners();
    const proofMarket =  await ethers.getContractAt('ProofMarketEndpoint', proofMarketAddress, relayer);
    try {
        const tx = await proofMarket.updateStatementVerifiers(statementId, verifiers);
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

    console.log('Deploying contracts with the account:', deployer.address);
    const token = await ERC20.connect(deployer).deploy();
    await token.deployed();
    console.log('MockToken deployed to:', token.address);

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
 * Get balances of the contract's owner and relayer
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
    .addParam("verifiers", "The verifiers to add as a comma-separated list")
    .setAction(async (taskArgs, hre) => {
        try {
            const verifiers = taskArgs.verifiers.split(',');
            await addStatement(taskArgs.statementId, verifiers);
        } catch (error) {
            console.error(error);
        }
    });

task("updateStatementVerifiers", "Update verifiers for an existing statement in the ProofMarket contract")
    .addParam("statementId", "The statement ID to update")
    .addParam("verifiers", "The verifiers to add as a comma-separated list")
    .setAction(async (taskArgs, hre) => {
        try {
            const verifiers = taskArgs.verifiers.split(',');
            console.log('Updating statement verifiers: ', verifiers);
            await updateStatementVerifiers(taskArgs.statementId, verifiers);
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