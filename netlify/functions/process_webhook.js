const axios = require('axios');

// Handler for Netlify Functions
async function handler(event, context) {
  const body = JSON.parse(event.body);
  const storeCode = body.store_code;

  // Process and update orders
  const ordersData = await processOrders(storeCode);
  console.log(`Total orders processed: ${ordersData.length}`);
  await updateAirtable(ordersData);

  const orderNumbers = ordersData.map(order => order.order_id); // Extract order IDs for use in ShipStation
  const tagId = 81744; // Specified tag ID
  const orderIds = await getOrderIds(orderNumbers);
  await updateOrdersWithTag(orderIds, tagId);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Script execution completed." })
  };
}

async function processOrders(storeCode) {
    const baseOmgEndpoint = 'https://app.ordermygear.com';
    const apiEndpoint = `/export/order_api/${storeCode}`;
    const omgToken = `Bearer ${process.env.OMG_API_TOKEN}`; // Environment variable for API token
    const headers = { 'Authorization': omgToken };
    let currentPageUrl = `${apiEndpoint}?limit=40&page=1`;
    const allOrdersData = [];
    console.log("Processing orders...");
    while (currentPageUrl) {
        try {
            const [pageOrdersData, nextPageUrl] = await fetchOrders(baseOmgEndpoint, currentPageUrl, headers);
            allOrdersData.push(...pageOrdersData);
            currentPageUrl = nextPageUrl;
        } catch (e) {
            console.error('Error processing orders:', e.message);
            break;
        }
    }
    return allOrdersData;
}

async function fetchOrders(baseUrl, url, headers) {
    const fullUrl = url.startsWith('/export') ? baseUrl + url : url;
    const response = await axios.get(fullUrl, { headers });
    const responseData = response.data;
    const ordersData = [];
    if (responseData.exports) {
        for (const store of responseData.exports) {
            const orders = store.orders || [];
            for (const order of orders) {
                if (['PICK-UP AT LAX.COM', 'PICK-UP @ LAX.COM'].includes(order.ship_to?.method)) {
                    const orderData = {
                        email: order.customer?.email,
                        phone: order.customer?.phone,
                        player_name: order.player_name,
                        name: store.name,
                        order_id: order.order_id,
                        store_id: store.store_id,
                    };
                    ordersData.push(orderData);
                }
            }
        }
    }
    const nextPageUrl = responseData.meta?.paging?.next;
    return [ordersData, nextPageUrl];
}

async function updateAirtable(ordersData) {
    const airtableApiKey = process.env.AIRTABLE_API_KEY; // Environment variable for Airtable API key
    const airtableBaseId = process.env.AIRTABLE_BASE_ID; // Environment variable for Airtable Base ID
    const airtableTableName = 'Orders';
    const headers = {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
    };
    console.log("Updating Airtable...");
    const batchSize = 10; // Airtable allows up to 10 records per request
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
                "Tags": ["PICK UP"]
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

async function getOrderIds(orderNumbers) {
    const apiUrl = "https://ssapi.shipstation.com/orders";
    const apiKey = process.env.SHIPSTATION_API_KEY; // Environment variable for API key
    const apiSecret = process.env.SHIPSTATION_API_SECRET; // Environment variable for API secret
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
    const apiKey = process.env.SHIPSTATION_API_KEY; // Environment variable for API key
    const apiSecret = process.env.SHIPSTATION_API_SECRET; // Environment variable for API secret
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



module.exports = { handler };
