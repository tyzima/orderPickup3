const axios = require('axios');

exports.handler = async function(event, context) {
    const { orderNumbers } = JSON.parse(event.body);
    const shipstationApiKey = Buffer.from(`${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`).toString('base64');

    const headers = {
        'Authorization': `Basic ${shipstationApiKey}`,
        'Content-Type': 'application/json'
    };

    async function getOrder(orderNumber) {
        try {
            const response = await axios.get(`https://ssapi.shipstation.com/orders?orderNumber=${orderNumber}`, { headers });
            return response.data.orders[0]; // Assuming the first order is the one we need
        } catch (error) {
            console.error(`Failed to retrieve order for order number ${orderNumber}:`, error);
            return null;
        }
    }

    async function addTagToOrder(orderId, tagId) {
        try {
            const body = { orderId, tagId };
            await axios.post('https://ssapi.shipstation.com/orders/addtag', body, { headers });
            console.log(`Tag added to order ID ${orderId}`);
        } catch (error) {
            console.error(`Failed to add tag to order ID ${orderId}:`, error);
        }
    }

    try {
        for (const orderNumber of orderNumbers) {
            const order = await getOrder(orderNumber);
            if (order) {
                await addTagToOrder(order.orderId, process.env.SHIPSTATION_TAG_ID); // Ensure the tag ID is set in your env vars
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "ShipStation processing complete." })
        };
    } catch (error) {
        console.error('General error in processing ShipStation updates:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process updates in ShipStation" })
        };
    }
};
