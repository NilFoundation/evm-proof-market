// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./structs.sol";
import "./order_contract.sol";

contract ProofContract {

    mapping(uint256 => Proof) public proofs;
    uint256 public nextProofId;
    OrderContract private orderContract;

    constructor(OrderContract _orderContract) {
        nextProofId = 1;
        orderContract = _orderContract;
    }

    function getProof(uint256 proofId) public view returns (Proof memory) {
        return proofs[proofId];
    }

    function verifyProof(
        uint256 orderId,
        bytes32[] memory proof
    ) public pure returns (bool) {
        // TODO: Implement this function
        return true;
    }

    function addProof(
        uint256 statementId,
        uint256 orderId,
        uint256 finalPrice,
        address producer,
        bytes32[] memory proof
    ) public {
        require(
            verifyProof(orderId, proof),
            "Proof is not valid"
        );
        proofs[nextProofId] = Proof(
            nextProofId,
            statementId,
            orderId,
            finalPrice,
            producer,
            proof
        );
        orderContract.closeOrder(orderId, nextProofId);
        nextProofId++;
    }
}
