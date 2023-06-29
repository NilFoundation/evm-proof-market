const hre = require('hardhat')
const {deployments, getNamedAccounts} = hre;
const {deploy} = deployments;
const { getVerifierParams, getVerifierParamsAccount, getVerifierParamsState } = require("../test/utils.js");

module.exports = async function() {
    const {deployer} = await getNamedAccounts();

    libs = [
        "account_gate0",
        "account_gate1",
        "account_gate2",
        "account_gate3",
        "account_gate4",
        "account_gate5",
        "account_gate6",
        "account_gate7",
        "account_gate8",
        "account_gate9",
        "account_gate10",
    ]
    deployedLib = {}
    for (let lib of libs) {
        await deploy(lib, {
            from: deployer,
            log: true,
        });
        deployedLib[lib] = (await hre.deployments.get(lib)).address
    }

    await deploy('account_proof_split_gen', {
        from: deployer,
        libraries: deployedLib,
        log: true,
    });
    let account_split_gen_address = (await hre.deployments.get('account_proof_split_gen')).address

    await deployments.fixture(['placeholderVerifierFixture']);
    let placeholderVerifier = await ethers.getContract('PlaceholderVerifier');

    let params = getVerifierParamsAccount();
    await deploy('AccountPathVerifier',{
        from:deployer,
        args:[
            placeholderVerifier.address,
            account_split_gen_address,
            params.init_params,
            params.columns_rotations,
        ],
        log:true
    })
}

module.exports.tags = ['minaAccountProofVerifierFixture']
