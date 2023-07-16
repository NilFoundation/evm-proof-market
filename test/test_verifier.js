
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployProofMarketFixture } = require("./fixtures.js");
const { getVerifierParams, getVerifierParamsAccount, getVerifierParamsState } = require("./utils.js");
const { deployments } = hre;


describe('Proof validation tests', function () {
    let proofMarket, user, producer, relayer, testStatement, testOrder;
    
    before(async function () {
        ({ proofMarket, owner, user, producer, relayer } = await deployProofMarketFixture());

        // await deployments.fixture(['unifiedAdditionVerifierFixture']);
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
            publicInputs: [[1, 2, 3]],
            price: ethers.utils.parseUnits("10", 18)
        };

        await proofMarket.connect(relayer).addStatement(testStatement);
    });

    describe('Unified Addition Proof', function () {
        it("Should verify correct proof", async function () {
            const tx = await proofMarket.connect(user).createOrder(testOrder);
            const receipt = await tx.wait();
            const orderCreatedEvent = receipt.events.find(
                (e) => e.event === "OrderCreated"
            );
            const orderId = orderCreatedEvent.args.id;

            await expect(proofMarket.connect(relayer).setProducer(orderId, producer.address))
            .to.emit(proofMarket, "OrderProcessing")
            .withArgs(orderId, producer.address);
            
            let configPath = "./data/unified_addition/lambda2.json"
            let proofPath = "./data/unified_addition/lambda2.data"
            let publicInputPath = "./data/unified_addition/public_input.json";
            let params = getVerifierParams(configPath,proofPath, publicInputPath);
            const proof = [params.proof];
  
            await expect(proofMarket.connect(relayer).closeOrder(
                orderId,
                proof,
                testOrder.price
            ))
            .to.emit(proofMarket, "OrderClosed");
        });
    })

    describe('Mina Account Proof', function () {
        it("Should verify correct proof", async function () {
            await deployments.fixture(['minaAccountProofVerifierFixture']);
            let minaAccountProofVerifier = await ethers.getContract('AccountPathVerifier');
            let tx = await proofMarket.connect(relayer).updateStatementVerifiers(
                testStatement.id,
                [minaAccountProofVerifier.address]
            );
            await tx.wait();
            
            let params = getVerifierParamsAccount();
            testOrder.publicInputs = [params.public_inputs];

            tx = await proofMarket.connect(user).createOrder(testOrder);
            const receipt = await tx.wait();
            const orderCreatedEvent = receipt.events.find(
                (e) => e.event === "OrderCreated"
            );
            const orderId = orderCreatedEvent.args.id;

            await expect(proofMarket.connect(relayer).setProducer(orderId, producer.address))
            .to.emit(proofMarket, "OrderProcessing")
            .withArgs(orderId, producer.address);
            
            const proof = [params.proof];
  
            await expect(proofMarket.connect(relayer).closeOrder(
                orderId,
                proof,
                testOrder.price,
                {gasLimit: 30_500_000}
            ))
            .to.emit(proofMarket, "OrderClosed");
        });
    })

    describe('Mina State Proof', function () {
        it("Should verify correct proof", async function () {
            let params = getVerifierParamsState();
            await deployments.fixture(['minaStateProofVerifierFixture']);
            let minaStateProofVerifier = await ethers.getContract('MinaStateVerifier');

            let tx = await proofMarket.connect(relayer).updateStatementVerifiers(
                testStatement.id,
                [minaStateProofVerifier.address]
            );
            await tx.wait();

            // TODO: set public input
            testOrder.publicInputs = [[1, 2, 3]];
            tx = await proofMarket.connect(user).createOrder(testOrder);
            const receipt = await tx.wait();
            const orderCreatedEvent = receipt.events.find(
                (e) => e.event === "OrderCreated"
            );
            const orderId = orderCreatedEvent.args.id;

            await expect(proofMarket.connect(relayer).setProducer(
                orderId,
                producer.address,
                {gasLimit: 30_500_000}))
            .to.emit(proofMarket, "OrderProcessing")
            .withArgs(orderId, producer.address);

            const proof = [params.proof];
            await expect(proofMarket.connect(relayer).closeOrder(
                orderId,
                proof,
                testOrder.price,
                {gasLimit: 30_500_000}
            ))
            .to.emit(proofMarket, "OrderClosed");
        });
    })
});