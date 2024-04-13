const axios = require('axios');

async function retrieveOrderIdsAndAddTags(event, context) {
  const body = JSON.parse(event.body);
  const orderNumbers = body.orderNumbers;
  const tagId = 81744;

  const orderIds = await getOrderIds(orderNumbers);
  await updateOrdersWithTag(orderIds, tagId);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Script execution completed." })
  };
}

async function getOrderIds(orderNumbers) {
  const apiUrl = "https://ssapi.shipstation.com/orders";
  const apiKey = process.env.SHIPSTATION_API_KEY;
  const apiSecret = process.env.SHIPSTATION_API_SECRET;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
  };
  const orderIds = [];
  for (const orderNumber of orderNumbers) {
    const params = { orderNumber };
    const response = await axios.get(apiUrl, { headers, params });
    if (response.status === 200) {
      const orders = response.data.orders || [];
      for (const order of orders) {
        orderIds.push(order.orderId);
      }
    } else {
      console.error(`Failed to retrieve data for order number: ${orderNumber}`);
      console.error("Status Code:", response.status);
      console.error("Response:", response.data);
    }
  }
  return orderIds;
}

async function updateOrdersWithTag(orderIds, tagId) {
  const apiUrl = "https://ssapi.shipstation.com/orders/addtag";
  const apiKey = process.env.SHIPSTATION_API_KEY;
  const apiSecret = process.env.SHIPSTATION_API_SECRET;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
  };
  for (const orderId of orderIds) {
    const data = JSON.stringify({
      orderId,
      tagId
    });
    const response = await axios.post(apiUrl, data, { headers });
    if (response.status !== 200) {
      console.error(`Failed to update order ID: ${orderId} with tag ID: ${tagId}`);
      console.error("Status Code:", response.status);
      console.error("Response:", response.data);
    } else {
      console.log(`Successfully updated order ID: ${orderId} with tag ID: ${tagId}`);
    }
  }
}

module.exports = { retrieveOrderIdsAndAddTags };
