# Proof Market Endpoint for Ethereum

## Introduction
This repository presents the solidity smart contracts required to interact with the Proof Market.
The repository uses Hardhat as development environment for compilation, testing and deployment tasks.

## Dependencies

- [Hardhat](https://hardhat.org/)
- [nodejs](https://nodejs.org/en/) >= 16.0

## Compile 
```
npx hardhat compile
```

## Test
```
npx hardhat test #Execute tests
```

## Deploy
TODO

## Usage
TODO

## Assumptions (temporary)
- Users cannot cancel their orders
- Users do not provide any timing constraints
## Architecture
### Actors:
1. Eth user
- Interacts with the Proof Market through the eth endpoint; can interact with the following:
    - Proofs
        - Read
        - Write (allowed only for specified user, e.g. `Relayer`)
    - Orders (only bids, e.g. for buying proofs)
        - Read
        - Write
    - Statements
        - Read
2. Proof Market
- Provides the following services:
    - Order `read/write`
    - Statement `read/write`
    - Matching
    - Proof `read/verify&write`
    - Payments
3. Etherium smart contract
- Provides the following services:
    - Bids (orders to buy a proof) `read/write/delete`
    - Statement `read`
    - Proof `read` and `verify&write` only for the `Relayer`
    - Payments
4. Relayer
- Collects bid orders from the Eth side, sends them to the Proof Market
- Collects proofs from the Proof Market, sends them to the Eth side
- Updates prices on Eth side
- Sends eth adresses of proof producers to the Eth side

## Data structures
### Proof
```
struct Proof {
    uint256 id;
    uint256 statementId;
    uint256 orderId;
    uint256 finalPrice;
    uint256 timestamp;
    address producer;
    bytes32[] proof;
}
```
### Order
```
enum OrderStatus {OPEN, CLOSED}
```
```
struct Order {
    uint256 id;
    uint256 statementId;
    bytes32 input;
    uint256 price;
    uint256 createdOn;
    uint256 updatedOn;
    address buyer;
    OrderStatus status;
    uint256 proofId;
}
```

### Statement
```
struct Statement {
    uint256 id;
    bytes32 definition;
    uint256 price;
    uint256 createdOn;
    uint256 updatedOn;
}
```

## Mappings
### Proof
```
mapping(uint256 => Proof) public proofs;
```
### Order
```
mapping(uint256 => Order) public orders;
```
### Statement
```
mapping(uint256 => Statement) public statements;
```

## API
### Proof
#### Read
```
function getProof(uint256 _id) public view returns (Proof memory)
```
#### Write
```
function addProof(
            uint256 statementId,
            uint256 orderId,
            uint256 finalPrice,
            uint256 timestamp,
            address producer,
            bytes32[] memory proof) public
```
### Order
#### Read
```
function getOrder(uint256 _id) public view returns (Order memory)
```
#### Write
```
function createOrder(
        uint256 statementId,
        bytes32 input,
        uint256 price,
        address buyer) public
```
### Statement
#### Read
```
function getStatement(uint256 _id) public view returns (Statement memory)
```