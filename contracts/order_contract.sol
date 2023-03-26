// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { OrderLibrary, OrderStorage, Order } from "./libraries/order_lib.sol";
import { Tools } from "./libraries/tools.sol";

contract OrderContract {
    using OrderLibrary for OrderStorage;

    OrderStorage private orderStorage;

    function createOrder(uint256 statementId, bytes32 input, uint256 price, address buyer) 
        internal 
        returns (uint256) 
    {
        uint256 id = orderStorage.createOrder(statementId, input, price, buyer);
        return id;
    }

    function getOrder(uint256 id) 
        public 
        view 
        returns (Order memory) 
    {
        return orderStorage.getOrder(id);
    }

    function closeOrder(uint256 id, address producer, bytes32[] memory proof) 
        internal 
    {
        require(Tools.verifyProof(id, proof), "Proof is not valid");

        orderStorage.updateOrder(id, producer, proof);
    }
}
