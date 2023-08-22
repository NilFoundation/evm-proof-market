const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const LosslessJSON = require('lossless-json');

const buildDir = path.join(__dirname, '../artifacts/contracts');
const MockTokenJSON = JSON.parse(fs.readFileSync(`${buildDir}/test/mock_erc20_contract.sol/MockToken.json`, 'utf8'));
const MockTokenABI = MockTokenJSON.abi;
const ProofMarketEndpointJSON = JSON.parse(fs.readFileSync(`${buildDir}/proof_market_endpoint.sol/ProofMarketEndpoint.json`, 'utf8'));
const ProofMarketEndpointABI = ProofMarketEndpointJSON.abi;

const validStatementIds = ['79169223', '32292', '32326'];

const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
const tokenAddress = addresses.token;
const proofMarketAddress = addresses.proofMarket;

async function createOrder(keystoreFile, password, statementId, price, inputFile, providerUrl) {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const keystore = JSON.parse(fs.readFileSync(keystoreFile, 'utf-8'));
    const privateKey = await ethers.Wallet.fromEncryptedJson(JSON.stringify(keystore), password);
    const signer = new ethers.Wallet(privateKey, provider);
    const proofMarket = new ethers.Contract(proofMarketAddress, ProofMarketEndpointABI, signer);
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
        const testOrder = {
            statementId: statementId,
            publicInputs: input,
            price: parsedPrice
        };
        console.log('Creating order:', testOrder);

        const tx = await proofMarket.createOrder(testOrder);
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

async function mintAndApprove(keystoreFile, password, providerUrl) {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const keystore = JSON.parse(fs.readFileSync(keystoreFile, 'utf-8'));
    const privateKey = await ethers.Wallet.fromEncryptedJson(JSON.stringify(keystore), password);
    const signer = new ethers.Wallet(privateKey, provider);
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

async function getPrice(statementId, providerUrl) {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const proofMarket = new ethers.Contract(proofMarketAddress, ProofMarketEndpointABI, provider);
    try {
        const statement = await proofMarket.getStatement(statementId);
        const orderBook = statement.price.orderBook;
        const prices = orderBook.map((item) => item.toString());
        console.log('Order book for statement ', statementId, ': ', prices);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function createKeystoreFromPrivateKey(privateKey, password) {
    const wallet = new ethers.Wallet(privateKey);
    const keystore = await wallet.encrypt(password);
    console.log('Keystore: ', keystore);

    fs.writeFileSync('keystore.json', keystore);
}

const argv = yargs(hideBin(process.argv))
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
        (argv) => {
            createOrder(argv.keystoreFile, argv.password, argv.statementId, argv.price, argv.inputFile, argv.providerUrl)
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
        (argv) => {
            mintAndApprove(argv.keystoreFile, argv.password, argv.providerUrl)
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
            getPrice(argv.statementId, argv.providerUrl)
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
    .demandCommand(1, 'You need to specify a command')
    .help()
    .argv;
