
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployStatementFixture } = require("./fixtures.js");


describe("Statement tests", function () {
    let statementContract;
    let owner;
    let user;

    beforeEach(async function () {
        ({ statementContract, owner, user } = await deployStatementFixture());
    });

    describe("addStatement", function () {
        it("should create a new statement", async function () {
            const definition = ethers.utils.formatBytes32String("Example definition");
            const price = { price: 100 };
    
            await expect(statementContract.addStatement(definition, price))
            .to.emit(statementContract, "StatementAdded")
            .withArgs(1, definition, price.price);
    
            const statement = await statementContract.getStatement(1);
            expect(statement.id).to.equal(1);
            expect(statement.definition).to.equal(definition);
            expect(statement.price.price).to.deep.equal(price.price);
        });

        it("should revert if the caller is not the contract owner", async function () {
            const definition = ethers.utils.formatBytes32String("Example definition");
            const price = { price: 100 };

            // connect to the contract as a non-owner
            const nonOwner = statementContract.connect(user);

            await expect(nonOwner.addStatement(definition, price)).to.be.revertedWith(
                "Caller is not authorized"
            );
        });
    });
});
