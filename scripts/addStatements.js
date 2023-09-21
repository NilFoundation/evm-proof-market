const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const deployedAddresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf8'));
    const verifierAddresses = JSON.parse(fs.readFileSync('test/verifiers_addresses.json', 'utf8'));

    const ProofMarketContract = await ethers.getContractFactory("ProofMarketEndpoint");
    const proofMarketInstance = await ProofMarketContract.attach(deployedAddresses.proofMarket);
    console.log('ProofMarketEndpoint connected to:', proofMarketInstance.address);

    let [deployer, relayer] = await ethers.getSigners();

    async function addOrUpdateStatement(statementId, verifier) {
        try {
            console.log(verifier + " address: ", verifierAddresses[verifier]);

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
                verifiers: [verifierAddresses[verifier]]
            };

            const addTx = await proofMarketInstance.connect(relayer).addStatement(statement);
            const addReceipt = await addTx.wait();
            const addEvent = addReceipt.events.find((e) => e.event === "StatementAdded");
            console.log('Statement added successfully: id ', addEvent.args.id.toString());
        } catch (error) {
            if (error.message.includes('Statement ID already exists')) {
                console.log('Statement already exists, updating it');

                const updateTx = await proofMarketInstance.connect(relayer).updateStatementVerifiers(
                    statementId,
                    [verifierAddresses[verifier]]
                );
                const updateReceipt = await updateTx.wait();
                const updateEvent = updateReceipt.events.find((e) => e.event === "StatementVerifiersUpdated");
                console.log('Statement updated successfully: id ', updateEvent.args.id.toString());
            } else {
                console.error('Unexpected error:', error);
            }
        }
    }

    await addOrUpdateStatement('32326', 'unifiedAdditionVerifier');
    // await addOrUpdateStatement('79169223', 'minaAccountProofVerifier');
    // await addOrUpdateStatement('32292', 'minaStateProofVerifier');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
