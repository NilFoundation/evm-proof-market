const hre = require('hardhat')
const {deployments, getNamedAccounts} = hre;
const {deploy} = deployments;

module.exports = async function() {
    const {deployer, tokenOwner, user, producer, relayer} = await getNamedAccounts();

    await deploy('MockTocken', {
        from: tokenOwner,
        args: [],
        log: true,
    })
    let token = await ethers.getContract('MockTocken');
    await deployments.fixture(['placeholderVerifierFixture']);
    let placeholder_verifier = await ethers.getContract('PlaceholderVerifier');

    let libs = [
    ]
    let deployedLib = {}
    for (let lib of libs){
        await deploy(lib, {
            from: deployer,
            log: true,
        });
        deployedLib[lib] = (await hre.deployments.get(lib)).address
    }

    await deploy('ProofMarketEndpoint', {
        from: deployer,
        args: [token.address, placeholder_verifier.address],
        libraries : deployedLib,
        log : true,
    })
    // TODO: Set the roles and mint some tokens
}

module.exports.tags = ['proofMarketEndpointFixture']
