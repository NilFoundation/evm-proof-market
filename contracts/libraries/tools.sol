// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../interfaces/custom_verifier.sol';
import '@nilfoundation/evm-placeholder-verification/contracts/interfaces/verifier.sol';
import '@nilfoundation/evm-placeholder-verification/contracts/verifier.sol';
// TODO: delete the following imports, it's only for compilation of the specified cotracts
import '@nilfoundation/evm-placeholder-verification/contracts/test/unified_addition/unified_addition_gen.sol';
import '@nilfoundation/evm-mina-state/contracts/account_proof/account_proof.sol';

library Tools {
    struct ProofData {
        bytes blob;
        uint256[] init_params;
        int256[][] columns_rotations;
        uint256[] public_input;
    }

    function verifyProof(uint256 orderId, ProofData calldata proof, address verifier)
        internal
        view
        returns (bool)
    {
        // TODO: move gate_argument to StatementData
        ICustomVerifier v = ICustomVerifier(verifier);
        return v.verify(
            proof.blob,
            proof.init_params,
            proof.columns_rotations,
            proof.public_input
        );
    }

    function hashProof(uint256 orderId, ProofData calldata proof)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(orderId, proof.blob, proof.init_params, proof.columns_rotations));
    }
}
