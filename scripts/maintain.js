const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf8'));
const proofMarketAddress = addresses.proofMarket;
const verifiersAddresses = addresses.verifiers;
const buildDir = path.join(__dirname, '../artifacts/contracts');
const ProofMarketEndpointJSON = JSON.parse(fs.readFileSync(`${buildDir}/proof_market_endpoint.sol/ProofMarketEndpoint.json`, 'utf8'));
const ProofMarketEndpointABI = ProofMarketEndpointJSON.abi;

async function getSigner(keystoreFile, password, providerUrl) {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const keystore = JSON.parse(fs.readFileSync(keystoreFile, 'utf8'));
    const privateKey = await ethers.Wallet.fromEncryptedJson(JSON.stringify(keystore), password);
    return new ethers.Wallet(privateKey, provider);
}

async function getProofMarket(keystoreFile, password, providerUrl) {
    const signer = await getSigner(keystoreFile, password, providerUrl);
    return new ethers.Contract(proofMarketAddress, ProofMarketEndpointABI, signer);
}

async function addStatement(proofMarket, statementId) {
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

async function updateStatementVerifiers(proofMarket, statementId) {
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

const argv = yargs(hideBin(process.argv))
    .option('providerUrl', {
        type: 'string',
        description: 'Provider URL',
        default: 'http://localhost:8545',
    })
    .option('keystoreFile', {
        type: 'string',
        description: 'Keystore file',
        default: 'keystore.json',
    })
    .option('password', {
        type: 'string',
        description: 'Keystore password',
        default: 'password',
    })
    .command(
        'addStatement',
        'Add a new statement',
        {
            statementId: {
                type: 'string',
                demandOption: true,
                describe: 'Statement ID for the statement',
            }
        },
        async (argv) => {
            try {
                const proofMarket = await getProofMarket(argv.keystoreFile, argv.password, argv.providerUrl);
                await addStatement(proofMarket, argv.statementId);
                process.exit(0);
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        }
    )
    .command(
        'updateStatementVerifiers',
        'Update verifiers for a statement',
        {
            statementId: {
                type: 'string',
                demandOption: true,
                describe: 'Statement ID for the statement',
            }
        },
        async (argv) => {
            try {
                const proofMarket = await getProofMarket(argv.keystoreFile, argv.password, argv.providerUrl);
                await updateStatementVerifiers(proofMarket, argv.statementId);
                process.exit(0);
            } catch (error) {
                console.error(error);
                process.exit(1);
            }
        }
    )
    .demandCommand(1, 'You need to specify a command')
    .help()
    .argv;
