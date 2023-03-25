// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { StatementContract } from "./statement_contract.sol";
import { OrderContract } from "./order_contract.sol";

contract ProofMarketEndpoint is StatementContract, OrderContract {
    constructor() {}
}
