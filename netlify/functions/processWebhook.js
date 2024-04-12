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
    const OMG_TOKEN = 'Bearer YOUR_OMG_BEARER_TOKEN';
const OMG_ENDPOINT = `https://app.ordermygear.com/export/order_api/${storecode}`;
const OMG_TOKEN = `Bearer ${process.env.OMG_BEARER_TOKEN}`;

    // Fetch orders from OMG
    const response = await axios.get(OMG_ENDPOINT, {
      headers: {
        Authorization: OMG_TOKEN
      }
    });
    // Filter for specific shipping methods
    const orders = response.data.exports.flatMap(store => store.orders.filter(order =>
      order.ship_to.method === 'PICK-UP AT LAX.COM' || order.ship_to.method === 'PICK-UP @ LAX.COM'
    ));
    // Check and update Airtable
    for (const order of orders) {
      const airtableRecord = await findAirtableRecord(order.order_id);
      if (airtableRecord) {
        await updateAirtable(airtableRecord.id, order);
      } else {
        await addToAirtable(order);
      }
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

// Find Airtable record by Order ID
async function findAirtableRecord(orderId) {
  const AIRTABLE_ENDPOINT = 'https://api.airtable.com/v0/YOUR_BASE_ID/YOUR_TABLE_NAME';
  const AIRTABLE_ENDPOINT = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
  const response = await axios.get(`${AIRTABLE_ENDPOINT}?filterByFormula={Order ID}='${orderId}'`, {
    headers: {
      Authorization: 'Bearer YOUR_AIRTABLE_API_KEY',
      Authorization: 'Bearer ${process.env.AIRTABLE_API_KEY}',
      'Content-Type': 'application/json'
    }
  });
  return response.data.records[0] ? response.data.records[0] : null;
}

// Add a new order to Airtable
async function addToAirtable(order) {
  const AIRTABLE_ENDPOINT = 'https://api.airtable.com/v0/YOUR_BASE_ID/YOUR_TABLE_NAME';
  const AIRTABLE_ENDPOINT = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
  await axios.post(AIRTABLE_ENDPOINT, {
    fields: {
      "Order Number": order.order_id,
      "Customer Name": order.customer.first_name + ' ' + order.customer.last_name,
      "Tags": "PICK UP",
      "Phone": order.customer.phone,
      "Customer Email": order.customer.email,
      "Store Name": order.name,
      "24 Store ID": order.store_id
    }
  }, {
    headers: {
      Authorization: 'Bearer YOUR_AIRTABLE_API_KEY',
      Authorization: 'Bearer ${process.env.AIRTABLE_API_KEY}',
      'Content-Type': 'application/json'
    }
  });
}

// Update an existing order in Airtable to add the 'PICK UP' tag
async function updateAirtable(recordId, order) {
  const AIRTABLE_ENDPOINT = `https://api.airtable.com/v0/YOUR_BASE_ID/YOUR_TABLE_NAME/${recordId}`;
  const AIRTABLE_ENDPOINT = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}/${recordId}`;
  await axios.patch(AIRTABLE_ENDPOINT, {
    fields: {
      "Tags": "PICK UP"  
    }
  }, {
    headers: {
      Authorization: 'Bearer YOUR_AIRTABLE_API_KEY',
      Authorization: 'Bearer ${process.env.AIRTABLE_API_KEY}',
      'Content-Type': 'application/json'
    }
  });
}
