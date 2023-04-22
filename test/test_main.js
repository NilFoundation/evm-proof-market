
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployProofMarketFixture } = require("./fixtures.js");


describe("Proof market  tests", function () {
    let proofMarket, user, producer, relayer, testStatement;
    
    before(async function () {
        ({ proofMarket, owner, user, producer, relayer } = await deployProofMarketFixture());
        definition = {
            verificationKey: ethers.utils.formatBytes32String("Example verification key"),
            provingKey: ethers.utils.formatBytes32String("Example proving key")
        };
        price = { price: 100 };
        testStatement = {
            id: 567,
            definition: definition,
            price: price,
            developer: producer.address
        };
    });

    describe("Statement tests", function () {
        it("should create a new statement", async function () {
            const tx = await proofMarket.connect(relayer).addStatement(testStatement);
            const receipt = await tx.wait();
            const event = receipt.events.find((e) => e.event === "StatementAdded");

            expect(event.args.id).to.equal(testStatement.id);
            expect(event.args.definition.verificationKey)
            .to.equal(testStatement.definition.verificationKey);
            expect(event.args.definition.provingKey)
            .to.equal(testStatement.definition.provingKey);

            const statement = await proofMarket.getStatement(testStatement.id);

            expect(statement.id).to.equal(testStatement.id);
            expect(statement.definition.verificationKey)
            .to.equal(testStatement.definition.verificationKey);
            expect(statement.definition.provingKey)
            .to.equal(testStatement.definition.provingKey);
            expect(statement.price.price)
            .to.equal(testStatement.price.price);
        });

        it("should revert if the caller is not the contract owner", async function () {
            // connect to the contract as a non-owner
            const nonOwner = proofMarket.connect(user);

            await expect(nonOwner.addStatement(testStatement))
            .to.be.revertedWith(/AccessControl/);
        });

        it("should revert if the statement already exists", async function () {
            await expect(proofMarket.connect(relayer).addStatement(testStatement))
            .to.be.revertedWith("Statement ID already exists");
        });

        it("should update a statement", async function () {
            const statementId = testStatement.id;
            const updatedDefinition = {
                verificationKey: ethers.utils.formatBytes32String("Updated verification key"),
                provingKey: ethers.utils.formatBytes32String("Updated proving key")
            }
            const updatedPrice = { price: 200 };

            await expect(proofMarket.connect(relayer)
            .updateStatementDefinition(statementId, updatedDefinition))
            .to.emit(proofMarket, "StatementDefinitionUpdated");

            await expect(proofMarket.connect(relayer)
            .updateStatementPrice(statementId, updatedPrice))
            .to.emit(proofMarket, "StatementPriceUpdated");

            const statement = await proofMarket.getStatement(statementId);
            expect(statement.id).to.equal(statementId);
            expect(statement.definition.verificationKey).to.equal(updatedDefinition.verificationKey);
            expect(statement.definition.provingKey).to.equal(updatedDefinition.provingKey);
            expect(statement.price.price).to.equal(updatedPrice.price);
        });
    });

    describe("Order tests", function () {
        it("should create a new order", async function () {
            const statementId = testStatement.id;
            const input = ethers.utils.formatBytes32String("Example input");            
            const price = ethers.utils.parseUnits("10", 18);
            const testOrder = {
                statementId: statementId,
                input: input,
                price: price
            };

            const tx = await proofMarket.connect(user).createOrder(testOrder);
            const receipt = await tx.wait();
            const event = receipt.events.find((e) => e.event === "OrderCreated");

            expect(event.args.id).to.equal(1);
            expect(event.args.orderInput.statementId).to.equal(statementId);
            expect(event.args.orderInput.input).to.equal(input);
            expect(event.args.orderInput.price).to.equal(price);
            expect(event.args.buyer).to.equal(user.address);

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
            const testOrder = {
                statementId: statementId,
                input: input,
                price: price
            };

            await expect(proofMarket.connect(user).createOrder(testOrder))
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
    });

    describe("Upgradeability tests", function () {
        it("should upgrade the contract and preserve the state", async function () {
            // Upgrade the contract
            const ProofMarketV2 = await ethers.getContractFactory("ProofMarketEndpointV2");
            const proofMarketV2 = await upgrades.upgradeProxy(proofMarket.address, ProofMarketV2);

            // Check that the new contract has the new function
            const newApi = await proofMarketV2.newApi();
            expect(newApi).to.equal('new api');

            const statementId = testStatement.id;
            const input = ethers.utils.formatBytes32String("Example input");            
            const price = ethers.utils.parseUnits("10", 18);
            const orderId = 1;

            // Check that the state is preserved
            const order = await proofMarket.getOrder(orderId);
            expect(order.statementId).to.equal(statementId);
            expect(order.input).to.equal(input);
            expect(order.price).to.equal(price);
            expect(order.buyer).to.equal(user.address);

            // Check that the new field is set to the default value
            const orderV2 = await proofMarketV2.getOrder(orderId);
            expect(orderV2.newInt).to.equal(0);
        });
    });
});
