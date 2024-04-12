const axios = require('axios');
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { storecode } = JSON.parse(event.body);

    // Define OMG API endpoint and token
    const BASE_OMG_ENDPOINT = `https://app.ordermygear.com/export/order_api/${storecode}`;
    const OMG_TOKEN = `Bearer ${process.env.OMG_BEARER_TOKEN}`;

    // Function to fetch pages recursively
    async function fetchOrders(url) {
      const response = await axios.get(url, {
        headers: { Authorization: OMG_TOKEN }
      });

      const orders = response.data.exports.flatMap(store => store.orders.filter(order =>
        order.ship_to.method === 'PICK-UP AT LAX.COM' || order.ship_to.method === 'PICK-UP @ LAX.COM'
      ).map(order => order.order_id));

      if (response.data.meta.paging.next) {
        // Recursively fetch the next page
        return orders.concat(await fetchOrders(response.data.meta.paging.next));
      } else {
        return orders;
      }
    }

    // Start fetching from the initial URL
    const initialUrl = `${BASE_OMG_ENDPOINT}?limit=10&page=1`;
    const orderIds = await fetchOrders(initialUrl);

    // Create a comma-separated string of order IDs
    const orderIdsString = orderIds.join(',');

    // Send the comma-separated list of order IDs to the webhook
    await axios.post('https://hooks.zapier.com/hooks/catch/53953/3n28yd5/', {
      orderIds: orderIdsString
    });

    return {
      statusCode: 200,
      body: 'Webhook processed successfully'
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: `Server Error: ${error.message}`
    };
  }
};
