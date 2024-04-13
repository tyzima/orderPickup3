const axios = require('axios');

exports.handler = async function(event, context) {
    const { storeCode } = JSON.parse(event.body);

    // Function to fetch orders recursively
    async function fetchOrders(page = 1) {
        const limit = 5;
        const response = await axios.get(`https://app.ordermygear.com/export/order_api/${storeCode}?limit=${limit}&page=${page}`, {
            headers: {
                'Authorization': `Bearer ${process.env.OMG_API_TOKEN}`
            }
        });
        const data = response.data;

        // Send data to Airtable
        await sendToAirtable({ orders: data.exports });

        // Check if there's a next page and recursively fetch if true
        if (data.meta.paging.next) {
            await fetchOrders(page + 1);
        }
    }

    // Function to send data to the Airtable function
   async function sendToAirtable(data) {
    const netlifySiteUrl = process.env.NETLIFY_SITE_URL; // Make sure this is set in your Netlify environment variables
    await axios.post(`${netlifySiteUrl}/.netlify/functions/update-airtable`, data);
}

    try {
        await fetchOrders();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Orders retrieved and processed successfully." })
        };
    } catch (error) {
        console.error('Error retrieving orders:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to retrieve orders" })
        };
    }
};
