const { expect } = require("chai");
const { ethers } = require("hardhat");
const { execSync } = require('child_process'); // to run shell commands
const { spawn } = require('child_process');
const kill = require('tree-kill');
const net = require('net');

let hardhatNode;
const password = "123";
const privateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";


function runCommand(command) {
    try {
        const output = execSync(command);
        console.log(output.toString());
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}

/**
 * Checks if a specified port is in use, just by trying to connect to it.
 */
function checkIfPortIsInUse(port, callback) {
    const client = new net.Socket();

    client.on('connect', () => {
        client.destroy();
        callback(true);
    });

    client.on('error', (err) => {
        client.destroy();
        if (err.code === 'ECONNREFUSED') {
            callback(false);
        } else {
            callback(true);
        }
    });

    client.connect(port);
}

describe("Interaction scripts", function () {
    /**
     * Before hook to start a Hardhat node.
     * If the default port (8545) is in use, it assumes a node is already running and doesn't start a new one.
     * If not in use, it spawns a new Hardhat node.
     */
    before('Start hardhat node if not already running', function (done) {
        checkIfPortIsInUse(8545, function (inUse) {
            if (inUse) {
                console.log('Hardhat node already running.');
                hardhatNode = null;
                done();
            } else {
                console.log('Starting hardhat node...');
                hardhatNode = spawn('npx', ['hardhat', 'node'], {
                    stdio: 'pipe'
                });

                hardhatNode.stdout.on('data', (data) => {
                    if (data.toString().includes('Started HTTP and WebSocket')) {
                        done();
                    }
                });

                hardhatNode.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`);
                });

                hardhatNode.on('close', (code) => {
                    console.log(`child process exited with code ${code}`);
                });
            }
        });
    });

    /**
     * After hook to stop the Hardhat node.
     * It checks if a node was spawned in the before hook. 
     * If it was, it terminates that process; if not, it does nothing.
     */
    after('Stop hardhat node if it was started by us', function (done) {
        if (hardhatNode) {
            kill(hardhatNode.pid, 'SIGTERM', done);
        } else {
            done();
        }
    });

    it("should deploy contracts", async function () {
        const command = 'npx hardhat run scripts/deploy.js --network localhost';
        runCommand(command);
    });

    it("should add statements", async function () {
        const command = 'npx hardhat run scripts/addStatements.js --network localhost';
        runCommand(command);
    });

    it("should create a keystore file from test private key", async function () {
        const command = `node scripts/interact.js createKeystoreFromPrivateKey --pk ${privateKey} --password ${password}`;
        runCommand(command);
    });

    it("should mint and approve tokens:", async function () {
        const command = `node scripts/interact.js mintAndApprove --password ${password}`;
        runCommand(command);
    });
    
    it("should create a new order:", async function () {
        const password = "123";
        const statementId = 32326;
        const price = 100;
        const inputFilePath = 'scripts/test_inputs/unified_addition.json';
        const command = `node scripts/interact.js createOrder` +
            ` --statementId ${statementId} --price ${price}` +
            ` --inputFile ${inputFilePath} --password ${password}`;
        runCommand(command);
    });

});
