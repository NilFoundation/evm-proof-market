// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { OrderLibrary, OrderStorage, Order } from "./libraries/order_lib.sol";
import { Tools } from "./libraries/tools.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OrderContract is AccessControl {
    using OrderLibrary for OrderStorage;

    OrderStorage private orderStorage;
    bytes32 public constant AUTHORIZED_CALLER_ROLE = keccak256("AUTHORIZED_CALLER_ROLE");

    constructor(address _authorizedCaller) {
        _setupRole(AUTHORIZED_CALLER_ROLE, _authorizedCaller);
    }

    function create(uint256 statementId, bytes32 input, uint256 price, address buyer) 
        public
        onlyRole(AUTHORIZED_CALLER_ROLE)
        returns (uint256) 
    {
        uint256 id = orderStorage.create(statementId, input, price, buyer);
        return id;
    }

    function get(uint256 id) 
        public 
        view 
        returns (Order memory) 
    {
        return orderStorage.get(id);
    }

    function close(uint256 id, address producer, bytes32[] memory proof) 
        public
        onlyRole(AUTHORIZED_CALLER_ROLE)
    {
        require(Tools.verifyProof(id, proof), "Proof is not valid");

        orderStorage.update(id, producer, proof);
    }
}
