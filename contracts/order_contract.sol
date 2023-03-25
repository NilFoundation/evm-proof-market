// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { OrderLibrary } from "./libraries/order_lib.sol";
import { Tools } from "./libraries/tools.sol";

contract OrderContract {
    using OrderLibrary for OrderLibrary.OrderStorage;

    OrderLibrary.OrderStorage private orderStorage;

    event OrderCreated(uint256 indexed id, uint256 statementId, bytes32 input, uint256 price, address buyer);
    event OrderClosed(uint256 indexed id, address producer, bytes32[] proof);

    function createOrder(uint256 statementId, bytes32 input, uint256 price) 
        public 
        returns (uint256) 
    {
        uint256 id = orderStorage.createOrder(statementId, input, price, msg.sender);
        emit OrderCreated(id, statementId, input, price, msg.sender);
        return id;
    }

    function getOrder(uint256 id) 
        public 
        view 
        returns (OrderLibrary.Order memory) 
    {
        return orderStorage.getOrder(id);
    }

    function updateOrder(uint256 id, address producer, bytes32[] memory proof) 
        public 
    {
        require(Tools.verifyProof(id, proof), "Proof is not valid");
        
        orderStorage.updateOrder(id, producer, proof);
        emit OrderClosed(id, producer, proof);
    }
}
