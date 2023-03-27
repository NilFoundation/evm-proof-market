// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementLibrary, StatementStorage, StatementData, Price } from "./libraries/statement_lib.sol";

contract StatementContract {
    using StatementLibrary for StatementStorage;

    StatementStorage private statementStorage;
    address public owner;

    // TODO: emit prices properly
    event StatementAdded(uint256 id, bytes32 definition, uint256 price);
    event StatementDefinitionUpdated(uint256 id, bytes32 definition);
    event StatementPriceUpdated(uint256 id, uint256 price);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    function addStatement(bytes32 definition, Price memory price) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        uint256 id = statementStorage.addStatement(definition, price);
        emit StatementAdded(id, definition, price.price);
        return id;
    }

    function getStatement(uint256 id) 
        public 
        view 
        returns (StatementData memory) 
    {
        return statementStorage.getStatement(id);
    }

    function updateStatement(uint256 id, Price memory price) 
        public 
        onlyOwner 
    {
        statementStorage.updateStatement(id, price);
        emit StatementPriceUpdated(id, price.price);
    }

    function updateStatement(uint256 id, bytes32 definition) 
        public 
        onlyOwner 
    {
        statementStorage.updateStatement(id, definition);
        emit StatementDefinitionUpdated(id, definition);
    }

    function deleteStatement(uint256 id) 
        public 
        onlyOwner 
    {
        // TODO: delete all orders related to this statement
        // or just do not allow to submit new orders for this statement
        statementStorage.deleteStatement(id);
    }
}
