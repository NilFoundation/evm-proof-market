
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

function getVerifierParamsAccount() {
    let account_path_params = loadParamsFromFile(path.resolve(__dirname, './data/mina_account/verifier_params_account.json'));

    account_path_params['proof'] = fs.readFileSync(path.resolve(__dirname, "./data/mina_account/proof_account.bin"), 'utf8');
    account_path_params['public_inputs'] = [];

    return account_path_params;
}

function prepareBaseProofPublicInputs(kimchi, kimchi_const){
    let kimchi_proof = kimchi.data.bestChain[0].protocolStateProof.json.proof;

    let public_input = [];
    let evalRounds = 10;
    let maxPolySize = 1 << evalRounds;   


    for(i in kimchi_proof.messages.w_comm){
        for(j in kimchi_proof.messages.w_comm[i]){
            public_input.push(BigInt(kimchi_proof.messages.w_comm[i][j][0]));
            public_input.push(BigInt(kimchi_proof.messages.w_comm[i][j][1]));
        }
    }
    for(i in kimchi_proof.messages.z_comm){
        public_input.push(BigInt(kimchi_proof.messages.z_comm[i][0]));
        public_input.push(BigInt(kimchi_proof.messages.z_comm[i][1]));
        break; // TODO: ask, is it right?
    }
    for(i in kimchi_proof.messages.t_comm){
        public_input.push(BigInt(kimchi_proof.messages.t_comm[i][0]));
        public_input.push(BigInt(kimchi_proof.messages.t_comm[i][1]));
        break; //TODO: ask, is it right?
    }
    // TODO: Test it.
    if(kimchi_proof.messages.lookup){
        for(i in kimchi_proof.messages.lookup.sorted){
            for(j in kimchi_proof.messages.lookup.sorted[i]){
                public_input.push(BigInt(kimchi_proof.messages.lookup.sorted[i][j][0]));
                public_input.push(BigInt(kimchi_proof.messages.lookup.sorted[i][j][1]));
            }
        }
        for(i in kimchi_proof.messages.lookup.aggreg){
            public_input.push(BigInt(kimchi_proof.messages.lookup.aggreg[i][0]));
            public_input.push(BigInt(kimchi_proof.messages.lookup.aggreg[i][1]));
        }
        for(i in kimchi_proof.messages.lookup.runtime){
            public_input.push(BigInt(kimchi_proof.messages.lookup.runtime[i][0]));
            public_input.push(BigInt(kimchi_proof.messages.lookup.runtime[i][1]));
        }
    }
    // TODO: Check it. In mina-state-proof it was loop for( i = 0; i < circuit_proof.comm.table.parts.size(); i++)
    for(i in kimchi_proof.messages.z_comm){
        public_input.push(BigInt(kimchi_proof.messages.z_comm[i][0]));
        public_input.push(BigInt(kimchi_proof.messages.z_comm[i][1]));
    }
    let lrlen = kimchi_proof.openings.proof.lr.length > evalRounds ? evalRounds : kimchi_proof.openings.proof.lr.length;
    for( i = 0; i < lrlen; i++){
        public_input.push(BigInt(kimchi_proof.openings.proof.lr[i][0][0]));
        public_input.push(BigInt(kimchi_proof.openings.proof.lr[i][0][1]));

        public_input.push(BigInt(kimchi_proof.openings.proof.lr[i][1][0]));
        public_input.push(BigInt(kimchi_proof.openings.proof.lr[i][1][1]));
    }
    public_input.push(BigInt(kimchi_proof.openings.proof.delta[0]));
    public_input.push(BigInt(kimchi_proof.openings.proof.delta[1]));

    public_input.push(BigInt(kimchi_proof.openings.proof.challenge_polynomial_commitment[0]));
    public_input.push(BigInt(kimchi_proof.openings.proof.challenge_polynomial_commitment[1]));

    for( i = 0; i < 30; i++){
        public_input.push(BigInt(3));
    }
    // TODO process batched_proofs.

    for(i in kimchi.data.blockchainVerificationKey.commitments.sigma_comm){
        public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.sigma_comm[i][0]));
        public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.sigma_comm[i][1]));
    }
    for(i in kimchi.data.blockchainVerificationKey.commitments.coefficients_comm){
        public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.coefficients_comm[i][0]));
        public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.coefficients_comm[i][1]));
    }
    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.generic_comm[0]));
    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.generic_comm[1]));

    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.psm_comm[0]));
    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.psm_comm[1]));

    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.complete_add_comm[0]));
    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.complete_add_comm[1]));

    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.mul_comm[0]));
    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.mul_comm[1]));

    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.emul_comm[0]));
    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.emul_comm[1]));

    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.endomul_scalar_comm[0]));
    public_input.push(BigInt(kimchi.data.blockchainVerificationKey.commitments.endomul_scalar_comm[1]));

    // chacha_comm nul in example.
    // range_check_comm not found too.
    // 
    let point = [
        BigInt(kimchi.data.blockchainVerificationKey.commitments.sigma_comm[0][0]), 
        BigInt(kimchi.data.blockchainVerificationKey.commitments.sigma_comm[0][1])
    ];

//      Push point to public input.
//        Selector size 0
//        Lookup selector size 0
//        Lookup table size 0
//        Runtime table selector 1
    public_input.push(point[0]);
    public_input.push(point[1]);
//        One more time
    public_input.push(point[0]);
    public_input.push(point[1]);

    for(i = 0; i < maxPolySize; i++){
        public_input.push(point[0]);
        public_input.push(point[1]);
    }
        
    return public_input;
}

function prepareScalarProofPublicInputs(kimchi, kimchi_const){
    let kimchi_proof = kimchi.data.bestChain[0].protocolStateProof.json.proof;
    let public_input = [];
    public_input.push(BigInt(0));

    for( ev in [0,1]){
        for(i in kimchi_proof.openings.evals.w){
            public_input.push(BigInt(kimchi_proof.openings.evals.w[i][ev][0]));
        }

        public_input.push(BigInt(kimchi_proof.openings.evals.z[ev][0]));
        for(i in kimchi_proof.openings.evals.s){
            public_input.push(BigInt(kimchi_proof.openings.evals.s[i][ev][0]));
        }
        // TODO: add lookup processing
        public_input.push(BigInt(kimchi_proof.openings.evals.generic_selector[ev][0]));
        public_input.push(BigInt(kimchi_proof.openings.evals.poseidon_selector[ev][0]));
    }

    public_input.push(BigInt(2));
    public_input.push(BigInt(kimchi_proof.openings.ft_eval1));

    public_input.push(BigInt(2));
    public_input.push(BigInt(2));

    public_input.push(BigInt(0));
    public_input.push(BigInt(0));
    public_input.push(BigInt(0));
    public_input.push(BigInt(0));
    public_input.push(BigInt(0));
    public_input.push(BigInt(0));
    public_input.push(BigInt(0));

    public_input.push(BigInt(kimchi_const.verify_index.w));
    return public_input;
}

function getVerifierParamsState(baseParamsFile, scalarParamsFile) {
    let params = {}
    params['init_params'] = [[26048, 22920], [], []];
    params['columns_rotations'] = [[], []]
    
    // For proof 1
    let base_params = loadParamsFromFile(baseParamsFile);
    params['init_params'][1] = base_params.init_params;
    params['columns_rotations'][0] = base_params.columns_rotations;

    // For proof 2
    let scalar_params = loadParamsFromFile(scalarParamsFile);
    params['init_params'][2] = scalar_params.init_params;
    params['columns_rotations'][1] = scalar_params.columns_rotations;
    return params;
}

module.exports = {
    getVerifierParams,
    getVerifierParamsAccount,
    loadParamsFromFile,
    loadPublicInput,
    getVerifierParamsState,
}