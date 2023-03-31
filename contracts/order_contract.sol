// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { OrderLibrary } from "./libraries/order_lib.sol";
import { Tools } from "./libraries/tools.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract OrderContract is AccessControl {
    using OrderLibrary for OrderLibrary.OrderStorage;

    IERC20 public token;
    OrderLibrary.OrderStorage private orderStorage;
    bytes32 public constant AUTHORIZED_CALLER_ROLE = keccak256("AUTHORIZED_CALLER_ROLE");

    constructor(address _authorizedCaller, address _token) {
        _setupRole(AUTHORIZED_CALLER_ROLE, _authorizedCaller);
        token = IERC20(_token);
    }

    function create(uint256 statementId, bytes memory input, uint256 price, address buyer)
        public
        onlyRole(AUTHORIZED_CALLER_ROLE)
        returns (uint256)
    {
        // TODO: check if statement exists
        // TODO: to whom it would be better to send tokens?
        require(token.transferFrom(buyer, address(this), price), "Transfer failed");
        uint256 id = orderStorage.create(statementId, input, price, buyer);
        return id;
    }

    function get(uint256 id)
        public
        view
        returns (OrderLibrary.Order memory)
    {
        return orderStorage.get(id);
    }

    function close(uint256 id, bytes memory proof, uint256 finalPrice, address producer)
        public
        onlyRole(AUTHORIZED_CALLER_ROLE)
    {
        OrderLibrary.Order memory order = get(id);
        require(order.status == OrderLibrary.OrderStatus.OPEN, "Order is not open");
        require(finalPrice <= order.price, "Invalid final price");

        // TODO: do both transfers in one transaction
        require(token.transfer(producer, finalPrice), "Token transfer to producer failed");
        uint256 remainingTokens = order.price - finalPrice;
        require(token.transfer(order.buyer, remainingTokens), "Token transfer to buyer failed");

        require(Tools.verifyProof(id, proof), "Proof is not valid");

        orderStorage.update(id, producer, proof);
    }
}
