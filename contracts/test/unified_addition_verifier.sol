// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@nilfoundation/evm-placeholder-verification/contracts/interfaces/verifier.sol';
// import '@nilfoundation/evm-placeholder-verification/contracts/verifier.sol';


contract UnifiedAdditionVerifier is Ownable {

    address _verifier;
    address _gates;

    constructor(address verifier, address gates) {
        _verifier = verifier;
        _gates = gates;
    }

    function setVerifier(address verifier)
        external
        onlyOwner
    {
        _verifier = verifier;
    }

    function setGates(address gates)
        external
        onlyOwner
    {
        _gates = gates;
    }

    function verify(
        bytes calldata blob,
        uint256[] calldata init_params,
        int256[][] calldata columns_rotations,
        uint256[] calldata public_input
    )
        external 
        view 
        returns (bool)
    {
        IVerifier v = IVerifier(_verifier);
        return v.verify(blob, init_params, columns_rotations, public_input, _gates);
    }
}