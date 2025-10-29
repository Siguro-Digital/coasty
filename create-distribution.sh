#!/bin/bash

# Script to create a clean distribution package

echo "📦 Creating Coasty Automation Distribution Package..."
echo ""

DIST_DIR="coasty-distribution"
ZIP_FILE="coasty-automation.zip"

# Remove old distribution if exists
if [ -d "$DIST_DIR" ]; then
    echo "Removing old distribution folder..."
    rm -rf "$DIST_DIR"
fi

if [ -f "$ZIP_FILE" ]; then
    echo "Removing old zip file..."
    rm -f "$ZIP_FILE"
fi

# Create distribution directory
mkdir -p "$DIST_DIR"

echo "Copying files..."

# Copy essential files
cp *.js "$DIST_DIR/" 2>/dev/null || true
cp *.json "$DIST_DIR/" 2>/dev/null || true
cp *.md "$DIST_DIR/" 2>/dev/null || true
cp *.csv "$DIST_DIR/" 2>/dev/null || true
cp *.sh "$DIST_DIR/" 2>/dev/null || true
cp *.ps1 "$DIST_DIR/" 2>/dev/null || true
cp generate_*.py "$DIST_DIR/" 2>/dev/null || true

# Copy directories
cp -r playwright "$DIST_DIR/" 2>/dev/null || true
cp -r subforms "$DIST_DIR/" 2>/dev/null || true

# Make scripts executable
chmod +x "$DIST_DIR"/*.sh 2>/dev/null || true

# Create zip
echo "Creating zip file..."
cd "$DIST_DIR"
zip -r "../$ZIP_FILE" . -q
cd ..

# Clean up
rm -rf "$DIST_DIR"

echo ""
echo "✅ Distribution package created: $ZIP_FILE"
echo ""
echo "This zip file contains everything needed to run Coasty Automation."
echo "Share this file along with instructions to:"
echo "  1. Install Node.js from https://nodejs.org/"
echo "  2. Extract the zip"
echo "  3. Run ./setup.sh (Mac/Linux) or .\\setup.ps1 (Windows)"
echo "  4. Run ./run.sh (Mac/Linux) or .\\run.ps1 (Windows)"
echo ""

