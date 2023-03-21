// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./statement_contract.sol";
import "./order_contract.sol";
import "./proof_contract.sol";
import {Order, Proof} from "./structs.sol";


contract ProofMarketEndpoint {
    OrderContract private orderContract;
    ProofContract private proofContract;

    constructor() {
        orderContract = new OrderContract();
        proofContract = new ProofContract(orderContract);
    }

    function getOrder(uint256 orderId) public view returns (Order memory) {
        return orderContract.getOrder(orderId);
    }

    function getProof(uint256 proofId) public view returns (Proof memory) {
        return proofContract.getProof(proofId);
    }

    function createOrder(
        uint256 statementId,
        bytes32 input,
        uint256 price,
        address buyer
    ) public {
        orderContract.createOrder(statementId, input, price, buyer);
    }

    function addProof(
        uint256 statementId,
        uint256 orderId,
        uint256 finalPrice,
        uint256 timestamp,
        address producer,
        bytes32[] memory proof
    ) public {
        proofContract.addProof(
            statementId,
            orderId,
            finalPrice,
            timestamp,
            producer,
            proof
        );
    }
}

