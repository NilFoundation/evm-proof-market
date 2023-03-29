// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct StatementData {
    uint256 id;
    Definition definition;
    Price price;
}

struct StatementStorage {
    mapping(uint256 => StatementData) statements;
    uint256 statementCounter;
}

struct Price {
    uint256 price;
}

struct Definition {
    bytes32 verificationKey;
    bytes32 provingKey;
}

library StatementLibrary {

    function add(StatementStorage storage self, Definition memory definition, Price memory price) 
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

    function get(StatementStorage storage self, uint256 id) 
        internal 
        view 
        returns (StatementData storage) 
    {
        require(id > 0 && id <= self.statementCounter, "Statement not found");
        return self.statements[id];
    }

    function update(StatementStorage storage self, uint256 id, Price memory price) 
        internal 
    {
        StatementData storage statement = get(self, id);
        statement.price = price;
    }

    function update(StatementStorage storage self, uint256 id, Definition memory definition) 
        internal 
    {
        StatementData storage statement = get(self, id);
        statement.definition = definition;
    }

    function remove(StatementStorage storage self, uint256 id) 
        internal 
    {
        require(id > 0 && id <= self.statementCounter, "Statement not found");
        delete self.statements[id];
    }
}
