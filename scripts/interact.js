
/**
 * Script for interacting with the deployed ProofMarketEndpoint contract.
 * This script provides utilities for:
 * - Creating and getting an order
 * - Getting statetment prices
 * - Creating keystore from a private key
 * - Minting test tokens and approving the ProofMarketEndpoint contract to spend them
 * 
 * Usage:
 * 1. node scripts/interact.js createOrder --statementId <statementId> \
 * --price <price> --inputFile <inputFilePath> --password <password> --keystoreFile <keystoreFile>
 * 2. node scripts/interact.js getPrice --statementId <statementId>
 * 3. node scripts/interact.js createKeystoreFromPrivateKey --pk <privateKey> --password <password>
 * 4. node scripts/interact.js mintAndApprove --password <password>
 * 5. node scripts/interact.js getOrder --orderId <orderId>
 */

const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const LosslessJSON = require('lossless-json');

// Constants
const buildDir = path.join(__dirname, '../artifacts/contracts');
const MockTokenJSON = JSON.parse(fs.readFileSync(`${buildDir}/test/mock_erc20_contract.sol/MockToken.json`, 'utf8'));
const MockTokenABI = MockTokenJSON.abi;
const ProofMarketEndpointJSON = JSON.parse(fs.readFileSync(`${buildDir}/proof_market_endpoint.sol/ProofMarketEndpoint.json`, 'utf8'));
const ProofMarketEndpointABI = ProofMarketEndpointJSON.abi;
const validStatementIds = ['79169223', '32292', '32326'];
const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
const tokenAddress = addresses.token;
const proofMarketAddress = addresses.proofMarket;
const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Initialize the signer and proofMarket objects.
 * @param {string} keystoreFile - Path to the keystore file.
 * @param {string} password - Password for the keystore.
 * @param {string} providerUrl - Ethereum provider URL.
 * @returns {Object} - Returns an object containing the signer and proofMarket objects.
 */
async function initialize(keystoreFile, password, providerUrl) {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);

    const network = await provider.getNetwork();
    console.log(`Network Name: ${network.name}`);
    console.log(`Network Chain ID: ${network.chainId}`);
    console.log(`Contract Address: ${proofMarketAddress}`);

    let signer;
    let proofMarket;

    if (keystoreFile && password) {
        const keystore = JSON.parse(fs.readFileSync(keystoreFile, 'utf-8'));
        const privateKey = await ethers.Wallet.fromEncryptedJson(JSON.stringify(keystore), password);
        signer = new ethers.Wallet(privateKey, provider);
        proofMarket = new ethers.Contract(proofMarketAddress, ProofMarketEndpointABI, signer);
    } else {
        proofMarket = new ethers.Contract(proofMarketAddress, ProofMarketEndpointABI, provider);
    }

    return { signer, proofMarket };
}


/**
 * Create a new order.
 * @param {Object} proofMarket - The proofMarket contract object.
 * @param {string} statementId - ID of the statement for the order.
 * @param {string} price - Price for the order.
 * @param {string} inputFile - Path to the input file for the order.
 */
async function createOrder(proofMarket, statementId, price, inputFile, force) {
    try {
        let input = LosslessJSON.parse(fs.readFileSync(inputFile, 'utf-8'));
        if (statementId == '79169223') {
            input = input[0].array;
            input = [input.map((item) => ethers.BigNumber.from(item))];
        } else if (statementId === '32292') {
            input = [input.map((item) => BigInt(item))];
        } else if (statementId === '32326') {
            input = [input.map((item) => BigInt(item))];
        } else {
            console.error('Invalid statement ID');
            return;
        }
        const parsedPrice = ethers.utils.parseUnits(price, 18);
        const order = {
            statementId: statementId,
            publicInputs: input,
            price: parsedPrice
        };
        console.log('Creating order:', order);

        const provider = proofMarket.provider;
        const gasPrice = await provider.getGasPrice();
        const gasLimit = await proofMarket.estimateGas.createOrder(order);

        console.log('Estimated gas limit:', gasLimit.toString());

        if (!force) {
            const confirm = await new Promise((resolve) => {
                rl.question('Confirm transaction (y/n): ', (answer) => {
                    rl.close();
                    resolve(answer);
                });
            });
            if (confirm !== 'y') {
                console.log('Transaction cancelled');
                return;
            }
        }

        const tx = await proofMarket.createOrder(order);
        const receipt = await tx.wait();
        const event = receipt.events.find((e) => e.event === "OrderCreated");
        console.log('Order created successfully: id ', event.args.id);
    } catch (error) {
        if (error.message.includes('Statement does not exist')) {
            console.error('Error: Statement does not exist');
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

/**
 * Mint test tokens and approve them for spending.
 * @param {Object} signer - The signer object.
 * @param {Object} proofMarket - The proofMarket contract object.
 */
async function mintAndApprove(signer, proofMarket) {
    const token = new ethers.Contract(tokenAddress, MockTokenABI, signer);
    try {
        const tx = await token.mint(signer.address, ethers.utils.parseUnits("1000000", 18));
        const receipt = await tx.wait();
        console.log('Minted 1000000 tokens to ', signer.address);

        const tx2 = await token.connect(signer).approve(proofMarketAddress, ethers.utils.parseUnits("1000000", 18));
        const receipt2 = await tx2.wait();
        console.log('Approved ', proofMarketAddress, ' to spend 1000000 tokens');

        const balance = await token.balanceOf(signer.address);
        console.log('Balance: ', balance.toString());
        
    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Fetch the price for a given statement.
 * @param {string} statementId - ID of the statement.
 * @param {Object} proofMarket - The proofMarket contract object.
 */
async function getPrice(statementId, proofMarket) {
    try {
        const statement = await proofMarket.getStatement(statementId);
        const orderBook = statement.price.orderBook;
        const prices = orderBook.map((item) => item.toString());
        console.log('Order book for statement ', statementId, ': ', prices);
    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Create a keystore file from a given private key.
 * @param {string} privateKey - Ethereum private key.
 * @param {string} password - Password for the keystore.
 */
async function createKeystoreFromPrivateKey(privateKey, password) {
    const wallet = new ethers.Wallet(privateKey);
    const keystore = await wallet.encrypt(password);
    console.log('Keystore: ', keystore);

    fs.writeFileSync('keystore.json', keystore);
}

/**
 * Fetch an order by its ID.
 * @param {string} orderId - ID of the order.
 * @param {Object} proofMarket - The proofMarket contract object.
 */
async function getOrder(orderId, proofMarket) {
    try {
        const order = await proofMarket.getOrder(orderId);
        console.log('Order: ', order);
    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Fetch all valid statements.
 * @param {Object} proofMarket - The proofMarket contract object.
 */
async function getStatements(proofMarket) {
    let statements = [];
    for (const statementId of validStatementIds) {
        try {
            const statement = await proofMarket.getStatement(statementId);
            statements.push(statement);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    console.log('Statements: ', statements);
}

// Command-line interface setup
const argv = yargs(hideBin(process.argv))
    .option('force', {
        type: 'boolean',
        default: false,
        describe: 'Force the transaction without asking for confirmation',
    })
    .option('providerUrl', {
        type: 'string',
        description: 'Provider URL',
        default: 'http://localhost:8545',
    })
    .command(
        'createOrder', 
        'Create a new order', 
        {
        statementId: {
            type: 'string',
            demandOption: true,
            describe: 'Statement ID for the order',
            choices: validStatementIds,
        },
        price: {
            type: 'string',
            demandOption: true,
            describe: 'Price for the order',
        },
        inputFile: {
            type: 'string',
            demandOption: true,
            describe: 'Input file for the order',
        },
        keystoreFile: {
            type: 'string',
            describe: 'Keystore file',
            default: 'keystore.json',
        },
        password: {
            type: 'string',
            demandOption: true,
            describe: 'Password',
        },
        },
        async (argv) => {
            const { signer, proofMarket } = await initialize(argv.keystoreFile, argv.password, argv.providerUrl);
            createOrder(proofMarket, argv.statementId, argv.price, argv.inputFile, argv.force)
            .then(() => process.exit(0))
            .catch((error) => {
                console.error(error);
                process.exit(1);
            });
        }
    )
    .command(
        'mintAndApprove',
        'Mint and approve tokens',
        {
            keystoreFile: {
                type: 'string',
                describe: 'Keystore file',
                default: 'keystore.json',
            },
            password: {
                type: 'string',
                demandOption: true,
                describe: 'Password',
            },
        },
        async (argv) => {
            const { signer, proofMarket } = await initialize(argv.keystoreFile, argv.password, argv.providerUrl);
            mintAndApprove(signer, proofMarket)
            .then(() => process.exit(0))
            .catch((error) => {
                console.error(error);
                process.exit(1);
            });
        }
    )
    .command(
        'getPrice',
        'Get price for a statement',
        {
            statementId: {
                type: 'string',
                demandOption: true,
                describe: 'Statement ID for the order',
                choices: validStatementIds,
            },
        },
        async (argv) => {
            const { signer, proofMarket } = await initialize(argv.keystoreFile, argv.password, argv.providerUrl);
            getPrice(argv.statementId, proofMarket)
            .then(() => process.exit(0))
            .catch((error) => {
                console.error(error);
                process.exit(1);
            });
        }
    )
    .command(
        'createKeystoreFromPrivateKey',
        'Create a keystore from a private key',
        {
            pk: {
                type: 'string',
                demandOption: true,
                describe: 'Private key',
            },
            password: {
                type: 'string',
                demandOption: true,
                describe: 'Password',
            },
        },
        async (argv) => {
            createKeystoreFromPrivateKey(argv.pk, argv.password)
            .then(() => process.exit(0))
            .catch((error) => {
                console.error(error);
                process.exit(1);
            });
        }
    )
    .command(
        'getOrder',
        'Get an order',
        {
            orderId: {
                type: 'string',
                demandOption: true,
                describe: 'Order ID',
            },
        },
        async (argv) => {
            const { signer, proofMarket } = await initialize(argv.keystoreFile, argv.password, argv.providerUrl);
            getOrder(argv.orderId, proofMarket)
            .then(() => process.exit(0))
            .catch((error) => {
                console.error(error);
                process.exit(1);
            });
        }
    )
    .command(
        'getStatements',
        'Get statements',
        {},
        async (argv) => {
            const { signer, proofMarket } = await initialize(argv.keystoreFile, argv.password, argv.providerUrl);
            getStatements(proofMarket)
            .then(() => process.exit(0))
            .catch((error) => {
                console.error(error);
                process.exit(1);
            });
        }
    )
    .demandCommand(1, 'You need to specify a command')
    .help()
    .argv;
