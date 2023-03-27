// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementContract } from "./statement_contract.sol";
import { StatementLibrary, StatementData, Price } from "./libraries/statement_lib.sol";
import { OrderContract } from "./order_contract.sol";
import { OrderLibrary, Order, OrderStatus } from "./libraries/order_lib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ProofMarketEndpoint {
    IERC20 public token;
    StatementContract public statementContract;
    OrderContract public orderContract;

    constructor(IERC20 _token) {
        token = _token;
        statementContract = new StatementContract(msg.sender);
        orderContract = new OrderContract(address(this));
    }
    
    function createOrder(uint256 statementId, bytes32 input, uint256 price) 
        public 
        returns (uint256) 
    {
        require(token.transferFrom(msg.sender, address(this), price), "Token transfer failed");

        uint256 id = orderContract.createOrder(statementId, input, price, msg.sender);
        emit OrderLibrary.OrderCreated(id, statementId, input, price, msg.sender);
        return id;
    }

    function closeOrder(uint256 orderId, bytes32[] memory proof, uint256 finalPrice, address producer) public {
        Order memory order = orderContract.getOrder(orderId);

        require(order.status == OrderStatus.OPEN, "Order is not open");

        require(finalPrice <= order.price, "Invalid final price");

        orderContract.closeOrder(orderId, producer, proof);
        
        // TODO: do both transfers in one transaction
        require(token.transfer(producer, finalPrice), "Token transfer to producer failed");

        uint256 remainingTokens = order.price - finalPrice;
        require(token.transfer(order.buyer, remainingTokens), "Token transfer to buyer failed");


        emit OrderLibrary.OrderClosed(orderId, producer, finalPrice, proof);
    }
}
