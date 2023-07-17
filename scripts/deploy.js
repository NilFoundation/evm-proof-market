const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
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

    let statementId = '79169223';
    try {
        await deployments.fixture(['minaAccountProofVerifierFixture']);
        let minaAccountProofVerifier = await ethers.getContract('AccountPathVerifier');
        console.log("minaAccountProofVerifier address: ", minaAccountProofVerifier.address);
        definition = {
            verificationKey: ethers.utils.formatBytes32String("Example verification key"),
            provingKey: ethers.utils.formatBytes32String("Example proving key")
        };
        price = { orderBook: [[100], [100]] };
        testStatement = {
            id: statementId,
            definition: definition,
            price: price,
            developer: relayer.address,
            verifiers: [minaAccountProofVerifier.address]
        };
        const tx = await proofMarket.connect(relayer).addStatement(testStatement);
        const receipt = await tx.wait();
        const event = receipt.events.find((e) => e.event === "StatementAdded");
        const id = event.args.id;
        console.log('Statement added successfully: id ', id.toString());
    } catch (error) {
        if (error.message.includes('Statement ID already exists')) {
            console.error('Error: Statement already exists');
        } else {
            console.error('Unexpected error:', error);
        }
    }
    statementId = '32292';
    try {
        await deployments.fixture(['minaStateProofVerifierFixture']);
        let minaStateProofVerifier = await ethers.getContract('MinaStateVerifier');
        console.log("minaStateProofVerifier address: ", minaStateProofVerifier.address);
        definition = {
            verificationKey: ethers.utils.formatBytes32String("Example verification key"),
            provingKey: ethers.utils.formatBytes32String("Example proving key")
        };
        price = { orderBook: [[100], [100]] };
        testStatement = {
            id: statementId,
            definition: definition,
            price: price,
            developer: relayer.address,
            verifiers: [minaStateProofVerifier.address]
        };
        const tx = await proofMarket.connect(relayer).addStatement(testStatement);
        const receipt = await tx.wait();
        const event = receipt.events.find((e) => e.event === "StatementAdded");
        const id = event.args.id;
        console.log('Statement added successfully: id ', id.toString());

    } catch (error) {
        if (error.message.includes('Statement ID already exists')) {
            console.error('Error: Statement already exists');
        } else {
            console.error('Unexpected error:', error);
        }
    }
}
    
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
