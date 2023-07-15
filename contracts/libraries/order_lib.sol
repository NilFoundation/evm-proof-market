// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library OrderLibrary {

    enum OrderStatus {OPEN, PROCESSING, CLOSED}

    struct Order {
        uint256 id;
        uint256 statementId;
        uint256[][] publicInputs;
        uint256 price;
        address buyer;
        OrderStatus status;
        address producer;
        bytes32 proofHash;
    }

    struct OrderInput {
        uint256 statementId;
        uint256[][] publicInputs;
        uint256 price;
    }

    struct OrderStorage {
        mapping(uint256 => Order) orders;
        uint256 orderCounter;
        uint256[30] __gap;
    }

    function create(
        OrderStorage storage self,
        OrderInput memory inputData,
        address buyer
    ) internal returns (uint256) {
        self.orderCounter++;

        self.orders[self.orderCounter] = Order({
            id: self.orderCounter,
            statementId: inputData.statementId,
            publicInputs: inputData.publicInputs,
            price: inputData.price,
            buyer: buyer,
            status: OrderStatus.OPEN,
            producer: address(0),
            proofHash: bytes32(0)
        });

        return self.orderCounter;
    }

    function get(OrderStorage storage self, uint256 id) internal view returns (Order storage) {
        require(id <= self.orderCounter, "Order not found");
        return self.orders[id];
    }

    function setProducer(
        OrderStorage storage self,
        uint256 id,
        address producer
    ) internal {
        require(id > 0 && id <= self.orderCounter, "Order not found");
        require(self.orders[id].status == OrderLibrary.OrderStatus.OPEN, "Order is not open");
        self.orders[id].producer = producer;
        self.orders[id].status = OrderStatus.PROCESSING;
    }

    function close(
        OrderStorage storage self,
        uint256 id,
        uint256 finalPrice,
        bytes32 proof
    ) internal {
        require(id > 0 && id <= self.orderCounter, "Order not found");
        require(self.orders[id].status == OrderLibrary.OrderStatus.PROCESSING, "Order is not processing");
        require(finalPrice <= self.orders[id].price, "Invalid final price");

        self.orders[id].proofHash = proof;
        self.orders[id].status = OrderStatus.CLOSED;
    }
}
