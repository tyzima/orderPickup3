
document.getElementById('lookupButton').addEventListener('click', function() {
    const orderNumber = document.getElementById('orderNumber').value;
    if (!orderNumber) {
        alert('Please enter an order number.');
        return;
    }

    fetch('/.netlify/functions/lookupOrder', {
        method: 'POST',
        body: JSON.stringify({ orderNumber: orderNumber }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            displayOrderDetails(data);
        }
    });
});

function displayOrderDetails(order) {
    const detailsDiv = document.getElementById('orderDetails');
    detailsDiv.innerHTML = `
        <p><strong>Customer Name:</strong> ${order.customerName}</p>
        <p><strong>Customer Email:</strong> ${order.customerEmail}</p>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Stage:</strong> ${order.stage}</p>
        <button onclick="updateOrderStage('${order.orderNumber}')">Picked Up</button>
    `;
}

function updateOrderStage(orderNumber) {
    fetch('/.netlify/functions/updateOrderStage', {
        method: 'POST',
        body: JSON.stringify({ orderNumber: orderNumber }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Order stage updated successfully!');
            displayOrderDetails({ ...data.order, stage: 'Picked Up' });
        } else {
            alert('Error updating order stage.');
        }
    });
}
