// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IProofMarketEndpoint } from "./interfaces/proof_market_endpoint.sol";
import { StatementContract } from "./statement_contract.sol";
import { StatementLibrary } from "./libraries/statement_lib.sol";
import { OrderContract } from "./order_contract.sol";
import { OrderLibrary } from "./libraries/order_lib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract ProofMarketEndpoint is AccessControl, IProofMarketEndpoint {
    IERC20 public token;
    StatementContract public statementContract;
    OrderContract public orderContract;

    bytes32 public constant OWNER_ROLE = AccessControl.DEFAULT_ADMIN_ROLE;
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    constructor(IERC20 _token) {
        _setupRole(OWNER_ROLE, msg.sender);
        token = _token;
        statementContract = new StatementContract(address(this));
        orderContract = new OrderContract(address(this), address(token));
    }

    //////////////////////////////
    // Modifiers
    //////////////////////////////

    modifier statementMustExist(uint256 statementId) {
        require(statementContract.exists(statementId), "Statement does not exist");
        _;
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

    function getOrder(uint256 orderId) public view returns (OrderLibrary.Order memory) {
        return orderContract.get(orderId);
    }

    function createOrder(OrderLibrary.OrderInput memory orderInput)
        public
        statementMustExist(orderInput.statementId)
        returns (uint256)
    {
        uint256 id = orderContract.create(orderInput, msg.sender);
        emit OrderCreated(id, orderInput, msg.sender);
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

    function getStatement(uint256 id) public view returns (StatementLibrary.StatementData memory) {
        return statementContract.get(id);
    }

    function addStatement(StatementLibrary.StatementInput memory statementInput)
        public
        onlyRole(RELAYER_ROLE)
    {
        uint256 id = statementContract.add(statementInput);
        emit StatementAdded(id, statementInput.definition);
    }

    function updateStatementDefinition(uint256 id, StatementLibrary.Definition memory definition)
        public
        onlyRole(RELAYER_ROLE)
    {
        statementContract.update(id, definition);
        emit StatementDefinitionUpdated(id, definition);
    }

    function updateStatementPrice(uint256 id, StatementLibrary.Price memory price)
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
