const axios = require('axios');
const Airtable = require('airtable');

exports.handler = async function(event, context) {
    const { orders } = JSON.parse(event.body);
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const orderNumbersForShipstation = [];

    try {
        for (const order of orders) {
            const shipMethod = order.ship_to?.method;
            const isPickup = ['PICK-UP AT LAX.COM', 'PICK-UP @ LAX.COM'].includes(shipMethod);
            const tags = isPickup ? ["PICK UP"] : [];

            const fields = {
                "Order Number": order.order_id,
                "Customer Name": order.player_name,
                "Customer Email": order.customer.email,
                "Store Name Helper": order.name,
                "Phone": order.customer.phone,
                "Stage": "Waiting to Send",
                "Store ID": order.store_id,
                "Tags": tags
            };

            // Create a record in Airtable
            await base('Orders').create([{ fields }]);

            // Collect order numbers for Shipstation if pickup is required
            if (isPickup) {
                orderNumbersForShipstation.push(order.order_id);
            }
        }

        // Send to Shipstation if any orders require pickup
        if (orderNumbersForShipstation.length > 0) {
            await axios.post('/.netlify/functions/update-shipstation', { orderNumbers: orderNumbersForShipstation });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Airtable and Shipstation updated successfully." })
        };
    } catch (error) {
        console.error('Failed to update Airtable:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to update Airtable" })
        };
    }
};
