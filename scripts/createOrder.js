const hre = require("hardhat");
const ethers = hre.ethers;
const fs = require('fs');

async function main() {
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const tokenAddress = addresses.token;
    const contractAddress = addresses.proofMarket;

    const [owner, user, producer, relayer] = await ethers.getSigners();

    const MockToken = await hre.ethers.getContractFactory("MockTocken");
    const token = MockToken.attach(tokenAddress);

    const ProofMarketEndpoint = await hre.ethers.getContractFactory("ProofMarketEndpoint");
    const proofMarket = ProofMarketEndpoint.attach(contractAddress);

    try {
        const input = ethers.utils.formatBytes32String("Example input");
        const price = ethers.utils.parseUnits("10", 18);
        const statementId = '32326';
        const testOrder = {
            statementId: statementId,
            input: input,
            price: price
        };

        const tx = await proofMarket.connect(user).createOrder(testOrder);
        const receipt = await tx.wait();
        const event = receipt.events.find((e) => e.event === "OrderCreated");
        console.log('Order created successfully: id ', event.args.id);

        fs.writeFileSync('order_id.txt', event.args.id.toString());
    } catch (error) {
        if (error.message.includes('Statement does not exist')) {
            console.error('Error: Statement does not exist');
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
