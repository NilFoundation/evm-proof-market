// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementLibrary } from "../libraries/statement_lib.sol";
import { OrderLibrary } from "../libraries/order_lib.sol";
import { Tools } from "../libraries/tools.sol";

interface IProofMarketEndpoint {
    event OrderCreated(uint256 indexed id, OrderLibrary.OrderInput orderInput, address buyer);
    event OrderProcessing(uint256 id, address producer);
    event OrderClosed(uint256 indexed id, address producer, uint256 finalPrice, bytes32 proofHash);
    // TODO: emit structs properly
    event StatementAdded(uint256 id, StatementLibrary.Definition definition);
    event StatementDefinitionUpdated(uint256 id, StatementLibrary.Definition definition);
    event StatementPriceUpdated(uint256 id, StatementLibrary.Price price);
    event StatementRemoved(uint256 id);
    event StatementVerifiersUpdated(uint256 id, address[] verifiers);

    function grantRelayer(address relayer) external;
    function revokeRelayer(address relayer) external;

    function getOrder(uint256 orderId) external view returns (OrderLibrary.Order memory);
    function createOrder(OrderLibrary.OrderInput memory orderInput) external returns (uint256);
    function setProducer(uint256 orderId, address producer) external;
    function closeOrder(uint256 orderId, bytes[] calldata proofs, uint256 finalPrice) external;

    function getStatement(uint256 id) external view returns (StatementLibrary.StatementData memory);
    function addStatement(StatementLibrary.StatementInput memory statementInput) external;
    function updateStatementDefinition(uint256 id, StatementLibrary.Definition memory definition) external;
    function updateStatementPrice(uint256 id, StatementLibrary.Price memory price) external;
    function updateStatementVerifiers(uint256 id, address[] calldata verifiers) external;
    function removeStatement(uint256 id) external;
}
