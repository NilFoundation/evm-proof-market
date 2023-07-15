const hre = require("hardhat");
const ethers = hre.ethers;
const fs = require('fs');

async function main() {
    const addresses = JSON.parse(fs.readFileSync('deployed_addresses.json', 'utf-8'));
    const contractAddress = addresses.proofMarket;

    const ProofMarketEndpoint = await hre.ethers.getContractFactory("ProofMarketEndpoint");
    const proofMarket = ProofMarketEndpoint.attach(contractAddress);

    const orderId = fs.readFileSync('order_id.txt', 'utf-8');

    proofMarket.on("OrderClosed", (id, producer, finalPrice, proof, event) => {
        if (id.toString() === orderId) {
            console.log(`OrderClosed event emitted for OrderId: ${orderId}`);
            console.log(`Producer: ${producer}`);
            console.log(`Final Price: ${finalPrice}`);
            console.log(`Proof: ${proof}`);
        }
    });

    console.log("Listening for OrderClosed events...");
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
