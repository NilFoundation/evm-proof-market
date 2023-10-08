
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployProofMarketFixture } = require("./fixtures.js");
const { getVerifierParams } = require("./utils.js");
const { deployments } = hre;

describe("Proof market tests", function () {
    let proofMarket, user, producer, relayer, testStatement, testOrder;
    
    before(async function () {
        ({ proofMarket, owner, user, producer, relayer } = await deployProofMarketFixture());
        await deployments.fixture(['unifiedAdditionVerifierFixture']);
        let unifiedAdditionVerifier = await ethers.getContract('UnifiedAdditionVerifier');
        definition = {
            verificationKey: ethers.utils.formatBytes32String("Example verification key"),
            provingKey: ethers.utils.formatBytes32String("Example proving key")
        };
        price = { orderBook: [[100], [100]] };
        testStatement = {
            id: 567,
            definition: definition,
            price: price,
            developer: producer.address,
            verifiers: [unifiedAdditionVerifier.address]
        };

        testOrder = {
            statementId: testStatement.id,
            publicInputs: [[1,2,3]],
            price: ethers.utils.parseUnits("10", 18)
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
        });

        it("should revert if the caller is not the relayer", async function () {
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
            const updatedPrice = { orderBook: [[100], [100]] };

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
            for (let i = 0; i < statement.price.orderBook.length; i++) {
                for (let j = 0; j < statement.price.orderBook[i].length; j++) {
                    expect(statement.price.orderBook[i][j]).to.equal(updatedPrice.orderBook[i][j]);
                }
            }
        });

        it("should remove a statement", async function () {
            let newStatement = Object.assign({}, testStatement);
            newStatement.id += 2;

            await proofMarket.connect(relayer).addStatement(newStatement);

            await expect(proofMarket.connect(relayer).removeStatement(newStatement.id))
            .to.emit(proofMarket, "StatementRemoved");

            // get the statement and check status
            const statement = await proofMarket.getStatement(newStatement.id);
            expect(statement.status).to.equal(1); // StatementStatus.INACTIVE
        });

    });

    describe("Order tests", function () {
        it("should create a new order", async function () {
            const statementId = testStatement.id;
            const tx = await proofMarket.connect(user).createOrder(testOrder);
            const receipt = await tx.wait();
            const event = receipt.events.find((e) => e.event === "OrderCreated");

            // TODO: check array equality
            expect(event.args.id).to.equal(1);
            expect(event.args.orderInput.statementId).to.equal(statementId);
            // expect(event.args.orderInput.publicInputs).to.equal(testOrder.publicInputs);
            expect(event.args.orderInput.price).to.equal(testOrder.price);
            expect(event.args.buyer).to.equal(user.address);

            const order = await proofMarket.getOrder(1);
            expect(order.statementId).to.equal(statementId);
            // expect(order.publicInputs).to.equal(testOrder.publicInputs);
            expect(order.price).to.equal(testOrder.price);
            expect(order.buyer).to.equal(user.address);
            expect(order.status).to.equal(0); // OrderStatus.OPEN
        });

        it("should revert if the statement does not exist", async function () {
            let newOrder = Object.assign({}, testOrder);
            newOrder.statementId += 1;

            await expect(proofMarket.connect(user).createOrder(newOrder))
            .to.be.revertedWith("Statement does not exist or is inactive");
        });

        it("should set producer", async function () {
            const orderId = 1;
            await expect(proofMarket.connect(relayer).setProducer(orderId, producer.address))
            .to.emit(proofMarket, "OrderProcessing")
            .withArgs(orderId, producer.address);
        });

        it("should close an order", async function () {
            const orderId = 1;
            const finalPrice = ethers.utils.parseUnits("9", 18);

            let configPath = "./data/unified_addition/lambda2.json"
            let proofPath = "./data/unified_addition/lambda2.data"
            let publicInputPath = "./data/unified_addition/public_input.json";
            let params = getVerifierParams(configPath, proofPath, publicInputPath);
            const proof = [params.proof]
            await expect(proofMarket.connect(relayer).closeOrder(
                orderId,
                proof,
                finalPrice
            ))
            .to.emit(proofMarket, "OrderClosed");
            // .withArgs(orderId, producer.address, finalPrice, proof);
        });

        it("should revert if the caller is not the relayer", async function () {
            const orderId = 1;
            const proof = [ethers.utils.formatBytes32String("Example proof")];
            const finalPrice = ethers.utils.parseUnits("9", 18);

            const nonRelayer = proofMarket.connect(user);

            await expect(nonRelayer.closeOrder(orderId, proof, finalPrice))
            .to.be.revertedWith(/AccessControl/);
        });
    });


    describe("Access control tests", function () {
        it("should grant the relayer role to the relayer", async function () {
            const hasRole = await proofMarket.hasRole(proofMarket.RELAYER_ROLE(), relayer.address);
            expect(hasRole).to.be.true;
        });

        it("should revoke the relayer role from the relayer", async function () {
            await proofMarket.connect(owner).revokeRole(proofMarket.RELAYER_ROLE(), relayer.address);
            let hasRole = await proofMarket.hasRole(proofMarket.RELAYER_ROLE(), relayer.address);
            expect(hasRole).to.be.false;
            await proofMarket.connect(owner).grantRole(proofMarket.RELAYER_ROLE(), relayer.address);
            hasRole = await proofMarket.hasRole(proofMarket.RELAYER_ROLE(), relayer.address);
            expect(hasRole).to.be.true;
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
            const price = ethers.utils.parseUnits("10", 18);
            const orderId = 1;

            // Check that the state is preserved
            const order = await proofMarket.getOrder(orderId);
            expect(order.statementId).to.equal(statementId);
            expect(order.price).to.equal(price);
            expect(order.buyer).to.equal(user.address);
        });
    });


});
