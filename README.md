# Proof Market Endpoint for Ethereum

[![Discord](https://img.shields.io/discord/969303013749579846.svg?logo=discord&style=flat-square)](https://discord.gg/KmTAEjbmM3)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=flat-square&logo=telegram&logoColor=dark)](https://t.me/nilfoundation)
[![Twitter](https://img.shields.io/twitter/follow/nil_foundation)](https://twitter.com/nil_foundation)

## Introduction

Proof Market Endpoint for Ethereum contains Solidity smart contracts
for interaction with `=nil;` Foundation's [Proof Market](proof.market).
This repository uses Hardhat as a development environment for compilation,
testing, and deployment tasks.

## Dependencies

- [Hardhat](https://hardhat.org/)
- [Node.js](https://nodejs.org/) - Hardhat requires an LTS version of Node.js;
as of October 2023, it's v20.9

## Contract Addresses
### Endpoint

| Network      | Address |
| ----------- | ----------- |
| Sepolia      | [`0xD8EC705993EfFF8512de7FD91d079375b9589C90`](https://sepolia.etherscan.io/address/0xD8EC705993EfFF8512de7FD91d079375b9589C90)       |

### UnifiedAdditionVerifier

| Network      | Address |
| ----------- | ----------- |
| Sepolia      | [`0xc6E7A6Dcad73D499520DDdf5d9b56E0E18DD9bAd`](https://sepolia.etherscan.io/address/0xc6E7A6Dcad73D499520DDdf5d9b56E0E18DD9bAd)       |

## Cloning the repository

Clone the project from GitHub:

```bash
git clone git@github.com:NilFoundation/evm-proof-market.git
```

After that, navigate to the `evm-proof-market` directory:

```bash
cd evm-proof-market
```

## Installation

```bash
npm install
```

## Commands
### Compile

Compile the contracts to ensure ABI files are present:

```bash
npx hardhat compile
```

### Testing

Execute tests for the contracts:

```bash
npx hardhat test #Execute tests
REPORT_GAS=true npx hardhat test #Execute tests with gas reporting
```

### Deploy

If you need to deploy the contracts to a specified network:

```bash
npx hardhat deployContract --network <network>
```

To deploy to a local network, launch a Hardhat node using the following command:

```bash
npx hardhat node
```

Keep this terminal open and the network running.
And then deploy the contract to the local network in a separate terminal:

```bash
npx hardhat deployContract --network localhost
```

### Updating the contracts

Check the storage layout of the contracts:

```bash
npx hardhat check
```

The following requirements must be met:
- Existing layout of storage slots must be preserved
(except for the `gap` arrays)
- Any new storage slots must be added `at the end` of the contract
- Length of the gap arrays must be decreased so the storage layout is preserved

### Interaction script

The main script for interacting with Proof Market via Endpoint is `scripts/interact.js`.
To get a list of the available commands, run:

```bash
node scripts/interact.js -h
```

#### Commands

    createOrder                   Create a new order
    mintAndApprove                Mint and approve tokens
    getPrice                      Get price for a statement
    createKeystoreFromPrivateKey  Create a keystore from a private key
    getOrder                      Get an order
    getStatements                 Get statements

#### Flags

    `--providerUrl`: URL of the Ethereum provider.
    If not specified, it defaults to 'http://localhost:8545'.
    `--statementId`: ID for creating a new order or fetching a statement's price.
    `--price`: price of the order when creating a new order.
    `--inputFile`: JSON file path suitable for the statement format when creating a new order.
    `--keystoreFile`: path to the keystore file containing the private key
    for signing transactions.
    If not specified, it defaults to `keystore.json`.
    `--password`: password for the keystore file.
    `--verifiers`: the verifiers of a statement as a comma-separated list.

     --version      Показать номер версии                             [булевый тип]
  --force        Force the transaction without asking for confirmation
                                             [булевый тип] [по умолчанию: false]
  --help         Показать помощь        

#### Creating a keystore file from a private key

```bash
node scripts/interact.js createKeystoreFromPrivateKey \
    --pk <privateKey> \
    --password <password>
```

This command will create a keystore file from a private key and save it
in the `keystore.json` file.
Later, this file can be used to sign transactions by specifying
the `keystoreFile` and `password` flags.

#### Mint and approve tokens

```bash
node scripts/interact.js mintAndApprove \
    --password <password> \
    --keystoreFile <keystoreFile> \
    --providerUrl <providerUrl>
```

This command will mint sufficient for testing ERC20 tokens and approve
the smart contracts to spend them.
Note that on a main net deployment we will use one of the existing
standard ERC20 tokens, like USDT.

#### Getting the price for a statement

```bash
node scripts/interact.js getPrice \
    --statementId <statementId> \
    --keystoreFile <keystoreFile> \
    --providerUrl <providerUrl>
```

#### Creating a new order

```bash
node scripts/interact.js createOrder \
    --statementId <statementId> \
    --price <price> \
    --inputFile <inputFilePath> \
    --password <password> \
    --keystoreFile <keystoreFile> \
    --providerUrl <providerUrl>
```

## Testing Endpoint on a local network

1. Start a local hardhat network from the `mina-state-proof` repository:

```bash
npm i
npx hardhat node
```

2. Deploy the contract and add statements:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

It will create a `deployed_addresses.json` file with the addresses
of the deployed contracts.

Note:
- UnifiedAddition verifier has to be deployed manually (ignore for now)
- Mina verifiers have to be automatically deployed

On local hardhat node addresses are persistent, so you can just run
the following command to add statements:

```bash
npx hardhat run scripts/addStatements.js --network localhost
```

3. Obtain private key of some account from the local network
(can be obtained from the console output of the first command)

4. Create a keystore file from the private key:

```bash
node scripts/interact.js createKeystoreFromPrivateKey \
    --pk <privateKey> \
    --password <password>
```

5. Mint and approve tokens:

```bash
node scripts/interact.js mintAndApprove \
    --password <password> \
    --keystoreFile <keystoreFile>
```

6. Create a new order:

```bash
node scripts/interact.js createOrder \
    --statementId <statementId> \
    --price <price> \
    --inputFile <inputFilePath> \
    --password <password> \
    --keystoreFile <keystoreFile>
```

For example, for Mina account statement

```bash
node scripts/interact.js createOrder \
    --statementId 79169223 \
    --price 17 \
    --inputFile scripts/test_inputs/account_mina.json \
    --password <password>
```

## Maintenance

Contract maintenance is facilitated by Hardhat tasks located in `scripts/maintain.js`.
Available tasks are `deployContract`, `upgradeContract`, `addStatements`,
and `updateStatementVerifiers`.
Execute a task with the following:

```bash
npx hardhat <taskName> --network <network>
```
