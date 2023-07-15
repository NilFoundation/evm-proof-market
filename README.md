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
Compile the contracts before interacting with them to make sure the ABI files are present:
```
npx hardhat compile
```
Get a list of the available commands:
```
node scripts/connect.js -h
```

### Flags

`providerUrl`:
This flag is used to specify the URL of the Ethereum provider that will be used to interact with the Ethereum network.
If not specified, it defaults to 'http://localhost:8545'.

`statementId`:
This flag is used to specify the statement ID when creating a new order or getting the price of a statement.

`price`:
This flag is used to specify the price of the order when creating a new order.

`inputFile`:
This flag is used to specify the file path of the input file when creating a new order.
It should be a JSON file in the suitable for the statement format.

`pk` (Private Key):
This flag is used to specify the private key of the Ethereum address that will be used to sign transactions.

### Mint and approve tokens
```
node scripts/connect.js mintAndApprove --pk <privateKey> --providerUrl <providerUrl>
```
This command will mint sufficient for testing ERC20 tokens and approve the smart contracts to spend them.

### Get the price of a statement
```
node scripts/connect.js getPrice --statementId <statementId> --providerUrl <providerUrl>
```

### Create a new order
```
node scripts/connect.js createOrder --statementId <statementId> --price <price> --inputFile <inputFilePath> --pk <privateKey> --providerUrl <providerUrl>
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
