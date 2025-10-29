#!/bin/bash

echo "🚀 Coasty Automation - Setup Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo ""
    echo "Please install Node.js first:"
    echo "  - Visit: https://nodejs.org/"
    echo "  - Download and install the LTS version"
    echo "  - Restart your terminal after installation"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Note: Python is not required - PDFs are pre-generated

echo ""
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

echo ""
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Failed to install Playwright browsers"
    echo "   You may need to run: npx playwright install chromium"
fi

# Note: Python dependencies not needed - PDFs are pre-generated and included

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 PDFs are already included - no generation needed!"
echo ""
echo "To run the automation, use:"
echo "  npm run live"
echo ""
echo "Or double-click: Run.command"
echo ""

