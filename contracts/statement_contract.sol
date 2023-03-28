// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementLibrary, StatementStorage, StatementData, Price } from "./libraries/statement_lib.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StatementContract is AccessControl {
    using StatementLibrary for StatementStorage;

    StatementStorage private statementStorage;
    bytes32 public constant AUTHORIZED_CALLER_ROLE = keccak256("AUTHORIZED_CALLER_ROLE");

    constructor(address _authorizedCaller) {
        _setupRole(AUTHORIZED_CALLER_ROLE, _authorizedCaller);
    }

    function add(bytes32 definition, Price memory price) 
        public 
        onlyRole(AUTHORIZED_CALLER_ROLE) 
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
        onlyRole(AUTHORIZED_CALLER_ROLE) 
    {
        statementStorage.update(id, price);
    }

    function update(uint256 id, bytes32 definition) 
        public 
        onlyRole(AUTHORIZED_CALLER_ROLE)  
    {
        statementStorage.update(id, definition);
    }

    function remove(uint256 id) 
        public 
        onlyRole(AUTHORIZED_CALLER_ROLE)
    {
        // TODO: delete all orders related to this statement
        // or just do not allow to submit new orders for this statement
        statementStorage.remove(id);
    }
}
