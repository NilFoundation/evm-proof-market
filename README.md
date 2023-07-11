# Proof Market Endpoint for Ethereum

## Introduction
This repository presents the Solidity smart contracts required to interact with the Proof Market.
The repository uses Hardhat as a development environment for compilation, testing and deployment tasks.

## Dependencies

- [Hardhat](https://hardhat.org/)
- [nodejs](https://nodejs.org/en/) >= 16.0

## Installation
```
npm install
```

## Compile
```
npx hardhat compile
```

## Test
```
npx hardhat test #Execute tests
```

## Deploy
```
npx hardhat run scripts/deploy.js --network <network>
```

To deploy to a local network, you can use the following command to start a local node:
```
npx hardhat node
```
And then deploy to the local network in a separate terminal:
```
npx hardhat run scripts/deploy.js --network localhost
```

## Update
Check storage layout of the contracts:
```
npx hardhat check
```
These requirements must be met:
- Existing layout of storage slots must be preserved (except for the `gap` arrays)
- Any new storage slots must be added `at the end` of the contract
- Length of the gap arrays must be descreased so the storage layout is preserved

## Usage
TODO

## Events

To listen to events emitted by the smart contracts, you can use the following command:
```
npx hardhat run --network <network> scripts/trackEvents.js
```

To generate some events, you can use the following command:
```
npx hardhat run --network <network> scripts/interact.js
```

## Testing

There is a testing dbms instance running on https://api.proof-market.dev.nil.foundation/.
Also we have a running proof producer for testing EVM Proof Market.
So the following steps can be used to test the contract and the relayer:

1. Start a local node:
```
npx hardhat node
```
2. Deploy the contracts to the local network:
```
npx hardhat run scripts/deploy.js --network localhost
```
3. Start the relayer:
```
npx hardhat run --network localhost scripts/relayer.js
```
4. Submit a statement:
```
npx hardhat run --network localhost scripts/interact.js
```
5. Submit an order:
```
npx hardhat run --network localhost scripts/createOrder.js
```
6. Wait for the order to be completed:
```
npx hardhat run --network localhost scripts/trackOrder.js
```