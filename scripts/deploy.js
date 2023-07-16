const { deployProofMarketFixture } = require('../test/fixtures');
const fs = require('fs');

async function main() {
    const { proofMarket, token, owner, user, producer, relayer } = await deployProofMarketFixture();

    console.log('MockToken deployed to:', token.address);
    console.log('ProofMarketEndpoint deployed to:', proofMarket.address);
    console.log('Owner:', owner.address);
    console.log('User:', user.address);
    console.log('Producer:', producer.address);
    console.log('Relayer:', relayer.address);

    const addresses = {
        token: token.address,
        proofMarket: proofMarket.address,
    };
    fs.writeFileSync('deployed_addresses.json', JSON.stringify(addresses, null, 2));
}
    
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
