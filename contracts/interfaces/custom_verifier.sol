// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICustomVerifier  {
    function setVerifier(address verifier) external;
    function setGates(address gates) external;
    function verify(
        bytes calldata blob,
        uint256[] calldata init_params,
        int256[][] calldata columns_rotations,
        uint256[] calldata public_input
    ) external view returns (bool);
}