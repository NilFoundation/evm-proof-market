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

## Commands

### Compile
Compile the contracts to ensure ABI files are present:
```
npx hardhat compile
```

### Test
Execute tests for the contracts:
```
npx hardhat test #Execute tests
```


### Deploy
Deploy the contracts to a specified network:
```
npx hardhat deployContract --network <network>
```

To deploy to a local network:
```
npx hardhat node
```
And then deploy the contract to the local network in a separate terminal:
```
npx hardhat deployContract --network localhost
```

### Update
Check storage layout of the contracts:
```
npx hardhat check
```
These requirements must be met:
- Existing layout of storage slots must be preserved (except for the `gap` arrays)
- Any new storage slots must be added `at the end` of the contract
- Length of the gap arrays must be descreased so the storage layout is preserved

### Usage
Get a list of the available commands:
```
node scripts/interact.js -h
```


### Flags

`providerUrl`:
URL of the Ethereum provider.
If not specified, it defaults to 'http://localhost:8545'.

`statementId`:
ID for creating a new order or fetching a statement's price.

`price`:
Price of the order when creating a new order.

`inputFile`:
JSON file path suitable for the statement format when creating a new order.

`keystoreFile`:
Path of the keystore file containing the private key for signing transactions.
If not specified, it defaults to `keystore.json`.

`password`:
Password for the keystore file.

`vefiviers`:
The verifiers of a statement as a comma-separated list.

### Common usage

- Create a keystore file from a private key
```
node scripts/interact.js createKeystoreFromPrivateKey --pk <privateKey> --password <password>
```
This command will create a keystore file from a private key and save it in the `keystore.json` file.
Later, this file can be used to sign transactions, by specifying the `keystoreFile` and `password` flags.

- Mint and approve tokens
```
node scripts/interact.js mintAndApprove --password <password> --keystoreFile <keystoreFile>  --providerUrl <providerUrl>
```
This command will mint sufficient for testing ERC20 tokens and approve the smart contracts to spend them.
Note that on a Mainnet deployment we will use one of the existing standart ERC20 tokens, like USDT.

- Get the price of a statement
```
node scripts/interact.js getPrice --statementId <statementId> --keystoreFile <keystoreFile>  --providerUrl <providerUrl>
```


### Create a new order
```
node scripts/interact.js createOrder --statementId <statementId> --price <price> --inputFile <inputFilePath> --password <password> --keystoreFile <keystoreFile>  --providerUrl <providerUrl>
```

## Testing usage on a local network
0. Start a local hardhat network `from mina-state-proof repository`:
```
npm i
npx hardhat node
```
1. Deploy the contract and add statements:
```
npx hardhat run scripts/deploy.js --network localhost
```
It will create a `deployed_addresses.json` file with the addresses of the deployed contracts.

Note:
- UnifiedAddition verifier has to be deployed manually (ignore for now)
- Mina verifiers have to be automatically deployed
    
On local hardhat node addresses are persistent, so you can just run the following command to add statements:
```
npx hardhat run scripts/addStatements.js --network localhost
```
2. Obtain private key of some account from the local network (can be obtained from the console output of the first command)

3. Create a keystore file from the private key:
```
node scripts/interact.js createKeystoreFromPrivateKey --pk <privateKey> --password <password>
```

4. Mint and approve tokens:
```
node scripts/interact.js mintAndApprove --password <password> --keystoreFile <keystoreFile>
```

5. Create a new order:
```
node scripts/interact.js createOrder --statementId <statementId> --price <price> --inputFile <inputFilePath> --password <password> --keystoreFile <keystoreFile>
```

For example, for mina account statement
```
node scripts/interact.js createOrder --statementId 79169223 --price 10 --inputFile scripts/test_inputs/account_mina.json --password <password>
```

## Maintenance

Contract maintenance is facilitated by Hardhat tasks located in scripts/maintain.js. Execute tasks using:
```
npx hardhat <taskName> --network <network>
```
Available tasks include deployContract, upgradeContract, addStatements, and updateStatementVerifiers.

## Contract Addresses

| Network      | Address |
| ----------- | ----------- |
| Sepolia      | 0xD8EC705993EfFF8512de7FD91d079375b9589C90       |
