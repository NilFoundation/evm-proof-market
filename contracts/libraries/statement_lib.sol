// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library StatementLibrary {

    struct StatementData {
        uint256 id;
        Definition definition;
        Price price;
        address developer;
    }

    struct StatementInput {
        Definition definition;
        Price price;
        address developer;
    }

    struct StatementStorage {
        mapping(uint256 => StatementData) statements;
        uint256 statementCounter;
    }

    struct Price {
        uint256 price;
    }

    struct Definition {
        bytes verificationKey;
        bytes provingKey;
    }

    function add(StatementStorage storage self, StatementInput memory statementInput)
        internal
        returns (uint256)
    {
        self.statementCounter++;

        self.statements[self.statementCounter] = StatementData({
            id: self.statementCounter,
            definition: statementInput.definition,
            price: statementInput.price,
            developer: statementInput.developer
        });

        return self.statementCounter;
    }

    function get(StatementStorage storage self, uint256 id)
        internal
        view
        returns (StatementData storage)
    {
        require(exists(self, id), "Statement not found");
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
        require(exists(self, id), "Statement not found");
        delete self.statements[id];
    }

    function exists(StatementStorage storage self, uint256 id)
        internal
        view
        returns (bool) 
    {
        return id > 0 && id <= self.statementCounter;
    }

    function exists(StatementStorage storage self, Definition memory definition)
        internal
        view
        returns (bool) 
    {
        for (uint256 i = 1; i <= self.statementCounter; i++) {
            if (keccak256(self.statements[i].definition.verificationKey) == keccak256(definition.verificationKey) &&
                keccak256(self.statements[i].definition.provingKey) == keccak256(definition.provingKey)) {
                return true;
            }
        }
        return false;
    }
}
