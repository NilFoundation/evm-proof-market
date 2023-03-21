// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./structs.sol";

contract StatementContract {

    mapping(uint256 => Statement) public statements;

    constructor() {
        // TODO: Initialize statements
    }
}