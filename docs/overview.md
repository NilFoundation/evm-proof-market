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
3. Ethereum smart contract
- Provides the following services:
    - Requests (orders to buy a proof) `read/write/delete`
    - Statement `read`
    - Proof `read` and `verify&write` only for the `Relayer`
    - Payments
4. Relayer
- Collects requests from the Eth side, sends them to the Proof Market
- Collects proofs from the Proof Market, sends them to the Eth side
- Updates prices on Eth side
- Sends eth adresses of proof producers to the Eth side

## Data structures
### Order
```
enum OrderStatus {OPEN, CLOSED}
```
```
struct Order {
    uint256 id;
    uint256 statementId;
    bytes input;
    uint256 price;
    address buyer;
    OrderStatus status;
    address producer;
    bytes proof;
}
```

### Statement
```
struct Statement {
    uint256 id;
    Definition definition;
    Price price;
}
```

### Price
```
struct Price {
    uint256 price;
}
```

### Definition
```
struct Definition {
    bytes verificationKey;
    bytes provingKey;
}
```
