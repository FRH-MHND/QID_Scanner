#!/bin/bash

# QID Scanner ERPNext App Installation Script

echo "🚀 Installing QID Scanner ERPNext App..."

# Check if we're in a bench directory
if [ ! -f "sites/common_site_config.json" ]; then
    echo "❌ Error: Please run this script from your ERPNext bench directory"
    exit 1
fi

# Install system dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-ara tesseract-ocr-eng

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
./env/bin/pip install pytesseract opencv-python pillow numpy regex

# Get site name
if [ -z "$1" ]; then
    echo "Please provide site name:"
    read SITE_NAME
else
    SITE_NAME=$1
fi

# Install the app
echo "📱 Installing QID Scanner app for site: $SITE_NAME"
bench --site $SITE_NAME install-app qid_scanner

# Build assets
echo "🔨 Building assets..."
bench build --app qid_scanner

# Restart bench
echo "🔄 Restarting bench..."
bench restart

echo "✅ QID Scanner installation completed!"
echo "🌐 Access the scanner at: http://your-site.com/app/qid-scanner"
echo ""
echo "📋 Next steps:"
echo "1. Login to your ERPNext site"
echo "2. Go to Modules → QID Scanner"
echo "3. Start scanning QID documents!"

