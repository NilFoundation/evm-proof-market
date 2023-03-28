// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementLibrary, StatementStorage, StatementData, Price } from "./libraries/statement_lib.sol";

contract StatementContract {
    using StatementLibrary for StatementStorage;

    StatementStorage private statementStorage;
    address public authorizedCaller;

    constructor(address _authorizedCaller) {
        authorizedCaller = _authorizedCaller;
    }

    modifier onlyAuthorizedCaller() {
        require(msg.sender == authorizedCaller, "Caller is not authorized");
        _;
    }

    function add(bytes32 definition, Price memory price) 
        public 
        onlyAuthorizedCaller 
        returns (uint256) 
    {
        uint256 id = statementStorage.add(definition, price);
        return id;
    }

    function get(uint256 id) 
        public 
        view 
        returns (StatementData memory) 
    {
        return statementStorage.get(id);
    }

    function update(uint256 id, Price memory price) 
        public 
        onlyAuthorizedCaller 
    {
        statementStorage.update(id, price);
    }

    function update(uint256 id, bytes32 definition) 
        public 
        onlyAuthorizedCaller 
    {
        statementStorage.update(id, definition);
    }

    function remove(uint256 id) 
        public 
        onlyAuthorizedCaller 
    {
        // TODO: delete all orders related to this statement
        // or just do not allow to submit new orders for this statement
        statementStorage.remove(id);
    }
}
