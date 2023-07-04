const axios = require('axios');
const hre = require('hardhat');
const path = require('path');
const fs = require('fs');

const constants = JSON.parse(fs.readFileSync(path.join(__dirname, 'constants.json'), 'utf-8'));
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json'), 'utf-8'));

async function processOrderCreatedEvent(event) {
    const { statementId, input, price } = event.args.orderInput;
    const { id, buyer } = event.args;
    console.log('Order created:', id, statementId, input, price, buyer);

    const order = {
        cost: Number(hre.ethers.utils.formatUnits(price)),
        statement_key: String(statementId),
        input: String(input),
    };
    console.log('Submitting order:', order);

    try {
        const url = `${constants.serviceUrl}/request`;
        const response = await axios.post(url, order, {
            auth: {
                username: credentials.username,
                password: credentials.password
            }
        });
        if (response.status !== 200) {
            throw new Error(`Received status code ${response.status}`);
        }
        console.log('Order submitted successfully:', response.data);
    } catch (error) {
        console.error('Failed to submit order:', error);
    }
}

async function processOrderClosedEvent(event) {
    const orderId = event.args.orderId;
    console.log('Order closed:', orderId);
    await updateOrderStatus(orderId, 'closed');
}

async function updateOrderStatus(orderId, status) {
    try {
        const url = `${constants.serviceUrl}/request/${orderId}`;
        const response = await axios.patch(url, { status }, {
            auth: {
                username: credentials.username,
                password: credentials.password
            }
        });
        if (response.status !== 200) {
            throw new Error(`Received status code ${response.status}`);
        }
        console.log(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
        console.error(`Failed to update order ${orderId} status:`, error);
    }
}

module.exports = {
    processOrderCreatedEvent,
    processOrderClosedEvent
};
