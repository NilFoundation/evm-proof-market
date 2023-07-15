// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library StatementLibrary {

    enum StatementStatus {ACTIVE, INACTIVE}

    struct StatementData {
        uint256 id;
        StatementStatus status;
        Definition definition;
        Price price;
        address developer;
        address[] verifiers;
    }

    struct StatementInput {
        uint256 id;
        Definition definition;
        Price price;
        address developer;
        address[] verifiers;
    }

    struct Price {
        uint256[][] orderBook;
    }

    struct Definition {
        bytes verificationKey;
        bytes provingKey;
    }

    struct StatementStorage {
        mapping(uint256 => StatementData) statements;
        uint256[31] __gap;
    }

    function add(StatementStorage storage self, StatementInput memory statementInput)
        internal
        returns (uint256)
    {
        require(!exists(self, statementInput.id), "Statement ID already exists");

        self.statements[statementInput.id] = StatementData({
            id: statementInput.id,
            status: StatementStatus.ACTIVE,
            definition: statementInput.definition,
            price: statementInput.price,
            developer: statementInput.developer,
            verifiers: statementInput.verifiers
        });

        return statementInput.id;
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

    function update(StatementStorage storage self, uint256 id, address[] memory verifiers)
        internal
    {
        StatementData storage statement = get(self, id);
        statement.verifiers = verifiers;
    }

    function remove(StatementStorage storage self, uint256 id)
        internal
    {
        require(exists(self, id), "Statement not found");
        self.statements[id].status = StatementStatus.INACTIVE;
    }

    function exists(StatementStorage storage self, uint256 id)
        internal
        view
        returns (bool) 
    {
        return self.statements[id].id == id;
    }

    function isActive(StatementStorage storage self, uint256 id)
        internal
        view
        returns (bool) 
    {
        return exists(self, id) && self.statements[id].status == StatementStatus.ACTIVE;
    }
}
