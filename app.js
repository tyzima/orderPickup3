
document.addEventListener('DOMContentLoaded', function() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#barcode-scanner')
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
        }
    }, function(err) {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function(data) {
        let scannedBarcode = data.codeResult.code;
        document.getElementById('scanned-barcode').textContent = scannedBarcode;
        lookupOrder(scannedBarcode);
    });
});

function lookupOrder(orderNumber) {
    fetch('/.netlify/functions/lookupOrder', {
        method: 'POST',
        body: JSON.stringify({ orderNumber: orderNumber }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        displayOrderDetails(data);
    });
}

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
        displayOrderDetails({ ...data.order, stage: 'Picked Up' });
    });
}

