// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IProofMarketEndpoint } from "./interfaces/proof_market_endpoint.sol";
import { StatementLibrary } from "./libraries/statement_lib.sol";
import { OrderLibrary } from "./libraries/order_lib.sol";
import { Tools } from "./libraries/tools.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";


contract ProofMarketEndpoint is Initializable, AccessControlUpgradeable, IProofMarketEndpoint {

    using OrderLibrary for OrderLibrary.OrderStorage;
    using StatementLibrary for StatementLibrary.StatementStorage;

    bytes32 public constant OWNER_ROLE = AccessControlUpgradeable.DEFAULT_ADMIN_ROLE;
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    //////////////////////////////
    // Storage
    //////////////////////////////

    IERC20 public token;
    OrderLibrary.OrderStorage private orderStorage;
    StatementLibrary.StatementStorage private statementStorage;
    // Add more storage slots here

    //////////////////////////////
    // Constructor
    //////////////////////////////

    function initialize(IERC20 _token) public initializer {
        __AccessControl_init();
        _setupRole(OWNER_ROLE, msg.sender);
        token = _token;
    }

    //////////////////////////////
    // Modifiers
    //////////////////////////////

    modifier statementMustExist(uint256 statementId) {
        require(statementStorage.exists(statementId), "Statement does not exist");
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
        return orderStorage.get(orderId);
    }

    function createOrder(OrderLibrary.OrderInput memory orderInput)
        public
        statementMustExist(orderInput.statementId)
        returns (uint256)
    {
        uint256 id = orderStorage.create(orderInput, msg.sender);
        require(token.transferFrom(msg.sender, address(this), orderInput.price), "Transfer failed");
        emit OrderCreated(id, orderInput, msg.sender);
        return id;
    }

    function closeOrder(uint256 orderId, bytes memory proof, uint256 finalPrice, address producer)
        public
        onlyRole(RELAYER_ROLE)
    {
        OrderLibrary.Order memory order = getOrder(orderId);
        orderStorage.close(orderId, producer, finalPrice, proof);

        require(Tools.verifyProof(orderId, proof), "Proof is not valid");

        require(token.transfer(producer, finalPrice), "Token transfer to producer failed");
        uint256 remainingTokens = order.price - finalPrice;
        require(token.transfer(order.buyer, remainingTokens), "Token transfer to buyer failed");
        
        emit OrderClosed(orderId, producer, finalPrice, proof);
    }

    //////////////////////////////
    // Statements API
    //////////////////////////////

    function getStatement(uint256 id) public view returns (StatementLibrary.StatementData memory) {
        return statementStorage.get(id);
    }

    function addStatement(StatementLibrary.StatementInput memory statementInput)
        public
        onlyRole(RELAYER_ROLE)
    {
        uint256 id = statementStorage.add(statementInput);
        emit StatementAdded(id, statementInput.definition);
    }

    function updateStatementDefinition(uint256 id, StatementLibrary.Definition memory definition)
        public
        onlyRole(RELAYER_ROLE)
    {
        statementStorage.update(id, definition);
        emit StatementDefinitionUpdated(id, definition);
    }

    function updateStatementPrice(uint256 id, StatementLibrary.Price memory price)
        public
        onlyRole(RELAYER_ROLE)
    {
        statementStorage.update(id, price);
        emit StatementPriceUpdated(id, price);
    }

    function removeStatement(uint256 id)
        public
        onlyRole(OWNER_ROLE)
    {
        statementStorage.remove(id);
        emit StatementRemoved(id);
    }
}
