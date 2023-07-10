// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICustomVerifier  {
    function verify(
        bytes calldata blob,
        uint256[] calldata public_input
    ) external view returns (bool);
}