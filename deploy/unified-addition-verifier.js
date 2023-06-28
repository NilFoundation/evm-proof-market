const hre = require('hardhat');
const { ethers } = require("hardhat");
const {deployments, getNamedAccounts} = hre;
const {deploy} = deployments;

module.exports = async function() {
    const {deployer} = await getNamedAccounts();
    
    let libs = [
        "placeholder_verifier",
    ]

    let deployedLib = {}
    for (let lib of libs){
        await deploy(lib, {
            from: deployer,
            log: true,
        });
        deployedLib[lib] = (await hre.deployments.get(lib)).address
    }

    await deploy('PlaceholderVerifier', {
        from: deployer,
        libraries : deployedLib,
        log : true,
    })
    let placeholderVerifier = await ethers.getContract('PlaceholderVerifier');

    libs = [
    ]

    deployedLib = {}
    for (let lib of libs){
        await deploy(lib, {
            from: deployer,
            log: true,
        });
        deployedLib[lib] = (await hre.deployments.get(lib)).address
    }

    await deploy('UnifiedAdditionGate', {
        from: deployer,
        libraries : deployedLib,
        log : true,
    })
    let unifiedAdditionGate = await ethers.getContract('UnifiedAdditionGate');

    await deploy('UnifiedAdditionVerifier', {
        from: deployer,
        args: [placeholderVerifier.address, unifiedAdditionGate.address],
        log : true,
    })
}

module.exports.tags = ['unifiedAdditionVerifierFixture']
