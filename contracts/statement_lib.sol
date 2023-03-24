// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library StatementLibrary {
    struct StatementData {
        uint256 id;
        bytes32 definition;
        uint256 price;
    }

    struct StatementStorage {
        mapping(uint256 => StatementData) statements;
        uint256 statementCounter;
    }

    function createStatement(StatementStorage storage self, bytes32 definition, uint256 price) 
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

    function updateStatementPrice(StatementStorage storage self, uint256 id, uint256 price) 
        internal 
    {
        StatementData storage statement = getStatement(self, id);
        statement.price = price;
    }
}
