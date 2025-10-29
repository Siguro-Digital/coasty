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
cp *.txt "$DIST_DIR/" 2>/dev/null || true
# Note: CSV files excluded - PDFs are pre-generated
cp *.sh "$DIST_DIR/" 2>/dev/null || true
cp *.command "$DIST_DIR/" 2>/dev/null || true
# Note: Python generation scripts excluded - PDFs are pre-generated

# Copy directories
cp -r playwright "$DIST_DIR/" 2>/dev/null || true
# Copy pre-generated PDFs, exclude JSON subforms folder
cp -r subforms_pdf_ai "$DIST_DIR/" 2>/dev/null || true

# Make scripts executable
chmod +x "$DIST_DIR"/*.sh 2>/dev/null || true
chmod +x "$DIST_DIR"/*.command 2>/dev/null || true

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
echo "📦 This zip file contains everything needed to run Coasty Automation."
echo ""
echo "📋 Instructions for recipient:"
echo "  1. Install Node.js from https://nodejs.org/ (one time)"
echo "  2. Extract the zip file"
echo "  3. Double-click 'Setup.command'"
echo "  4. Double-click 'Run.command' to use"
echo ""
echo "💡 Tip: Tell them to look for README_FOR_RECIPIENT.txt for simple instructions!"
echo ""

