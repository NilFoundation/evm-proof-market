// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@nilfoundation/evm-placeholder-verification/contracts/interfaces/verifier.sol';
import '@nilfoundation/evm-placeholder-verification/contracts/verifier.sol';
// TODO: delete the following import, it's only for compilation of unified_addition_gen.sol
import '@nilfoundation/evm-placeholder-verification/contracts/test/unified_addition/unified_addition_gen.sol';

library Tools {
    struct ProofData {
        bytes blob;
        uint256[] init_params;
        int256[][] columns_rotations;
        uint256[] public_input;
        address gate_argument;
    }

    function verifyProof(uint256 orderId, ProofData calldata proof, address verifier)
        internal
        view
        returns (bool)
    {
        // TODO: move gate_argument to StatementData
        IVerifier v = IVerifier(verifier);
        return true;
        // return v.verify(
        //     proof.blob,
        //     proof.init_params,
        //     proof.columns_rotations,
        //     proof.public_input,
        //     proof.gate_argument
        // );
    }

    function hashProof(uint256 orderId, ProofData calldata proof)
        internal
        pure
        returns (bytes32)
    {
        // return keccak256(abi.encode(orderId, proof.blob, proof.init_params, proof.columns_rotations));
        // for now, just return a constant
        return bytes32(0x1234567890123456789012345678901234567890123456789012345678901234);
    }
}
