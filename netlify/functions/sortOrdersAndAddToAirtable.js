const axios = require('axios');

async function sortOrdersAndAddToAirtable(event, context) {
  const body = JSON.parse(event.body);
  const ordersData = body.ordersData;

  const pickUpOrders = ordersData.filter(order =>
    ['PICK-UP AT LAX.COM', 'PICK-UP @ LAX.COM'].includes(order.ship_to?.method)
  );

  const regularOrders = ordersData.filter(order =>
    !['PICK-UP AT LAX.COM', 'PICK-UP @ LAX.COM'].includes(order.ship_to?.method)
  );

  await updateAirtable(pickUpOrders, true);
  await updateAirtable(regularOrders, false);

  const orderNumbers = pickUpOrders.map(order => order.order_id);

  return {
    statusCode: 200,
    body: JSON.stringify({ orderNumbers })
  };
}

async function updateAirtable(ordersData, isPickUp) {
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;
  const airtableTableName = 'Orders';
  const headers = {
    'Authorization': `Bearer ${airtableApiKey}`,
    'Content-Type': 'application/json'
  };
  console.log("Updating Airtable...");
  const batchSize = 10;
  for (let i = 0; i < ordersData.length; i += batchSize) {
    const batch = ordersData.slice(i, i + batchSize);
    const records = batch.map(order => ({
      fields: {
        "Order Number": order.order_id,
        "Customer Name": order.player_name,
        "Customer Email": order.email,
        "Store Name Helper": order.name,
        "Phone": order.phone,
        "Stage": "Waiting to Send",
        "Store ID": order.store_id,
        "Tags": isPickUp ? ["PICK UP"] : []
      }
    }));
    const createUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
    const createData = { records };
    const response = await axios.post(createUrl, createData, { headers });
    if (response.status !== 200) {
      console.error(`Error in batch starting with order ID: ${batch[0].order_id} - Status: ${response.status}, Response: ${response.data}`);
    }
  }
}

module.exports = { sortOrdersAndAddToAirtable };
