// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./structs.sol";

contract StatementContract {

    mapping(uint256 => Statement) public statements;
    uint256 public nextStatementId;

    constructor() {
        nextStatementId = 1;
    }

    function getStatement(uint256 statementId) public view returns (Statement memory) {
        return statements[statementId];
    }

    function addStatement(bytes32 definition) public {
        statements[nextStatementId] = Statement({
            id: nextStatementId,
            definition: definition,
            price: 0
        });
        nextStatementId++;
    }

    function updateStatementPrice(uint256 statementId, uint256 price) public {
        require(statements[statementId].id == statementId, "Statement not found");
        statements[statementId].price = price;
    }
}