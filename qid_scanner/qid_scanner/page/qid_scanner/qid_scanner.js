frappe.pages['qid-scanner'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'QID Scanner',
        single_column: true
    });
    
    // Initialize QID Scanner
    new QIDScanner(page);
};

class QIDScanner {
    constructor(page) {
        this.page = page;
        this.wrapper = page.wrapper;
        this.mode = this.detectDeviceMode();
        this.sessionId = this.generateSessionId();
        this.stream = null;
        this.facingMode = 'environment'; // Start with back camera
        
        this.init();
    }
    
    init() {
        // Load the HTML template
        this.loadTemplate();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize based on device mode
        this.initializeMode();
        
        // Setup page actions
        this.setupPageActions();
    }
    
    loadTemplate() {
        // The HTML template is loaded automatically by ERPNext
        // We just need to ensure our elements are ready
        this.ensureElements();
    }
    
    ensureElements() {
        // Wait for elements to be available
        setTimeout(() => {
            this.elements = {
                modesContainer: this.wrapper.find('#qid-modes'),
                cameraInterface: this.wrapper.find('#camera-interface'),
                resultsSection: this.wrapper.find('#results-section'),
                errorSection: this.wrapper.find('#error-section'),
                qrCodeContainer: this.wrapper.find('#qr-code-container'),
                mobileUrlText: this.wrapper.find('#mobile-url-text'),
                cameraVideo: this.wrapper.find('#camera-video')[0],
                cameraCanvas: this.wrapper.find('#camera-canvas')[0],
                captureBtn: this.wrapper.find('#capture-btn'),
                processingIndicator: this.wrapper.find('#processing-indicator'),
                useDesktopCameraBtn: this.wrapper.find('#use-desktop-camera-btn'),
                scanAnotherBtn: this.wrapper.find('#scan-another-btn'),
                retryBtn: this.wrapper.find('#retry-btn'),
                switchCameraBtn: this.wrapper.find('#switch-camera-btn'),
                qidInfoBtn: this.wrapper.find('#qid-info-btn'),
                qidValidateBtn: this.wrapper.find('#qid-validate-btn'),
                errorMessage: this.wrapper.find('#error-message'),
                resultsContent: this.wrapper.find('#results-content')
            };
            
            // Initialize after elements are ready
            this.initializeMode();
        }, 100);
    }
    
    detectDeviceMode() {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const modeParam = urlParams.get('mode');
        if (modeParam === 'mobile') {
            return 'mobile';
        }
        
        // Detect device type
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobile ? 'mobile' : 'desktop';
    }
    
    generateSessionId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    setupEventListeners() {
        // Use event delegation since elements might not exist yet
        $(this.wrapper).on('click', '#use-desktop-camera-btn', () => {
            this.switchToMobileMode();
        });
        
        $(this.wrapper).on('click', '#capture-btn', () => {
            this.captureImage();
        });
        
        $(this.wrapper).on('click', '#scan-another-btn', () => {
            this.resetScanner();
        });
        
        $(this.wrapper).on('click', '#retry-btn', () => {
            this.resetScanner();
        });
        
        $(this.wrapper).on('click', '#switch-camera-btn', () => {
            this.switchCamera();
        });
        
        $(this.wrapper).on('click', '#qid-info-btn', () => {
            this.showApiInfo();
        });
        
        $(this.wrapper).on('click', '#qid-validate-btn', () => {
            this.showValidateDialog();
        });
        
        $(this.wrapper).on('click', '#validate-qid-btn', () => {
            this.validateQidNumber();
        });
    }
    
    setupPageActions() {
        // Add page actions
        this.page.set_primary_action('Scan QID', () => {
            if (this.mode === 'desktop') {
                this.switchToMobileMode();
            } else {
                this.captureImage();
            }
        }, 'fa fa-camera');
        
        this.page.add_action_icon('fa fa-info', () => {
            this.showApiInfo();
        }, 'API Info');
        
        this.page.add_action_icon('fa fa-check', () => {
            this.showValidateDialog();
        }, 'Validate QID');
    }
    
    initializeMode() {
        if (!this.elements) return;
        
        if (this.mode === 'mobile') {
            this.initializeMobileMode();
        } else {
            this.initializeDesktopMode();
        }
    }
    
    initializeDesktopMode() {
        this.elements.modesContainer.show();
        this.elements.cameraInterface.hide();
        this.generateQRCode();
        this.updateMobileUrl();
    }
    
    initializeMobileMode() {
        this.elements.modesContainer.hide();
        this.elements.cameraInterface.show();
        this.initializeCamera();
    }
    
    switchToMobileMode() {
        this.mode = 'mobile';
        this.initializeMobileMode();
    }
    
    generateQRCode() {
        const mobileUrl = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}&mode=mobile`;
        
        // Use QRCode library if available, otherwise show URL
        if (typeof QRCode !== 'undefined') {
            this.elements.qrCodeContainer.empty();
            const qrCodeDiv = $('<div>').appendTo(this.elements.qrCodeContainer);
            
            new QRCode(qrCodeDiv[0], {
                text: mobileUrl,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            // Fallback: show URL as text
            this.elements.qrCodeContainer.html(`
                <div class="text-center">
                    <i class="fa fa-qrcode fa-4x text-muted"></i>
                    <p class="mt-2">QR Code URL:</p>
                    <small><code>${mobileUrl}</code></small>
                </div>
            `);
        }
    }
    
    updateMobileUrl() {
        const mobileUrl = `${window.location.origin}${window.location.pathname}?mode=mobile`;
        this.elements.mobileUrlText.text(mobileUrl);
    }
    
    async initializeCamera() {
        try {
            // Check if camera is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported in this browser');
            }
            
            // Request camera permission
            const constraints = {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.elements.cameraVideo.srcObject = this.stream;
            
            // Show switch camera button if multiple cameras available
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoDevices.length > 1) {
                this.elements.switchCameraBtn.show();
            }
            
        } catch (error) {
            console.error('Camera initialization failed:', error);
            this.showError(`Camera access failed: ${error.message}`);
        }
    }
    
    async switchCamera() {
        try {
            // Stop current stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            // Switch facing mode
            this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
            
            // Reinitialize camera
            await this.initializeCamera();
            
        } catch (error) {
            console.error('Camera switch failed:', error);
            this.showError(`Camera switch failed: ${error.message}`);
        }
    }
    
    captureImage() {
        try {
            if (!this.elements.cameraVideo || !this.elements.cameraCanvas) {
                throw new Error('Camera not initialized');
            }
            
            // Set canvas dimensions to match video
            const video = this.elements.cameraVideo;
            const canvas = this.elements.cameraCanvas;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw video frame to canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64
            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Process the image
            this.processImage(imageData);
            
        } catch (error) {
            console.error('Image capture failed:', error);
            this.showError(`Image capture failed: ${error.message}`);
        }
    }
    
    async processImage(imageData) {
        try {
            this.showProcessing(true);
            
            // Call ERPNext backend
            const response = await frappe.call({
                method: 'qid_scanner.qid_scanner.page.qid_scanner.qid_scanner.process_qid_image',
                args: {
                    image_data: imageData,
                    metadata: {
                        session_id: this.sessionId,
                        device_type: this.mode,
                        timestamp: new Date().toISOString()
                    }
                }
            });
            
            this.showProcessing(false);
            
            if (response.message && response.message.success) {
                this.showResults(response.message);
            } else {
                const error = response.message?.error || 'Unknown error occurred';
                this.showError(typeof error === 'string' ? error : error.message || 'Processing failed');
            }
            
        } catch (error) {
            this.showProcessing(false);
            console.error('Image processing failed:', error);
            this.showError(`Processing failed: ${error.message || 'Unknown error'}`);
        }
    }
    
    showResults(result) {
        // Hide other sections
        this.elements.cameraInterface.hide();
        this.elements.modesContainer.hide();
        this.elements.errorSection.hide();
        
        // Show results section
        this.elements.resultsSection.show();
        
        // Populate results
        this.populateResults(result);
        
        // Show success message
        frappe.show_alert({
            message: 'QID information extracted successfully!',
            indicator: 'green'
        });
    }
    
    populateResults(result) {
        const data = result.data;
        const validation = result.validation;
        const metadata = result.processing_metadata;
        
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fa fa-id-card"></i> QID Information</h6>
                    <table class="table table-borderless">
                        <tr>
                            <td><strong>QID Number:</strong></td>
                            <td><code>${data.qid_number || 'N/A'}</code></td>
                        </tr>
                        <tr>
                            <td><strong>Nationality:</strong></td>
                            <td>${data.nationality || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td><strong>Date of Birth:</strong></td>
                            <td>${data.date_of_birth || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td><strong>Expiry Date:</strong></td>
                            <td>${data.expiry_date || 'N/A'}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6><i class="fa fa-user"></i> Name Information</h6>
                    <table class="table table-borderless">
        `;
        
        if (data.full_name?.english) {
            html += `
                        <tr>
                            <td><strong>Name (English):</strong></td>
                            <td>${data.full_name.english}</td>
                        </tr>
            `;
        }
        
        if (data.full_name?.arabic) {
            html += `
                        <tr>
                            <td><strong>Name (Arabic):</strong></td>
                            <td dir="rtl">${data.full_name.arabic}</td>
                        </tr>
            `;
        }
        
        html += `
                    </table>
                </div>
            </div>
            
            <hr>
            
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fa fa-chart-bar"></i> Confidence Scores</h6>
                    <div class="confidence-scores">
        `;
        
        const scores = data.confidence_scores || {};
        const scoreItems = [
            { key: 'qid_number', label: 'QID Number' },
            { key: 'name', label: 'Name' },
            { key: 'date_of_birth', label: 'Birth Date' },
            { key: 'nationality', label: 'Nationality' },
            { key: 'overall', label: 'Overall' }
        ];
        
        scoreItems.forEach(item => {
            const score = scores[item.key] || 0;
            const percentage = Math.round(score * 100);
            const colorClass = this.getConfidenceColorClass(score);
            
            html += `
                        <div class="confidence-item mb-2">
                            <span class="badge ${colorClass}">${item.label}: ${percentage}%</span>
                        </div>
            `;
        });
        
        html += `
                    </div>
                </div>
                <div class="col-md-6">
                    <h6><i class="fa fa-info-circle"></i> Processing Info</h6>
                    <table class="table table-borderless">
                        <tr>
                            <td><strong>Processing Time:</strong></td>
                            <td>${metadata.processing_time?.toFixed(2) || 'N/A'}s</td>
                        </tr>
                        <tr>
                            <td><strong>OCR Engine:</strong></td>
                            <td>${metadata.ocr_engines_used?.join(', ') || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td><strong>Timestamp:</strong></td>
                            <td>${new Date(metadata.timestamp).toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        
        // Add warnings if any
        if (validation.warnings && validation.warnings.length > 0) {
            html += `
                <hr>
                <div class="alert alert-warning">
                    <h6><i class="fa fa-exclamation-triangle"></i> Warnings</h6>
                    <ul class="mb-0">
            `;
            validation.warnings.forEach(warning => {
                html += `<li>${warning}</li>`;
            });
            html += `
                    </ul>
                </div>
            `;
        }
        
        this.elements.resultsContent.html(html);
    }
    
    getConfidenceColorClass(score) {
        if (score >= 0.9) return 'badge-success';
        if (score >= 0.7) return 'badge-warning';
        return 'badge-danger';
    }
    
    showError(message) {
        // Hide other sections
        this.elements.cameraInterface.hide();
        this.elements.modesContainer.hide();
        this.elements.resultsSection.hide();
        
        // Show error section
        this.elements.errorSection.show();
        this.elements.errorMessage.text(message);
        
        // Show error alert
        frappe.show_alert({
            message: `Error: ${message}`,
            indicator: 'red'
        });
    }
    
    showProcessing(show) {
        if (show) {
            this.elements.processingIndicator.show();
            this.elements.captureBtn.prop('disabled', true);
        } else {
            this.elements.processingIndicator.hide();
            this.elements.captureBtn.prop('disabled', false);
        }
    }
    
    resetScanner() {
        // Hide results and errors
        this.elements.resultsSection.hide();
        this.elements.errorSection.hide();
        
        // Show appropriate interface based on mode
        if (this.mode === 'mobile') {
            this.elements.cameraInterface.show();
        } else {
            this.elements.modesContainer.show();
        }
    }
    
    async showApiInfo() {
        try {
            const response = await frappe.call({
                method: 'qid_scanner.qid_scanner.page.qid_scanner.qid_scanner.get_api_info'
            });
            
            const info = response.message;
            
            const dialog = new frappe.ui.Dialog({
                title: 'QID Scanner API Information',
                fields: [
                    {
                        fieldtype: 'HTML',
                        fieldname: 'api_info',
                        options: `
                            <div class="api-info">
                                <h5>${info.service}</h5>
                                <p><strong>Version:</strong> ${info.version}</p>
                                <p><strong>Description:</strong> ${info.description}</p>
                                
                                <h6>Capabilities:</h6>
                                <ul>
                                    ${info.capabilities.map(cap => `<li>${cap}</li>`).join('')}
                                </ul>
                                
                                <h6>Supported Formats:</h6>
                                <ul>
                                    ${info.supported_formats.map(format => `<li>${format}</li>`).join('')}
                                </ul>
                                
                                <p><small><strong>Timestamp:</strong> ${new Date(info.timestamp).toLocaleString()}</small></p>
                            </div>
                        `
                    }
                ]
            });
            
            dialog.show();
            
        } catch (error) {
            frappe.show_alert({
                message: `Failed to get API info: ${error.message}`,
                indicator: 'red'
            });
        }
    }
    
    showValidateDialog() {
        const dialog = new frappe.ui.Dialog({
            title: 'Validate QID Number',
            fields: [
                {
                    fieldtype: 'Data',
                    fieldname: 'qid_number',
                    label: 'QID Number',
                    reqd: 1,
                    description: 'Enter the 11-digit Qatar ID number (e.g., 28425001234)'
                }
            ],
            primary_action_label: 'Validate',
            primary_action: (values) => {
                this.validateQidNumber(values.qid_number);
                dialog.hide();
            }
        });
        
        dialog.show();
    }
    
    async validateQidNumber(qidNumber) {
        if (!qidNumber) {
            const dialog = frappe.ui.get_open_dialog();
            if (dialog) {
                qidNumber = dialog.get_value('qid_number');
            }
        }
        
        if (!qidNumber) {
            frappe.show_alert({
                message: 'Please enter a QID number',
                indicator: 'red'
            });
            return;
        }
        
        try {
            const response = await frappe.call({
                method: 'qid_scanner.qid_scanner.page.qid_scanner.qid_scanner.validate_qid_number',
                args: {
                    qid_number: qidNumber
                }
            });
            
            const result = response.message;
            
            if (result.valid) {
                const info = result.parsed_info;
                frappe.msgprint({
                    title: 'QID Validation Result',
                    message: `
                        <div class="qid-validation-result">
                            <div class="alert alert-success">
                                <h6><i class="fa fa-check-circle"></i> Valid QID Number</h6>
                            </div>
                            
                            <table class="table table-borderless">
                                <tr>
                                    <td><strong>QID Number:</strong></td>
                                    <td><code>${result.qid_number}</code></td>
                                </tr>
                                <tr>
                                    <td><strong>Birth Year:</strong></td>
                                    <td>${info.birth_year}</td>
                                </tr>
                                <tr>
                                    <td><strong>Age:</strong></td>
                                    <td>${info.age} years</td>
                                </tr>
                                <tr>
                                    <td><strong>Nationality:</strong></td>
                                    <td>${info.nationality} (${info.nationality_code})</td>
                                </tr>
                            </table>
                        </div>
                    `,
                    indicator: 'green'
                });
            } else {
                frappe.msgprint({
                    title: 'QID Validation Result',
                    message: `
                        <div class="alert alert-danger">
                            <h6><i class="fa fa-times-circle"></i> Invalid QID Number</h6>
                            <p>${result.error}</p>
                        </div>
                    `,
                    indicator: 'red'
                });
            }
            
        } catch (error) {
            frappe.show_alert({
                message: `Validation failed: ${error.message}`,
                indicator: 'red'
            });
        }
    }
    
    destroy() {
        // Clean up camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Cleanup when page is destroyed
frappe.pages['qid-scanner'].on_page_show = function(wrapper) {
    // Page is being shown
};

frappe.pages['qid-scanner'].on_page_hide = function(wrapper) {
    // Cleanup when page is hidden
    if (window.qidScanner) {
        window.qidScanner.destroy();
    }
};

