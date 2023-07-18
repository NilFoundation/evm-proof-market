const path = require('path');
const hre = require('hardhat')
const { getVerifierParamsState } = require("../test/utils.js");
const {deployments, getNamedAccounts} = hre;
const {deploy} = deployments;

module.exports = async function () {
    const {deployer} = await getNamedAccounts();

    let libs = [
        "mina_base_gate0",
        "mina_base_gate3",
        "mina_base_gate5",
        "mina_base_gate7",
        "mina_base_gate9",
        "mina_base_gate11",
        "mina_base_gate15_0",
        "mina_base_gate15_1",
        "mina_base_gate16_0",
        "mina_base_gate16_1"
    ]

    let deployedLib = {}
    for (let lib of libs) {
        await deploy(lib, {
            from: deployer,
            log: true,
        });
        deployedLib[lib] = (await hre.deployments.get(lib)).address
    }

    await deploy('mina_base_gate_argument_split_gen', {
        from: deployer,
        libraries: deployedLib,
        log: true,
    });

    libs = [
        "mina_scalar_gate0",
        "mina_scalar_gate3",
        "mina_scalar_gate8",
        "mina_scalar_gate10",
        "mina_scalar_gate12",
        "mina_scalar_gate14",
        "mina_scalar_gate16",
        "mina_scalar_gate18",
    ]

    deployedLib = {}
    for (let lib of libs) {
        await deploy(lib, {
            from: deployer,
            log: true,
        });
        deployedLib[lib] = (await hre.deployments.get(lib)).address
    }

    await deploy('mina_scalar_gate_argument_split_gen', {
        from: deployer,
        libraries: deployedLib,
        log: true,
    });

    libs = [
        "placeholder_verifier"
    ]
    deployedLib = {}
    for (let lib of libs) {
        await deploy(lib, {
            from: deployer,
            log: true,
        });
        deployedLib[lib] = (await hre.deployments.get(lib)).address
    }

    await deploy('PlaceholderVerifier', {
        from: deployer,
        libraries: deployedLib,
        log: true,
    });

    verifier_address = (await hre.deployments.get('PlaceholderVerifier')).address;
    mina_base_split_gen_address = (await hre.deployments.get('mina_base_gate_argument_split_gen')).address;
    mina_scalar_split_gen_address = (await hre.deployments.get('mina_scalar_gate_argument_split_gen')).address;

    const baseParamsFile = path.resolve(__dirname, "../test/data/mina_state/verifier_params_state_base.json");
    const scalarParamsFile = path.resolve(__dirname, "../test/data/mina_state/verifier_params_state_scalar.json");
    let params = getVerifierParamsState(baseParamsFile, scalarParamsFile);

    await deploy('MinaStateVerifier',{
        from:deployer,
        args:[
            verifier_address,
            mina_base_split_gen_address,
            mina_scalar_split_gen_address,
            params.init_params,
            params.columns_rotations
        ],
        log:true
    })
}

module.exports.tags = ['minaStateProofVerifierFixture']
