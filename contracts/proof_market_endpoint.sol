// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementContract } from "./statement_contract.sol";
import { StatementLibrary, StatementData, Price, Definition } from "./libraries/statement_lib.sol";
import { OrderContract } from "./order_contract.sol";
import { OrderLibrary, Order, OrderStatus } from "./libraries/order_lib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract ProofMarketEndpoint is AccessControl {
    IERC20 public token;
    StatementContract public statementContract;
    OrderContract public orderContract;

    bytes32 public constant OWNER_ROLE = AccessControl.DEFAULT_ADMIN_ROLE;
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    event OrderCreated(uint256 indexed id, uint256 statementId, bytes input, uint256 price, address buyer);
    event OrderClosed(uint256 indexed id, address producer, uint256 finalPrice, bytes proof);
    // TODO: emit structs properly
    event StatementAdded(uint256 id, Definition definition);
    event StatementDefinitionUpdated(uint256 id, Definition definition);
    event StatementPriceUpdated(uint256 id, Price price);
    event StatementRemoved(uint256 id);

    constructor(IERC20 _token) {
        _setupRole(OWNER_ROLE, msg.sender);
        token = _token;
        statementContract = new StatementContract(address(this));
        orderContract = new OrderContract(address(this), address(token));
    }

    //////////////////////////////
    // Access control
    //////////////////////////////

    function grantRelayer(address relayer)
        public
        onlyRole(OWNER_ROLE)
    {
        grantRole(RELAYER_ROLE, relayer);
    }

    function revokeRelayer(address relayer)
        public
        onlyRole(OWNER_ROLE)
    {
        revokeRole(RELAYER_ROLE, relayer);
    }


    //////////////////////////////
    // Orders API
    //////////////////////////////

    function getOrder(uint256 orderId) public view returns (Order memory) {
        return orderContract.get(orderId);
    }

    function createOrder(uint256 statementId, bytes memory input, uint256 price)
        public
        returns (uint256)
    {
        uint256 id = orderContract.create(statementId, input, price, msg.sender);
        emit OrderCreated(id, statementId, input, price, msg.sender);
        return id;
    }

    function closeOrder(uint256 orderId, bytes memory proof, uint256 finalPrice, address producer)
        public
        onlyRole(RELAYER_ROLE)
    {
        orderContract.close(orderId, proof, finalPrice, producer);
        emit OrderClosed(orderId, producer, finalPrice, proof);
    }

    //////////////////////////////
    // Statements API
    //////////////////////////////

    function getStatement(uint256 id) public view returns (StatementData memory) {
        return statementContract.get(id);
    }

    function addStatement(Definition memory definition, Price memory price)
        public
        onlyRole(RELAYER_ROLE)
    {
        uint256 id = statementContract.add(definition, price);
        emit StatementAdded(id, definition);
    }

    function updateStatementDefinition(uint256 id, Definition memory definition)
        public
        onlyRole(RELAYER_ROLE)
    {
        statementContract.update(id, definition);
        emit StatementDefinitionUpdated(id, definition);
    }

    function updateStatementPrice(uint256 id, Price memory price)
        public
        onlyRole(RELAYER_ROLE)
    {
        statementContract.update(id, price);
        emit StatementPriceUpdated(id, price);
    }

    function removeStatement(uint256 id)
        public
        onlyRole(OWNER_ROLE)
    {
        statementContract.remove(id);
        emit StatementRemoved(id);
    }
}
