
const path = require('path');
const { spawn } = require('child_process');

const scripts = [
    // path.join(__dirname, 'priceRelay.js'),
    path.join(__dirname, 'orderRelay.js'),
    path.join(__dirname, 'proofRelay.js')
];

function runScript(script) {
    const child = spawn('npx', ['hardhat', 'run', '--network', 'localhost', script]);

    child.stdout.on('data', (data) => {
        console.log(`Output from ${script}: ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`Error from ${script}: ${data}`);
    });

    child.on('close', (code) => {
        console.log(`Script ${script} exited with code ${code}`);
    });
}

scripts.forEach(runScript);
