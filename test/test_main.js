
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployProofMarketFixture } = require("./fixtures.js");


describe("Proof market  tests", function () {
    let proofMarket, user, producer, relayer, definition, price, StatementContract;
    
    before(async function () {
        StatementContract = await ethers.getContractFactory("StatementContract");
        ({ proofMarket, owner, user, producer, relayer } = await deployProofMarketFixture());
        definition = {
            verificationKey: ethers.utils.formatBytes32String("Example verification key"),
            provingKey: ethers.utils.formatBytes32String("Example proving key")
        };
        price = { price: 100 };
    });

    describe("Statement tests", function () {
        it("should create a new statement", async function () {
            const tx = await proofMarket.connect(relayer).addStatement(definition, price);
            const receipt = await tx.wait();
            const event = receipt.events.find((e) => e.event === "StatementAdded");

            expect(event.args.id).to.equal(1);
            expect(event.args.definition.verificationKey).to.equal(definition.verificationKey);
            expect(event.args.definition.provingKey).to.equal(definition.provingKey);

            const statement = await proofMarket.getStatement(1);
            expect(statement.id).to.equal(1);
            expect(statement.definition.verificationKey).to.equal(definition.verificationKey);
            expect(statement.definition.provingKey).to.equal(definition.provingKey);
            expect(statement.price.price).to.equal(price.price);
        });

        it("should revert if the caller is not the contract owner", async function () {
            // connect to the contract as a non-owner
            const nonOwner = proofMarket.connect(user);

            await expect(nonOwner.addStatement(definition, price))
            .to.be.revertedWith(/AccessControl/);
        });

        it("should revert if the statement already exists", async function () {
            await expect(proofMarket.connect(relayer).addStatement(definition, price))
            .to.be.revertedWith("Statement already exists");
        });

        it("should update a statement", async function () {
            const updatedDefinition = {
                verificationKey: ethers.utils.formatBytes32String("Updated verification key"),
                provingKey: ethers.utils.formatBytes32String("Updated proving key")
            }
            const updatedPrice = { price: 200 };

            await expect(proofMarket.connect(relayer).updateStatementDefinition(1, updatedDefinition))
            .to.emit(proofMarket, "StatementDefinitionUpdated");

            await expect(proofMarket.connect(relayer).updateStatementPrice(1, updatedPrice))
            .to.emit(proofMarket, "StatementPriceUpdated");

            const statement = await proofMarket.getStatement(1);
            expect(statement.id).to.equal(1);
            expect(statement.definition.verificationKey).to.equal(updatedDefinition.verificationKey);
            expect(statement.definition.provingKey).to.equal(updatedDefinition.provingKey);
            expect(statement.price.price).to.equal(updatedPrice.price);
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

        it("should revert if the statement does not exist", async function () {
            const statementId = 123;
            const input = ethers.utils.formatBytes32String("Example input");
            const price = ethers.utils.parseUnits("10", 18);

            await expect(proofMarket.connect(user).createOrder(statementId, input, price))
            .to.be.revertedWith("Statement does not exist");
        });

        it("should close an order", async function () {
            const orderId = 1;
            const proof = ethers.utils.formatBytes32String("Example proof");
            const finalPrice = ethers.utils.parseUnits("9", 18);

            await expect(proofMarket.connect(relayer).closeOrder(orderId, proof, finalPrice, producer.address))
            .to.emit(proofMarket, "OrderClosed")
            .withArgs(orderId, producer.address, finalPrice, proof);
        });

        it("should revert if the caller is not the relayer", async function () {
            const orderId = 1;
            const proof = ethers.utils.formatBytes32String("Example proof");
            const finalPrice = ethers.utils.parseUnits("9", 18);

            const nonRelayer = proofMarket.connect(user);

            await expect(nonRelayer.closeOrder(orderId, proof, finalPrice, producer.address))
            .to.be.revertedWith(/AccessControl/);
        });
    });
    describe("Access control tests", function () {
        it("should grant the relayer role to the relayer", async function () {
            const hasRole = await proofMarket.hasRole(proofMarket.RELAYER_ROLE(), relayer.address);
            expect(hasRole).to.be.true;
        });

        it("should revoke the relayer role from the relayer", async function () {
            await proofMarket.revokeRole(proofMarket.RELAYER_ROLE(), relayer.address);

            const hasRole = await proofMarket.hasRole(proofMarket.RELAYER_ROLE(), relayer.address);
            expect(hasRole).to.be.false;
            await proofMarket.grantRole(proofMarket.RELAYER_ROLE(), relayer.address);
            const hasRole2 = await proofMarket.hasRole(proofMarket.RELAYER_ROLE(), relayer.address);
            expect(hasRole2).to.be.true;
        });

        it("should revert if the caller is not the contract owner", async function () {
            // connect to the contract as a non-owner
            const nonOwner = proofMarket.connect(user);

            await expect(nonOwner.grantRole(proofMarket.RELAYER_ROLE(), relayer.address))
            .to.be.revertedWith(/AccessControl/);
            await expect(nonOwner.revokeRole(proofMarket.RELAYER_ROLE(), relayer.address))
            .to.be.revertedWith(/AccessControl/);
        });

        it("should revert if statement contract is called from outside the contract", async function () {
            const statementContractAddress = await proofMarket.statementContract();
            const statementContractInstance = StatementContract.attach(statementContractAddress);
            await expect(statementContractInstance.connect(user).add(definition, price))
            .to.be.revertedWith(/AccessControl/);
        });
    });
});
