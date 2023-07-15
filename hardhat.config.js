
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require('hardhat-storage-layout');
require("hardhat-deploy");
require('hardhat-deploy-ethers')
require("hardhat-contract-sizer");


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
    tokenOwner: {
      default: 1,
    },
    user: {
      default: 2,
    },
    producer: {
      default: 3,
    },
    relayer: {
      default: 4,
    }
  },
  mocha: {
    timeout: 100000000
  },
  networks: {
    hardhat: {
      blockGasLimit: 100_000_000,
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 5,
    enabled: false
  },
};
