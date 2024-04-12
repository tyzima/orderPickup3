import json
import requests
from requests.auth import HTTPBasicAuth
from tqdm import tqdm
import os  # Import os to access environment variables

# Handler for Netlify Functions
def handler(event, context):
    body = json.loads(event['body'])
    store_code = body.get('store_code')  # Store code passed via webhook payload

    # Process and update orders
    orders_data = process_orders(store_code)
    print(f"Total orders processed: {len(orders_data)}")
    update_airtable(orders_data)

    order_numbers = [order['order_id'] for order in orders_data]  # Extract order IDs for use in ShipStation
    tag_id = 81744  # Specified tag ID
    order_ids = get_order_ids(order_numbers)
    update_orders_with_tag(order_ids, tag_id)

    return {
        'statusCode': 200,
        'body': json.dumps({"message": "Script execution completed."})
    }

def process_orders(store_code):
    base_omg_endpoint = 'https://app.ordermygear.com'
    api_endpoint = f'/export/order_api/{store_code}'
    omg_token = f'Bearer {os.getenv("OMG_API_TOKEN")}'  # Environment variable for API token
    headers = {'Authorization': omg_token}
    current_page_url = f'{api_endpoint}?limit=40&page=1'
    all_orders_data = []
    print("Processing orders...")
    with tqdm(desc="Pages processed", unit="page") as pbar:
        while current_page_url:
            try:
                page_orders_data, next_page_url = fetch_orders(base_omg_endpoint, current_page_url, headers)
                all_orders_data.extend(page_orders_data)
                current_page_url = next_page_url
                pbar.update(1)
            except Exception as e:
                print('Error processing orders:', str(e))
                break
    return all_orders_data

def fetch_orders(base_url, url, headers):
    full_url = base_url + url if url.startswith('/export') else url
    response = requests.get(full_url, headers=headers)
    response_data = response.json()
    orders_data = []
    if response_data.get('exports'):
        for store in response_data['exports']:
            orders = store.get('orders', [])
            for order in orders:
                if order.get('ship_to', {}).get('method') in ['PICK-UP AT LAX.COM', 'PICK-UP @ LAX.COM']:
                    order_data = {
                        'email': order.get('customer', {}).get('email'),
                        'phone': order.get('customer', {}).get('phone'),
                        'player_name': order.get('player_name'),
                        'name': store.get('name'),
                        'order_id': order.get('order_id'),
                        'store_id': store.get('store_id'),
                    }
                    orders_data.append(order_data)
    next_page_url = response_data.get('meta', {}).get('paging', {}).get('next')
    return orders_data, next_page_url

def update_airtable(orders_data):
    airtable_api_key = os.getenv("AIRTABLE_API_KEY")  # Environment variable for Airtable API key
    airtable_base_id = os.getenv("AIRTABLE_BASE_ID")  # Environment variable for Airtable Base ID
    airtable_table_name = 'Orders'
    headers = {
        'Authorization': f'Bearer {airtable_api_key}',
        'Content-Type': 'application/json'
    }
    print("Updating Airtable...")
    batch_size = 10  # Airtable allows up to 10 records per request
    for i in tqdm(range(0, len(orders_data), batch_size), desc="Batches processed"):
        batch = orders_data[i:i+batch_size]
        records = [{'fields': {
            "Order Number": order['order_id'],
            "Customer Name": order['player_name'],
            "Customer Email": order['email'],
            "Store Name Helper": order['name'],
            "Phone": order['phone'],
            "Stage": "Waiting to Send",
            "Store ID": order['store_id'],
            "Tags": ["PICK UP"]
        }} for order in batch]
        create_url = f'https://api.airtable.com/v0/{airtable_base_id}/{airtable_table_name}'
        create_data = {'records': records}
        response = requests.post(create_url, headers=headers, json=create_data)
        if response.status_code != 200:
            print(f"Error in batch starting with order ID: {batch[0]['order_id']} - Status: {response.status_code}, Response: {response.text}")

def get_order_ids(order_numbers):
    api_url = "https://ssapi.shipstation.com/orders"
    auth = HTTPBasicAuth(os.getenv("SHIPSTATION_API_KEY"), os.getenv("SHIPSTATION_API_SECRET"))  # Environment variables for API key and secret
    headers = {
        'Content-Type': 'application/json'
    }
    order_ids = []
    for order_number in order_numbers:
        params = {'orderNumber': order_number}
        response = requests.get(api_url, headers=headers, auth=auth, params=params)
        if response.status_code == 200:
            orders = response.json().get('orders', [])
            for order in orders:
                order_ids.append(order.get('orderId'))
        else:
            print(f"Failed to retrieve data for order number: {order_number}")
            print("Status Code:", response.status_code)
            print("Response:", response.text)
    return order_ids

def update_orders_with_tag(order_ids, tag_id):
    api_url = "https://ssapi.shipstation.com/orders/addtag"
    auth = HTTPBasicAuth(os.getenv("SHIPSTATION_API_KEY"), os.getenv("SHIPSTATION_API_SECRET"))  # Environment variables for API key and secret
    headers = {
        'Content-Type': 'application/json'
    }
    for order_id in order_ids:
        data = json.dumps({
            'orderId': order_id,
            'tagId': tag_id
        })
        response = requests.post(api_url, headers=headers, auth=auth, data=data)
        if response.status_code != 200:
            print(f"Failed to update order ID: {order_id} with tag ID: {tag_id}")
            print("Status Code:", response.status_code)
            print("Response:", response.text)
        else:
            print(f"Successfully updated order ID: {order_id} with tag ID: {tag_id}")
