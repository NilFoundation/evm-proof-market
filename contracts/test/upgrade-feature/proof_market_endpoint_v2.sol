// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../proof_market_endpoint.sol";

contract ProofMarketEndpointV2 is ProofMarketEndpoint {

    //////////////////////////////
    // New API
    //////////////////////////////

    function newApi() public pure returns (string memory) {
        return 'new api';
    }
}
