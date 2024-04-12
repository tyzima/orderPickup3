const axios = require('axios');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { storecode } = JSON.parse(event.body);

    // Define OMG API endpoint
    const OMG_ENDPOINT = `https://app.ordermygear.com/export/order_api/${storecode}`;
    const OMG_TOKEN = `Bearer ${process.env.OMG_BEARER_TOKEN}`;

    // Fetch orders from OMG
    const response = await axios.get(OMG_ENDPOINT, {
      headers: {
        Authorization: OMG_TOKEN
      }
    });

    // Filter for specific shipping methods and gather order IDs
    const orderIDs = response.data.exports.flatMap(store => 
      store.orders.filter(order => 
        order.ship_to.method === 'PICK-UP AT LAX.COM' || order.ship_to.method === 'PICK-UP @ LAX.COM'
      ).map(order => order.order_id)
    );

    // If orderIDs array is not empty, send a webhook
    if (orderIDs.length > 0) {
      const webhookUrl = 'https://hooks.zapier.com/hooks/catch/53953/3n28yd5/'; // Replace with your actual webhook URL
      await axios.post(webhookUrl, {
        order_ids: orderIDs.join(', ')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

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
