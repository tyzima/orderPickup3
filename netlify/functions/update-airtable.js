const axios = require('axios');
const Airtable = require('airtable');

exports.handler = async function(event, context) {
    // Parse the incoming data
    const { orders } = JSON.parse(event.body);
    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const orderNumbersForShipstation = [];

    try {
        // Process each order
        for (const order of orders) {
            console.log("Processing order:", order.order_id); // Log the order ID being processed

            // Determine if the order is for pickup
            const shipMethod = order.ship_to?.method;
            const isPickup = ['PICK-UP AT LAX.COM', 'PICK-UP @ LAX.COM'].includes(shipMethod);
            const tags = isPickup ? ["PICK UP"] : [];

            // Prepare the data for Airtable
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
            console.log("Airtable record created for order:", order.order_id); // Log successful creation

            // If the order is for pickup, prepare to send to Shipstation
            if (isPickup) {
                orderNumbersForShipstation.push(order.order_id);
            }
        }

        // If there are any orders to send to Shipstation, send them
        if (orderNumbersForShipstation.length > 0) {
            console.log("Sending orders to Shipstation:", orderNumbersForShipstation);
            await axios.post(`${process.env.NETLIFY_SITE_URL}/.netlify/functions/update-shipstation`, {
                orderNumbers: orderNumbersForShipstation
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Airtable and Shipstation updated successfully." })
        };
    } catch (error) {
        console.error('Error in processing:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to process orders",
                details: error.message
            })
        };
    }
};
