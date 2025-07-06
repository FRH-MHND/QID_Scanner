// QID Scanner Utilities for ERPNext
// Global utilities that can be used across the app

window.QIDUtils = {
    // QR Code generation utility
    generateQRCode: function(text, container, options = {}) {
        const defaultOptions = {
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode?.CorrectLevel?.M || 0
        };
        
        const qrOptions = Object.assign(defaultOptions, options);
        
        if (typeof QRCode !== 'undefined') {
            container.empty();
            const qrDiv = $('<div>').appendTo(container);
            new QRCode(qrDiv[0], {
                text: text,
                ...qrOptions
            });
        } else {
            // Fallback: Load QRCode library
            this.loadQRCodeLibrary().then(() => {
                this.generateQRCode(text, container, options);
            }).catch(() => {
                // Final fallback: show text
                container.html(`
                    <div class="text-center">
                        <i class="fa fa-qrcode fa-4x text-muted"></i>
                        <p class="mt-2">QR Code:</p>
                        <small><code style="word-break: break-all;">${text}</code></small>
                    </div>
                `);
            });
        }
    },
    
    // Load QRCode library dynamically
    loadQRCodeLibrary: function() {
        return new Promise((resolve, reject) => {
            if (typeof QRCode !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Validate QID number format
    validateQIDFormat: function(qidNumber) {
        const qidClean = String(qidNumber).replace(/[^\d]/g, '');
        
        if (qidClean.length !== 11) {
            return {
                valid: false,
                error: `QID must be 11 digits, got ${qidClean.length}`
            };
        }
        
        const centuryDigit = qidClean[0];
        if (!['2', '3'].includes(centuryDigit)) {
            return {
                valid: false,
                error: `Invalid century digit: ${centuryDigit}. Must be 2 or 3`
            };
        }
        
        return {
            valid: true,
            qid_number: qidClean
        };
    },
    
    // Format QID number for display
    formatQID: function(qidNumber) {
        const qidClean = String(qidNumber).replace(/[^\d]/g, '');
        if (qidClean.length === 11) {
            return `${qidClean.substr(0, 3)}-${qidClean.substr(3, 4)}-${qidClean.substr(7, 4)}`;
        }
        return qidNumber;
    },
    
    // Camera utilities
    camera: {
        // Check if camera is supported
        isSupported: function() {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        },
        
        // Get available cameras
        getDevices: async function() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                return devices.filter(device => device.kind === 'videoinput');
            } catch (error) {
                console.error('Failed to get camera devices:', error);
                return [];
            }
        },
        
        // Request camera permission
        requestPermission: async function(facingMode = 'environment') {
            try {
                const constraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                return stream;
            } catch (error) {
                throw new Error(`Camera access denied: ${error.message}`);
            }
        }
    },
    
    // Image processing utilities
    image: {
        // Convert image to base64
        toBase64: function(canvas, quality = 0.9) {
            return canvas.toDataURL('image/jpeg', quality);
        },
        
        // Resize image if too large
        resize: function(canvas, maxWidth = 1200) {
            const ctx = canvas.getContext('2d');
            const { width, height } = canvas;
            
            if (width <= maxWidth) {
                return canvas;
            }
            
            const scale = maxWidth / width;
            const newWidth = width * scale;
            const newHeight = height * scale;
            
            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = newWidth;
            resizedCanvas.height = newHeight;
            
            const resizedCtx = resizedCanvas.getContext('2d');
            resizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
            
            return resizedCanvas;
        }
    },
    
    // ERPNext integration utilities
    erpnext: {
        // Show QID results in a dialog
        showQIDResults: function(result) {
            const data = result.data;
            const validation = result.validation;
            
            let message = `
                <div class="qid-results">
                    <div class="row">
                        <div class="col-md-6">
                            <h6><i class="fa fa-id-card"></i> QID Information</h6>
                            <table class="table table-sm">
                                <tr><td><strong>QID Number:</strong></td><td><code>${data.qid_number || 'N/A'}</code></td></tr>
                                <tr><td><strong>Nationality:</strong></td><td>${data.nationality || 'N/A'}</td></tr>
                                <tr><td><strong>Date of Birth:</strong></td><td>${data.date_of_birth || 'N/A'}</td></tr>
                                <tr><td><strong>Expiry Date:</strong></td><td>${data.expiry_date || 'N/A'}</td></tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="fa fa-user"></i> Name Information</h6>
                            <table class="table table-sm">
            `;
            
            if (data.full_name?.english) {
                message += `<tr><td><strong>English:</strong></td><td>${data.full_name.english}</td></tr>`;
            }
            if (data.full_name?.arabic) {
                message += `<tr><td><strong>Arabic:</strong></td><td dir="rtl">${data.full_name.arabic}</td></tr>`;
            }
            
            message += `
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            frappe.msgprint({
                title: 'QID Information Extracted',
                message: message,
                indicator: 'green'
            });
        },
        
        // Add QID scanner button to forms
        addQIDScannerButton: function(frm, fieldname, callback) {
            frm.add_custom_button('Scan QID', function() {
                // Open QID scanner in a dialog
                const dialog = new frappe.ui.Dialog({
                    title: 'QID Scanner',
                    size: 'large',
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'scanner_html',
                            options: `
                                <div id="qid-scanner-dialog">
                                    <div class="text-center">
                                        <p>QID Scanner will be loaded here</p>
                                        <button class="btn btn-primary" onclick="window.open('/app/qid-scanner', '_blank')">
                                            <i class="fa fa-camera"></i> Open QID Scanner
                                        </button>
                                    </div>
                                </div>
                            `
                        }
                    ]
                });
                
                dialog.show();
            }, 'Actions');
        },
        
        // Populate form fields from QID data
        populateFormFromQID: function(frm, qidData) {
            const data = qidData.data;
            
            // Common field mappings
            const fieldMappings = {
                'qid_number': data.qid_number,
                'qatar_id': data.qid_number,
                'nationality': data.nationality,
                'date_of_birth': data.date_of_birth,
                'birth_date': data.date_of_birth,
                'first_name': data.full_name?.english?.split(' ')[0],
                'last_name': data.full_name?.english?.split(' ').slice(1).join(' '),
                'full_name': data.full_name?.english,
                'employee_name': data.full_name?.english,
                'customer_name': data.full_name?.english
            };
            
            // Set fields that exist in the form
            Object.keys(fieldMappings).forEach(fieldname => {
                if (frm.fields_dict[fieldname] && fieldMappings[fieldname]) {
                    frm.set_value(fieldname, fieldMappings[fieldname]);
                }
            });
            
            // Refresh form
            frm.refresh();
            
            // Show success message
            frappe.show_alert({
                message: 'QID information populated successfully',
                indicator: 'green'
            });
        }
    }
};

// Auto-load QRCode library when needed
$(document).ready(function() {
    // Pre-load QRCode library for better performance
    if (typeof QRCode === 'undefined') {
        QIDUtils.loadQRCodeLibrary().catch(() => {
            console.log('QRCode library not loaded - will use fallback');
        });
    }
});

