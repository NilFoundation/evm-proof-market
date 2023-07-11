// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../interfaces/custom_verifier.sol';
import '@nilfoundation/evm-placeholder-verification/contracts/interfaces/verifier.sol';
import '@nilfoundation/evm-placeholder-verification/contracts/verifier.sol';


library Tools {
    function verifyProof(
        uint256 orderId,
        uint256[] memory public_input,
        bytes calldata blob,
        address verifier
    )
        internal
        view
        returns (bool)
    {
        ICustomVerifier v = ICustomVerifier(verifier);
        return v.verify(
            blob,
            public_input
        );
    }

    function hashProof(bytes calldata blob)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(blob)
        );
    }

    function hashProofs(bytes32[] memory blobs)
        internal
        pure
        returns (bytes32)
    {
        bytes32 totalHash = keccak256(abi.encode(blobs[0]));
        for (uint256 i = 1; i < blobs.length; i++) {
            totalHash = keccak256(abi.encode(totalHash, blobs[i]));
        }
        return totalHash;        
    }
}
