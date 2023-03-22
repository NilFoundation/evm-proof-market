// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { Order, OrderStatus } from "./structs.sol";

contract OrderContract {

    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId;

    constructor() {
        nextOrderId = 1;
    }

    function getOrder(uint256 orderId) public view returns (Order memory) {
        return orders[orderId];
    }

    function createOrder(
        uint256 statementId,
        bytes32 input,
        uint256 price,
        address buyer
    ) public {
        Order memory newOrder = Order({
            id: nextOrderId,
            statementId: statementId,
            input: input,
            price: price,
            buyer: buyer,
            status: OrderStatus.OPEN,
            proofId: 0 // Initially undefined
        });

        orders[nextOrderId] = newOrder;

        nextOrderId++;
    }

    function closeOrder(uint256 orderId, uint256 proofId) public {
        require(orders[orderId].id == orderId, "Order not found");

        orders[orderId].status = OrderStatus.CLOSED;
        orders[orderId].proofId = proofId;
    }

}