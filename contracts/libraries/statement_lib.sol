// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct StatementData {
    uint256 id;
    bytes32 definition;
    Price price;
}

struct StatementStorage {
    mapping(uint256 => StatementData) statements;
    uint256 statementCounter;
}

struct Price {
    uint256 price;
}

library StatementLibrary {

    function addStatement(StatementStorage storage self, bytes32 definition, Price memory price) 
        internal 
        returns (uint256) 
    {
        self.statementCounter++;

        self.statements[self.statementCounter] = StatementData({
            id: self.statementCounter,
            definition: definition,
            price: price
        });

        return self.statementCounter;
    }

    function getStatement(StatementStorage storage self, uint256 id) 
        internal 
        view 
        returns (StatementData storage) 
    {
        require(id > 0 && id <= self.statementCounter, "Statement not found");
        return self.statements[id];
    }

    function updateStatement(StatementStorage storage self, uint256 id, Price memory price) 
        internal 
    {
        StatementData storage statement = getStatement(self, id);
        statement.price = price;
    }

    function updateStatement(StatementStorage storage self, uint256 id, bytes32 definition) 
        internal 
    {
        StatementData storage statement = getStatement(self, id);
        statement.definition = definition;
    }

    function deleteStatement(StatementStorage storage self, uint256 id) 
        internal 
    {
        require(id > 0 && id <= self.statementCounter, "Statement not found");
        delete self.statements[id];
    }
}
