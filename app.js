
document.addEventListener('DOMContentLoaded', function() {
    initializeBarcodeScanner();
});

function initializeBarcodeScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#barcode-scanner')
        },
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader"
            ]
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
}

function lookupOrder(orderNumber) {
    fetch('/.netlify/functions/lookupOrder', {
        method: 'POST',
        body: JSON.stringify({ orderNumber: orderNumber }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.orderNumber && data.orderNumber !== 'undefined') {
            // Stop scanning only if a valid record is returned
            Quagga.stop();
            displayOrderDetails(data);
        } else {
            console.log("No valid record found for this barcode.");
            // Optionally, display a message to the user or handle this case as needed
        }
    });
}

function displayOrderDetails(order) {
    const detailsDiv = document.getElementById('orderDetails');
    detailsDiv.innerHTML = `
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        <p><strong>Order #:</strong> ${order.orderNumber}</p>
        <p><strong>Status:</strong> ${order.stage}</p>
        <button onclick="updateOrderStage('${order.orderNumber}')">Mark as Picked Up</button>
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
        initializeBarcodeScanner();  // Restart scanning after updating order status
    });
}
