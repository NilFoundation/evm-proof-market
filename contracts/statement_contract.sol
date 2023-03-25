// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementLibrary } from "./libraries/statement_lib.sol";

contract StatementContract {
    using StatementLibrary for StatementLibrary.StatementStorage;

    StatementLibrary.StatementStorage private statementStorage;
    address public owner;

    event StatementCreated(uint256 indexed id, bytes32 definition, uint256 price);
    event StatementPriceUpdated(uint256 indexed id, uint256 price);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    function createStatement(bytes32 definition, uint256 price) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        uint256 id = statementStorage.createStatement(definition, price);
        emit StatementCreated(id, definition, price);
        return id;
    }

    function getStatement(uint256 id) 
        public 
        view 
        returns (StatementLibrary.StatementData memory) 
    {
        return statementStorage.getStatement(id);
    }

    function updateStatementPrice(uint256 id, uint256 price) 
        public 
        onlyOwner 
    {
        statementStorage.updateStatementPrice(id, price);
        emit StatementPriceUpdated(id, price);
    }
}
