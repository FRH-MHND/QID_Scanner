# QID Scanner ERPNext App - Installation Guide

This guide provides step-by-step instructions for installing and configuring the QID Scanner app in your ERPNext environment.

## 📋 Prerequisites

### **System Requirements**

- **ERPNext**: Version 13.0+ (recommended: latest stable)
- **Python**: 3.8+ (included with ERPNext)
- **Operating System**: Ubuntu 20.04+, CentOS 8+, or macOS 10.15+
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: 500MB free space for dependencies

### **Required System Packages**

#### **Ubuntu/Debian**
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-ara tesseract-ocr-eng
sudo apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1
```

#### **CentOS/RHEL**
```bash
sudo yum update -y
sudo yum install -y tesseract tesseract-langpack-ara tesseract-langpack-eng
sudo yum install -y mesa-libGL glib2 libSM libXext libXrender libgomp
```

#### **macOS**
```bash
brew install tesseract tesseract-lang
```

### **Verify Tesseract Installation**
```bash
tesseract --version
# Should output: tesseract 4.x.x or higher

tesseract --list-langs
# Should include: ara, eng
```

## 🚀 Installation Steps

### **Step 1: Download the App**

#### **Option A: From Archive**
```bash
# Navigate to your bench directory
cd /path/to/your/bench

# Extract the app (assuming you have the qid_scanner_erpnext.zip)
unzip qid_scanner_erpnext.zip -d apps/
mv apps/qid_scanner_erpnext apps/qid_scanner
```

#### **Option B: From Git Repository**
```bash
# Navigate to your bench directory
cd /path/to/your/bench

# Clone the repository
bench get-app qid_scanner https://github.com/your-repo/qid_scanner.git
```

#### **Option C: Local Development**
```bash
# Navigate to your bench directory
cd /path/to/your/bench

# Copy the app directory
cp -r /path/to/qid_scanner_erpnext apps/qid_scanner
```

### **Step 2: Install Python Dependencies**

```bash
# Navigate to bench directory
cd /path/to/your/bench

# Install dependencies for the specific site
bench --site your-site-name pip install pytesseract opencv-python pillow numpy regex

# Alternative: Install globally for all sites
./env/bin/pip install pytesseract opencv-python pillow numpy regex
```

### **Step 3: Install the App**

```bash
# Install the app on your site
bench --site your-site-name install-app qid_scanner

# You should see output like:
# Installing qid_scanner...
# Updating DocTypes for qid_scanner: 100%
# Updating customizations for qid_scanner...
```

### **Step 4: Build Assets**

```bash
# Build the frontend assets
bench build --app qid_scanner

# Or build all apps
bench build
```

### **Step 5: Restart Services**

```bash
# Restart all bench services
bench restart

# Or restart individual services
bench restart web
bench restart worker
```

### **Step 6: Clear Cache**

```bash
# Clear all caches
bench --site your-site-name clear-cache
bench --site your-site-name clear-website-cache

# Reload the site
bench --site your-site-name reload-doc
```

## ✅ Verification

### **Step 1: Check App Installation**

```bash
# List installed apps
bench --site your-site-name list-apps

# You should see qid_scanner in the list
```

### **Step 2: Verify Dependencies**

```bash
# Test Python dependencies
bench --site your-site-name console

# In the console, run:
import pytesseract
import cv2
import numpy as np
from PIL import Image
print("All dependencies loaded successfully!")
exit()
```

### **Step 3: Test Tesseract**

```bash
# Create a test image with text
echo "Test QID: 28425001234" | convert label:@- test.png

# Test OCR
tesseract test.png stdout

# Should output: Test QID: 28425001234
rm test.png
```

### **Step 4: Access the App**

1. **Login to ERPNext**
2. **Navigate to QID Scanner**:
   - Method 1: Go to **Modules** → **QID Scanner**
   - Method 2: Use search bar: type "QID Scanner"
   - Method 3: Direct URL: `https://your-site.com/app/qid-scanner`

3. **Verify Interface**:
   - You should see the QID Scanner page
   - QR code should be generated (or placeholder shown)
   - Camera interface should be available

## 🔧 Configuration

### **Permissions Setup**

1. **Go to Role Permissions Manager**:
   ```
   Setup → Permissions → Role Permissions Manager
   ```

2. **Configure Page Permissions**:
   - **Document Type**: Page
   - **Document**: QID Scanner
   - **Roles**: Add desired roles (Employee, HR User, etc.)
   - **Permissions**: Read, Write

3. **Test Access**:
   - Login with different user roles
   - Verify access to QID Scanner page

### **Custom Hooks (Optional)**

Add to your site's `hooks.py` if you want custom behavior:

```python
# In your custom app's hooks.py
app_include_js = [
    "/assets/qid_scanner/js/qid_scanner.js"
]

app_include_css = [
    "/assets/qid_scanner/css/qid_scanner.css"
]
```

### **Mobile App Configuration**

For ERPNext mobile app integration:

1. **Enable Mobile Access**:
   ```bash
   bench --site your-site-name set-config mobile_app 1
   ```

2. **Configure CORS** (if needed):
   ```python
   # In site_config.json
   {
       "allow_cors": "*",
       "cors_headers": [
           "Authorization",
           "Content-Type",
           "X-Frappe-CSRF-Token"
       ]
   }
   ```

## 🔍 Troubleshooting

### **Installation Issues**

#### **App Not Found**
```
Error: App qid_scanner not found
```
**Solution**:
```bash
# Check if app directory exists
ls apps/qid_scanner

# If not, re-download/copy the app
# Then run: bench get-app qid_scanner /path/to/app
```

#### **Permission Denied**
```
Error: Permission denied
```
**Solution**:
```bash
# Fix ownership
sudo chown -R frappe:frappe apps/qid_scanner

# Fix permissions
chmod -R 755 apps/qid_scanner
```

#### **Python Dependencies Failed**
```
Error: Failed building wheel for opencv-python
```
**Solution**:
```bash
# Install system dependencies first
sudo apt-get install -y python3-dev build-essential cmake

# Then retry pip install
bench --site your-site-name pip install opencv-python
```

### **Runtime Issues**

#### **Tesseract Not Found**
```
Error: Tesseract not installed or not in PATH
```
**Solution**:
```bash
# Check tesseract path
which tesseract

# If not found, install:
sudo apt-get install tesseract-ocr

# Add to PATH if needed
export PATH=$PATH:/usr/bin
```

#### **Camera Access Issues**
```
Error: Camera access denied
```
**Solution**:
- Ensure HTTPS in production
- Check browser permissions
- Verify camera hardware

#### **QR Code Not Displaying**
```
QR code shows placeholder only
```
**Solution**:
```bash
# Check if QRCode library is loaded
# Add to your site's public/js/custom.js:
frappe.ready(function() {
    if (typeof QRCode === 'undefined') {
        $('head').append('<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>');
    }
});
```

### **Performance Issues**

#### **Slow OCR Processing**
```
Processing takes >5 seconds
```
**Solution**:
- Reduce image size in camera settings
- Ensure adequate server resources
- Consider adding EasyOCR for better accuracy

#### **Memory Issues**
```
Error: Out of memory
```
**Solution**:
```bash
# Increase worker memory
bench config set worker_memory_limit 1024

# Restart workers
bench restart worker
```

## 🔄 Updates and Maintenance

### **Updating the App**

```bash
# Pull latest changes (if using git)
cd apps/qid_scanner
git pull origin main

# Update the app
bench --site your-site-name migrate

# Rebuild assets
bench build --app qid_scanner

# Restart services
bench restart
```

### **Backup Before Updates**

```bash
# Backup your site
bench --site your-site-name backup

# The backup will be saved to:
# sites/your-site-name/private/backups/
```

### **Monitoring**

#### **Check Logs**
```bash
# Web logs
tail -f logs/web.log

# Worker logs
tail -f logs/worker.log

# Error logs
tail -f logs/error.log
```

#### **Performance Monitoring**
```bash
# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h
```

## 📞 Support

### **Getting Help**

1. **Check Logs**: Always check ERPNext logs first
2. **Test Components**: Verify Tesseract and camera separately
3. **Browser Console**: Check for JavaScript errors
4. **Network**: Verify connectivity for QR code workflow

### **Common Commands Reference**

```bash
# App management
bench list-apps
bench --site site-name install-app qid_scanner
bench --site site-name uninstall-app qid_scanner

# Cache management
bench --site site-name clear-cache
bench --site site-name clear-website-cache

# Service management
bench restart
bench start
bench stop

# Development
bench build
bench watch
bench --site site-name console
```

### **Useful Paths**

- **App Directory**: `apps/qid_scanner/`
- **Site Config**: `sites/your-site-name/site_config.json`
- **Logs**: `logs/`
- **Assets**: `sites/assets/qid_scanner/`
- **Backups**: `sites/your-site-name/private/backups/`

---

**Installation complete! Your QID Scanner app is now ready to use in ERPNext.**

