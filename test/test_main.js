
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployProofMarketFixture } = require("./fixtures.js");


describe("Proof market  tests", function () {
    let token, proofMarket, owner, user, producer, relayer;

    before(async function () {
        ({ proofMarket, owner, user, producer, relayer } = await deployProofMarketFixture());
    });

    describe("Statement tests", function () {
        it("should create a new statement", async function () {
            const definition = ethers.utils.formatBytes32String("Example definition");
            const price = { price: 100 };
    
            await expect(proofMarket.addStatement(definition, price))
            .to.emit(proofMarket, "StatementAdded")
            .withArgs(1, definition);
    
            const statement = await proofMarket.getStatement(1);
            expect(statement.id).to.equal(1);
            expect(statement.definition).to.equal(definition);
            expect(statement.price.price).to.deep.equal(price.price);
        });

        it("should revert if the caller is not the contract owner", async function () {
            const definition = ethers.utils.formatBytes32String("Example definition");
            const price = { price: 100 };

            // connect to the contract as a non-owner
            const nonOwner = proofMarket.connect(user);

            await expect(nonOwner.addStatement(definition, price)).to.be.revertedWith(
                "Caller is not owner"
            );
        });
    });

    describe("Order tests", function () {
        it("should create a new order", async function () {
            const statementId = 1;
            const input = ethers.utils.formatBytes32String("Example input");
            const price = ethers.utils.parseUnits("10", 18);

            await expect(proofMarket.connect(user).createOrder(statementId, input, price))
            .to.emit(proofMarket, "OrderCreated")
            .withArgs(1, statementId, input, price, user.address);

            const order = await proofMarket.getOrder(1);
            expect(order.statementId).to.equal(statementId);
            expect(order.input).to.equal(input);
            expect(order.price).to.equal(price);
            expect(order.buyer).to.equal(user.address);
            expect(order.status).to.equal(0); // OrderStatus.OPEN
        });

        // it("should revert if the statement does not exist", async function () {
        //     const statementId = 2;
        //     const input = ethers.utils.formatBytes32String("Example input");
        //     const price = ethers.utils.parseUnits("10", 18);

        //     await expect(proofMarket.connect(user).createOrder(statementId, input, price)).to.be.revertedWith(
        //         "Statement does not exist"
        //     );
        // });

        it("should close an order", async function () {
            const orderId = 1;
            const proof = [ethers.utils.formatBytes32String("Example proof")];
            const finalPrice = ethers.utils.parseUnits("9", 18);
            
            await expect(proofMarket.connect(user).closeOrder(orderId, proof, finalPrice, producer.address))
            .to.emit(proofMarket, "OrderClosed")
            .withArgs(orderId, producer.address, finalPrice, proof);

        });
    });
});
