const { ethers, upgrades } = require("hardhat");
const {deployments, getNamedAccounts} = require('hardhat');

module.exports = async function() {
    // const {deployer, tokenOwner, user, producer, relayer} = await getNamedAccounts();
    // const { deployProxy } = upgrades;

    // console.log("tokenOwner: ", tokenOwner);

    // await deployments.deploy('MockTocken', {
    //     from: tokenOwner,
    //     args: [],
    //     log: true,
    // });

    // let token = await ethers.getContract('MockTocken');
    // console.log("Token address: ", token.address);

    // const ProofMarketEndpoint = await ethers.getContractFactory('ProofMarketEndpoint');
    // const proofMarket = await deployProxy(ProofMarketEndpoint, [token.address]);
    // await proofMarket.deployed();


    // console.log("ProofMarketEndpoint address: ", proofMarket.address);

    // await proofMarket.grantRole(ethers.utils.id('RELAYER_ROLE'), relayer);
    // // Mint some tokens to the user
    // const initialBalance = ethers.utils.parseUnits("1000", 18);
    // await token.mint(user, initialBalance);
    // // Approve the contract to spend the user's tokens
    // const TokenAsUser = token.connect(ethers.provider.getSigner(user));
    // await TokenAsUser.approve(proofMarket.address, initialBalance);
}

module.exports.tags = ['proofMarketEndpointFixture']
