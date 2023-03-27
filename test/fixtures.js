
const { ethers } = require("hardhat");

async function deployStatementFixture() {
    const StatementContract = await ethers.getContractFactory("StatementContract");
    const [owner, user] = await ethers.getSigners();

    const statementContract = await StatementContract.deploy(owner.address);

    await statementContract.deployed();

    return { StatementContract, statementContract, owner, user };
}

module.exports = {
  deployStatementFixture,
};
