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
```
node scripts/interact.js -h
```


## Events

To listen to events emitted by the smart contracts, you can use the following command:
```
npx hardhat run --network <network> scripts/trackEvents.js
```

To generate some events, you can use the following command:
```
npx hardhat run --network <network> scripts/interact.js
```
