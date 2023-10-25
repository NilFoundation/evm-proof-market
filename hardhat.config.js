
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require('hardhat-storage-layout');
require("hardhat-deploy");
require('hardhat-deploy-ethers')
require("hardhat-contract-sizer");
require('dotenv').config()
require('./scripts/maintain.js')

const ALCHEMY_URL = "https://eth-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY;
const owner = process.env.OWNER_PRIVATE_KEY;
const relayer = process.env.RELAYER_PRIVATE_KEY;


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    relayer: {
      default: 1,
    },
    user: {
      default: 2,
    },
    producer: {
      default: 3,
    }
  },
  mocha: {
    timeout: 100000000
  },
  networks: {
    hardhat: {
      blockGasLimit: 100_000_000,
    },
    sepolia: {
      url: ALCHEMY_URL,
      accounts: [owner, relayer],
      timeout: 60000
    }
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 5,
    enabled: false
  },
};
