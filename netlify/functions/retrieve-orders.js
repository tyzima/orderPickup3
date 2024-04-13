const axios = require('axios');

exports.handler = async function(event, context) {
    // Validate necessary environment variables
    if (!process.env.OMG_API_TOKEN || !process.env.NETLIFY_SITE_URL) {
        console.error('Missing necessary configuration.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error. Please check environment variables." })
        };
    }

    const { storeCode } = JSON.parse(event.body);

    // Function to fetch orders recursively
    async function fetchOrders(page = 1) {
        const limit = 5;
        const url = `https://app.ordermygear.com/export/order_api/${storeCode}?limit=${limit}&page=${page}`;
        console.log(`Fetching orders from: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.OMG_API_TOKEN}`
            }
        });
        const data = response.data;

        // Check if there are orders to send to Airtable
        if (data.exports && data.exports.length > 0) {
            await sendToAirtable({ orders: data.exports });
        } else {
            console.log(`No orders found on page ${page}.`);
        }

        // Recursively fetch the next page if available
        if (data.meta && data.meta.paging && data.meta.paging.next) {
            console.log(`Fetching next page: ${page + 1}`);
            await fetchOrders(page + 1);
        } else {
            console.log('No more pages to fetch.');
        }
    }

    // Function to send data to the Airtable function
    async function sendToAirtable(data) {
        const netlifySiteUrl = process.env.NETLIFY_SITE_URL;
        console.log(`Sending data to Airtable function at: ${netlifySiteUrl}/.netlify/functions/update-airtable`);
        await axios.post(`${netlifySiteUrl}/.netlify/functions/update-airtable`, data);
    }

    try {
        await fetchOrders();  // Start fetching from page 1
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Orders retrieved and processed successfully." })
        };
    } catch (error) {
        console.error('Error retrieving orders:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to retrieve orders", details: error.message })
        };
    }
};
