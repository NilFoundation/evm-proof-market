const hre = require('hardhat');
const { ethers } = require("hardhat");
const {deployments, getNamedAccounts} = hre;
const {deploy} = deployments;
const { getVerifierParams, getVerifierParamsAccount, getVerifierParamsState } = require("../test/utils.js");

module.exports = async function() {
    const {deployer} = await getNamedAccounts();
    
    let libs = [
        "ProofVerifier",
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

    await deploy('UnifiedAdditionGate', {
        from: deployer,
        log : true,
    })
    let unifiedAdditionGate = await ethers.getContract('UnifiedAdditionGate');

    let configPath = "../test/data/unified_addition/lambda2.json"
    let proofPath = "../test/data/unified_addition/lambda2.data"
    let publicInputPath = "../test/data/unified_addition/public_input.json";
    let params = getVerifierParams(configPath, proofPath, publicInputPath);

    await deploy('UnifiedAdditionVerifier', {
        from: deployer,
        args: [
            placeholderVerifier.address,
            unifiedAdditionGate.address,
            params.init_params,
            params.columns_rotations
        ],
        log : true,
    })
}

module.exports.tags = ['unifiedAdditionVerifierFixture']
