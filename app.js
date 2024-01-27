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

    
    // Add the loading class when starting the scan
    document.querySelector('#Layer_1').classList.add('svg-loading');
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
            
    // Remove loading class and add success class on successful scan
    var svgElement = document.querySelector('#Layer_1');
    svgElement.classList.remove('svg-loading');
    svgElement.classList.add('svg-success');
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
        <p><strong>${order.customerName}</strong></p>
        <p><strong>✉️ Email:</strong> ${order.customerEmail}</p>
        <p><strong>🔢 Order:</strong> ${order.orderNumber}</p>
        <p class="stage-pill"><strong>${order.stage}</strong></p>
    `;

    // Check if the button already exists
    let button = document.querySelector('.OrderDetailsbutton');
    
    // If the button does not exist, create and append it
    if (!button) {
        button = document.createElement('button');
        button.textContent = 'Mark as Picked Up';
        button.className = 'OrderDetailsbutton';
        button.onclick = function() {
            updateOrderStage(order.orderNumber);
        };

        // Append the button to the container div or another suitable element
        document.querySelector('.container').appendChild(button);
    } else {
        // If the button already exists, update its onclick event with the new order number
        button.onclick = function() {
            updateOrderStage(order.orderNumber);
        };
    }
}


function updateOrderStage(orderNumber) {
    fetch('/.netlify/functions/updateOrderStage', {
        method: 'POST',
        body: JSON.stringify({ orderNumber: orderNumber }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        // Instead of displaying order details, clear them
        const detailsDiv = document.getElementById('orderDetails');
        if (detailsDiv) {
            detailsDiv.innerHTML = ''; // Clear the content
        }

        // Hide the button
        const button = document.querySelector('.OrderDetailsbutton');
        if (button) {
            button.style.display = 'none';
        }
        
        // Remove success class and add loading class to restart scanning
        var svgElement = document.querySelector('#Layer_1');
        svgElement.classList.remove('svg-success');
        svgElement.classList.add('svg-loading');
        initializeBarcodeScanner();  // Restart scanning after updating order status
    })
    .catch(error => {
        console.error('Error updating order stage:', error);
    });
}
