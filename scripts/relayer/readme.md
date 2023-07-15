## Current implementation
1. `eventListener.js` - listens to and process specified events from the contract
    - Currently we are listening to only `OrderCreated` events
    - Not to process the same event twice we are storing last processed block number locally
    - This ensures, that we will not miss any events, but there is a chance, that some events will be processed several times
        - For that we will need to insure, for example, idempotency of order creation on Proof Market side
2. `orderRelay.js` - use eventListener to get events and prepare them for Proof Market; send them to Proof Market
3. `proofRelay.js` - periodically get submitted proofs from Proof Market, which are
    - Have status `completed` on Proof Market
    - Not yet processed by relayer 
        - For that we will add another relation (currently on `market` db) that will store relayer related information
    - After that process proofs and send them to the contract
    - Send request to Proof Market to mark corresponding order as processed
4. `priceRelay.js` - periodically get prices from Proof Market and send them to the contract


## Further improvements
1. Order cancellation
    - Currently we are not listening to (and don't even have) `OrderCancelled` events
    - We need to listen to them and send corresponding requests to Proof Market
2. Information aggregation
    - Relayer can also listen to `OrderCompleted`, `VerificationFailed` events and store this info in the dbms cluster and make it easily accessible 


## Current simplifications
- Statement prices are just sorted request/proposal prices for the statement (can easily switch it to anything else)
- Relay of statuses is not working independently from proof relay
    - This simplification is added to avoid concurrent complexity and ease debugging
- Public_input transfer from evm PM `uint256[]` format to PM format is not working
    - For now transfer mina account as is, but for mina state substitue public_input with a valid default one