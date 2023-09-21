const { expect } = require("chai");
const { ethers } = require("hardhat");
const { execSync } = require('child_process'); // to run shell commands


describe("Interaction scripts", function () {

    it("should deploy contracts", async function () {
        try {
            const output = execSync('npx hardhat run scripts/deploy.js --network localhost');
            console.log(output.toString());
        } catch (error) {
            console.error('Error deploying contracts:', error);
            throw error;
        }
    });

    it("should add statements", async function () {
        try {
            const output = execSync('npx hardhat run scripts/addStatements.js --network localhost');
            console.log(output.toString());
        } catch (error) {
            console.error('Error adding statements:', error);
            throw error;
        }
    });

    it("should create a keystore file from test private key", async function () {
        const privateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
        const password = "123";

        try {
            const output = execSync(`node scripts/interact.js createKeystoreFromPrivateKey --pk ${privateKey} --password ${password}`);
            console.log(output.toString());
        } catch (error) {
            console.error('Error creating keystore:', error);
            throw error;
        }
    });

    it("should mint and approve tokens:", async function () {
        const password = "123";

        try {
            const output = execSync(`node scripts/interact.js mintAndApprove --password ${password}`);
            console.log(output.toString());
        } catch (error) {
            console.error('Error creating keystore:', error);
            throw error;
        }
    });
    
    it("should create a new order:", async function () {
        const password = "123";
        const statementId = '32326';
        const price = 100;
        const inputFilePath = 'scripts/test_inputs/account_mina.json';
        try {
            const command = `node scripts/interact.js createOrder` +
            ` --statementId ${statementId} --price ${price}` +
            ` --inputFile ${inputFilePath} --password ${password}`;
            console.log(command);
            const output = execSync(command);
            console.log(output.toString());
        } catch (error) {
            console.error('Error creating keystore:', error);
            throw error;
        }
    });

});
