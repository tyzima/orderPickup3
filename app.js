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

    document.querySelector('#barcode-scanner').innerHTML = `<?xml version="1.0" encoding="UTF-8"?>
<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 576">
  <defs>
    <style>
      .cls-1 {
        fill: none;
      }

      .cls-1, .cls-2 {
        stroke-width: 0px;
      }

      .cls-2 {
        fill: #e0e0e0;
      }
    </style>
  </defs>
  <g>
    <g>
      <rect class="cls-2" x="329.26" y="195.03" width="14.3" height="55.85"/>
      <rect class="cls-2" x="286.35" y="195.03" width="28.61" height="55.85"/>
      <rect class="cls-2" x="243.44" y="195.03" width="14.3" height="55.85"/>
      <rect class="cls-2" x="200.53" y="195.03" width="28.61" height="55.85"/>
      <path class="cls-2" d="M429.38,173.58v50.06h14.3v-50.06c-.02-19.74-16.02-35.73-35.76-35.76h-50.06v14.3h50.06c11.84.02,21.44,9.61,21.45,21.45Z"/>
      <rect class="cls-2" x="357.86" y="325.12" width="28.61" height="55.85"/>
      <rect class="cls-2" x="357.86" y="195.03" width="28.61" height="55.85"/>
      <rect class="cls-2" x="243.44" y="325.12" width="14.3" height="55.85"/>
      <rect class="cls-2" x="286.35" y="325.12" width="28.61" height="55.85"/>
      <rect class="cls-2" x="329.26" y="325.12" width="14.3" height="55.85"/>
      <path class="cls-2" d="M157.63,173.58c.02-11.84,9.61-21.44,21.45-21.45h50.06v-14.3h-50.06c-19.74.02-35.73,16.02-35.76,35.76v50.06h14.3v-50.06Z"/>
      <path class="cls-2" d="M429.38,402.42c-.02,11.84-9.61,21.44-21.45,21.45h-50.06v14.3h50.06c19.74-.02,35.73-16.02,35.76-35.76v-50.06h-14.3v50.06Z"/>
      <rect class="cls-2" x="200.53" y="325.12" width="28.61" height="55.85"/>
      <path class="cls-2" d="M157.63,402.42v-50.06h-14.3v50.06c.02,19.74,16.02,35.73,35.76,35.76h50.06v-14.3h-50.06c-11.84-.02-21.44-9.61-21.45-21.45Z"/>
    </g>
    <g>
      <path class="cls-2" d="M119.14,301.6v-3.63h11.28v1.32l.81.81h19.02l.64-.64v-3.8l-.43-.43h-26.37l-4.79-4.79v-7.91l5.43-5.43h32.26l5,5v3.63h-11.28v-1.41l-.81-.81h-18.67l-.64.64v3.68l.43.43h26.37l4.79,4.79v8.12l-5.43,5.43h-32.61l-5-5Z"/>
      <path class="cls-2" d="M169.23,300.31v-23.2h11.28v19.87l2.52,2.52h15.43l2.52-2.52v-19.87h11.28v23.2l-6.28,6.28h-30.47l-6.28-6.28Z"/>
      <path class="cls-2" d="M219.52,300.31v-16.92l6.28-6.28h31.97l6.28,6.28v5.3h-11.28v-2.65l-2.09-2.09h-17.35l-2.52,2.52v10.77l2.52,2.52h17.35l2.09-2.09v-2.86h11.28v5.51l-6.28,6.28h-31.97l-6.28-6.28Z"/>
      <path class="cls-2" d="M270.24,300.31v-16.92l6.28-6.28h31.96l6.28,6.28v5.3h-11.28v-2.65l-2.09-2.09h-17.35l-2.52,2.52v10.77l2.52,2.52h17.35l2.09-2.09v-2.86h11.28v5.51l-6.28,6.28h-31.96l-6.28-6.28Z"/>
      <path class="cls-2" d="M321.82,277.11h36.28v6.41h-25v5h22.61v6.37h-22.61v5.3h25.08v6.41h-36.37v-29.49Z"/>
      <path class="cls-2" d="M364.38,301.6v-3.63h11.28v1.32l.81.81h19.02l.64-.64v-3.8l-.43-.43h-26.37l-4.79-4.79v-7.91l5.43-5.43h32.26l5,5v3.63h-11.28v-1.41l-.81-.81h-18.68l-.64.64v3.68l.43.43h26.37l4.79,4.79v8.12l-5.43,5.43h-32.61l-5-5Z"/>
      <path class="cls-2" d="M413.82,301.6v-3.63h11.28v1.32l.81.81h19.02l.64-.64v-3.8l-.43-.43h-26.37l-4.79-4.79v-7.91l5.43-5.43h32.26l5,5v3.63h-11.28v-1.41l-.81-.81h-18.68l-.64.64v3.68l.43.43h26.37l4.79,4.79v8.12l-5.43,5.43h-32.61l-5-5Z"/>
    </g>
  </g>
  <rect class="cls-1" width="576" height="576"/>
</svg>`;
        
            
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
  const detailsDiv = document.getElementById('orderDetails');
        detailsDiv.innerHTML = ''; // This clears the order details right away

        // Get the button and update its text to "Success"
        const button = document.querySelector('.OrderDetailsbutton');
        button.textContent = 'Success';

        // Delay the disappearance of the button
        setTimeout(() => {
            // Hide the button after a slight delay
            button.style.display = 'none';

            // Clear any SVG or content from the barcode scanner area
            const scannerDiv = document.querySelector('#barcode-scanner');
            scannerDiv.innerHTML = '';

            // Restart the barcode scanner
            initializeBarcodeScanner();  // This assumes your barcode scanner can be cleanly initialized again
        }, 2000); // 2000 ms delay for the button to disappear
        
        displayOrderDetails({ ...data.order, stage: 'Picked Up' });
        
    // Remove success class and add loading class to restart scanning
    var svgElement = document.querySelector('#Layer_1');
    svgElement.classList.remove('svg-success');
    svgElement.classList.add('svg-loading');
    initializeBarcodeScanner();  // Restart scanning after updating order status
    
    });
}
