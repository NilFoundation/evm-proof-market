
const fs = require("fs");
const path = require("path");
const losslessJSON = require("lossless-json")

function loadParamsFromFile(jsonFile) {
    const named_params = losslessJSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    let params = {};
    params.init_params = [];
    params.init_params.push(BigInt(named_params.modulus.value));
    params.init_params.push(BigInt(named_params.r.value));
    params.init_params.push(BigInt(named_params.max_degree.value));
    params.init_params.push(BigInt(named_params.lambda.value));
    params.init_params.push(BigInt(named_params.rows_amount.value));
    params.init_params.push(BigInt(named_params.omega.value));
    params.init_params.push(BigInt(named_params.D_omegas.length));
    for (let i in named_params.D_omegas) {
        params.init_params.push(BigInt(named_params.D_omegas[i].value))
    }
    params.init_params.push(named_params.step_list.length);
    for (let i in named_params.step_list) {
        params.init_params.push(BigInt(named_params.step_list[i].value))
    }
    params.init_params.push(named_params.arithmetization_params.length);
    for (let i in named_params.arithmetization_params) {
        params.init_params.push(BigInt(named_params.arithmetization_params[i].value))
    }

    params.columns_rotations = [];
    for (let i in named_params.columns_rotations) {
        let r = []
        for (let j in named_params.columns_rotations[i]) {
            r.push(BigInt(named_params.columns_rotations[i][j].value));
        }
        params.columns_rotations.push(r);
    }
    return params;
}

function loadPublicInput(public_input_path){
    if(fs.existsSync(public_input_path)){
        return losslessJSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    } else 
        return [];
}

function getVerifierParams(configPath, proofPath, publicInputPath) {
    let public_input = loadPublicInput(path.resolve(__dirname, publicInputPath));
    let params = loadParamsFromFile(path.resolve(__dirname, configPath));
    params['proof'] = fs.readFileSync(path.resolve(__dirname, proofPath), 'utf8');
    params['public_input'] = public_input;
    return params
}

module.exports = {
    getVerifierParams,
    loadParamsFromFile,
    loadPublicInput,
}