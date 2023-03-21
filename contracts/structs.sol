// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Statement {
    uint256 id;
    bytes32 definition;
    uint256 price;
    uint256 createdOn;
    uint256 updatedOn;
}

enum OrderStatus {OPEN, CLOSED}

struct Order {
    uint256 id;
    uint256 statementId;
    bytes32 input;
    uint256 price;
    uint256 createdOn;
    uint256 updatedOn;
    address buyer;
    OrderStatus status;
    uint256 proofId;
}

struct Proof {
    uint256 id;
    uint256 statementId;
    uint256 orderId;
    uint256 finalPrice;
    uint256 timestamp;
    address producer;
    bytes32[] proof;
}
