const axios = require('axios');

async function retrieveOrdersFromOMG(event, context) {
  const body = JSON.parse(event.body);
  const storeCode = body.store_code;

  const ordersData = await processOrders(storeCode);
  console.log(`Total orders processed: ${ordersData.length}`);

  return {
    statusCode: 200,
    body: JSON.stringify({ ordersData })
  };
}

async function processOrders(storeCode) {
  const baseOmgEndpoint = 'https://app.ordermygear.com';
  const apiEndpoint = `/export/order_api/${storeCode}`;
  const omgToken = `Bearer ${process.env.OMG_API_TOKEN}`;
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
        const orderData = {
          email: order.customer?.email,
          phone: order.customer?.phone,
          player_name: order.player_name,
          name: store.name,
          order_id: order.order_id,
          store_id: store.store_id,
          ship_to: order.ship_to
        };
        ordersData.push(orderData);
      }
    }
  }
  const nextPageUrl = responseData.meta?.paging?.next;
  return [ordersData, nextPageUrl];
}

module.exports = { retrieveOrdersFromOMG };
