// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

enum OrderStatus {OPEN, CLOSED}

struct Order {
    uint256 id;
    uint256 statementId;
    bytes32 input;
    uint256 price;
    address buyer;
    OrderStatus status;
    address producer;
    bytes32[] proof;
}

struct OrderStorage {
    mapping(uint256 => Order) orders;
    uint256 orderCounter;
}

library OrderLibrary {

    event OrderCreated(uint256 indexed id, uint256 statementId, bytes32 input, uint256 price, address buyer);
    event OrderClosed(uint256 indexed id, address producer, uint256 finalPrice, bytes32[] proof);

    function createOrder(
        OrderStorage storage self,
        uint256 statementId,
        bytes32 input,
        uint256 price,
        address buyer
    ) internal returns (uint256) {
        self.orderCounter++;

        self.orders[self.orderCounter] = Order({
            id: self.orderCounter,
            statementId: statementId,
            input: input,
            price: price,
            buyer: buyer,
            status: OrderStatus.OPEN,
            producer: address(0),
            proof: new bytes32[](0)
        });

        return self.orderCounter;
    }

    function getOrder(OrderStorage storage self, uint256 id) internal view returns (Order storage) {
        require(id > 0 && id <= self.orderCounter, "Order not found");
        return self.orders[id];
    }

    function updateOrder(
        OrderStorage storage self,
        uint256 id,
        address producer,
        bytes32[] memory proof
    ) internal {
        require(id > 0 && id <= self.orderCounter, "Order not found");

        self.orders[id].producer = producer;
        self.orders[id].proof = proof;
        self.orders[id].status = OrderStatus.CLOSED;
    }
}
