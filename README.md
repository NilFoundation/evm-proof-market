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
node scripts/interact.js -h
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

`keystoreFile`:
This flag is used to specify the file path of the keystore file.
This file contains the private key of the Ethereum account that will be used to sign the transactions.

`password`:
This flag is used to specify the password of the keystore file.

### Mint and approve tokens
```
node scripts/interact.js mintAndApprove --pk <privateKey> --providerUrl <providerUrl>
```
This command will mint sufficient for testing ERC20 tokens and approve the smart contracts to spend them.

### Get the price of a statement
```
node scripts/interact.js getPrice --statementId <statementId> --providerUrl <providerUrl>
```

### Create a new order
```
node scripts/interact.js createOrder --statementId <statementId> --price <price> --inputFile <inputFilePath> --pk <privateKey> --providerUrl <providerUrl>
```

### Create a keystore file from a private key
```
node scripts/interact.js createKeystoreFromPrivateKey --pk <privateKey> --password <password>
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
npx hardhat run scripts/relayer/run.js
```
This script will produce a bunch of cryptic outputs, but it for each createOrder execution it will print after about 30-60 seconds:
`Order closed: BigNumber { _hex: <your order number>, _isBigNumber: true }`, which means that the order was successfully closed.

4. Submit an order:
```
npx hardhat run --network localhost scripts/createOrder.js
```

### Important note
Since there will be several people testing this thing, using the same instance of Proof Market, it is important to 
- clear the database from time to time 
    ```
    for doc in request 
    filter doc.sender == 'relayer'
    remove doc in request
    ```
- or just create a new relayer for your testing (do not forget to register it as a proof producer and provide the ethereum address). Specify relayer's credentials in `scripts/relayer/credentials.json`

## How to brake it
1. Submit an order with predefined updatedOn field set to $\approx \infty$
    - Make sure that users cannot submit orders with custom fields
2. Now we are sloppy with addresses
    - At least add a validation
3. Make sure that invalid proof does not brake the workflow
4. Make sure that some random exception allows seamless re-launch
