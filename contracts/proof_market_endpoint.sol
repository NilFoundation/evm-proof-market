// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementContract } from "./statement_contract.sol";
import { StatementLibrary, StatementData, Price } from "./libraries/statement_lib.sol";
import { OrderContract } from "./order_contract.sol";
import { OrderLibrary, Order, OrderStatus } from "./libraries/order_lib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract ProofMarketEndpoint is AccessControl {
    IERC20 public token;
    StatementContract public statementContract;
    OrderContract public orderContract;

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    event OrderCreated(uint256 indexed id, uint256 statementId, bytes32 input, uint256 price, address buyer);
    event OrderClosed(uint256 indexed id, address producer, uint256 finalPrice, bytes32[] proof);
    // TODO: emit prices properly
    event StatementAdded(uint256 id, bytes32 definition);
    event StatementDefinitionUpdated(uint256 id, bytes32 definition);
    event StatementPriceUpdated(uint256 id, uint256 price);
    event StatementRemoved(uint256 id);

    constructor(IERC20 _token) {
        _setupRole(OWNER_ROLE, msg.sender);
        token = _token;
        statementContract = new StatementContract(address(this));
        orderContract = new OrderContract(address(this));
    }

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

    function getOrder(uint256 orderId) public view returns (Order memory) {
        return orderContract.get(orderId);
    }
    
    function createOrder(uint256 statementId, bytes32 input, uint256 price) 
        public 
        returns (uint256) 
    {
        require(token.transferFrom(msg.sender, address(this), price), "Token transfer failed");

        uint256 id = orderContract.create(statementId, input, price, msg.sender);
        emit OrderCreated(id, statementId, input, price, msg.sender);
        return id;
    }

    function closeOrder(uint256 orderId, bytes32[] memory proof, uint256 finalPrice, address producer) 
        public 
    {
        // require(
        //     hasRole(OWNER_ROLE, msg.sender) || hasRole(RELAYER_ROLE, msg.sender), 
        //     "Caller is not owner or relayer"
        // );
        Order memory order = orderContract.get(orderId);
        require(order.status == OrderStatus.OPEN, "Order is not open");
        require(finalPrice <= order.price, "Invalid final price");

        orderContract.close(orderId, producer, proof);
        // TODO: do both transfers in one transaction
        require(token.transfer(producer, finalPrice), "Token transfer to producer failed");
        uint256 remainingTokens = order.price - finalPrice;
        require(token.transfer(order.buyer, remainingTokens), "Token transfer to buyer failed");

        emit OrderClosed(orderId, producer, finalPrice, proof);
    }

    function getStatement(uint256 id) public view returns (StatementData memory) {
        return statementContract.get(id);
    }

    function addStatement(bytes32 definition, Price memory price) 
        public
        onlyRole(OWNER_ROLE)
    {
        uint256 id = statementContract.add(definition, price);
        emit StatementAdded(id, definition);
    }

    function updateStatementDefinition(uint256 id, bytes32 definition) 
        public 
        onlyRole(OWNER_ROLE)
    {
        statementContract.update(id, definition);
        emit StatementDefinitionUpdated(id, definition);
    }

    function updateStatementPrice(uint256 id, Price memory price) 
        public
    {
        require(
            hasRole(OWNER_ROLE, msg.sender) || hasRole(RELAYER_ROLE, msg.sender), 
            "Caller is not owner or relayer"
        );
        statementContract.update(id, price);
        emit StatementPriceUpdated(id, price.price);
    }

    function removeStatement(uint256 id) 
        public
        onlyRole(OWNER_ROLE)
    {
        statementContract.remove(id);
        emit StatementRemoved(id);
    }
}
