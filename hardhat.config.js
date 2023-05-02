
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require('hardhat-storage-layout');


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1200,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
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
