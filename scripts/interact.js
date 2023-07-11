
const hre = require("hardhat");
const ethers = hre.ethers;
const fs = require('fs');

async function main() {
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const tokenAddress = addresses.token;
    const contractAddress = addresses.proofMarket;

    const [owner, user, producer, relayer] = await ethers.getSigners();

    const MockToken = await hre.ethers.getContractFactory("MockTocken"); // Replace 'MockTocken' with the actual name of your token contract
    const token = MockToken.attach(tokenAddress);

    const ProofMarketEndpoint = await hre.ethers.getContractFactory("ProofMarketEndpoint");
    const proofMarket = ProofMarketEndpoint.attach(contractAddress);

    console.log("User address:", user.address);
    const balance = await token.balanceOf(user.address);
    console.log("User balance:", ethers.utils.formatUnits(balance, 18));

    console.log("Producer address:", producer.address);
    const balanceProducer = await token.balanceOf(producer.address);
    console.log("Producer balance:", ethers.utils.formatUnits(balanceProducer, 18));

    // add a statement
    const statementId = '32326';
    try {
        await deployments.fixture(['unifiedAdditionVerifierFixture']);
        let unifiedAdditionVerifier = await ethers.getContract('UnifiedAdditionVerifier');
        console.log("unifiedAdditionVerifier address: ", unifiedAdditionVerifier.address);
        definition = {
            verificationKey: ethers.utils.formatBytes32String("Example verification key"),
            provingKey: ethers.utils.formatBytes32String("Example proving key")
        };
        price = { orderBook: [[100], [100]] };
        testStatement = {
            id: statementId,
            definition: definition,
            price: price,
            developer: producer.address,
            verifiers: [unifiedAdditionVerifier.address]
        };
        const tx = await proofMarket.connect(relayer).addStatement(testStatement);
        const receipt = await tx.wait();
        const event = receipt.events.find((e) => e.event === "StatementAdded");
        console.log('Statement added successfully: id ', event.args.id);
    } catch (error) {
        if (error.message.includes('Statement ID already exists')) {
            console.error('Error: Statement already exists');
        } else {
            console.error('Unexpected error:', error);
        }
    }

    // add an order
    // try {
    //     const input = [[1,2,3]];         
    //     const price = ethers.utils.parseUnits("10", 18);
    //     const testOrder = {
    //         statementId: statementId,
    //         publicInputs: input,
    //         price: price
    //     };

    //     const tx = await proofMarket.connect(user).createOrder(testOrder);
    //     const receipt = await tx.wait();
    //     const event = receipt.events.find((e) => e.event === "OrderCreated");
    //     console.log('Order created successfully: id ', event.args.id);
    // } catch (error) {
    //     if (error.message.includes('Statement does not exist')) {
    //         console.error('Error: Statement does not exist');
    //     } else {
    //         console.error('Unexpected error:', error);
    //     }
    // }
}


main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
