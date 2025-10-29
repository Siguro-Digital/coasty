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

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python 3 is not installed."
    echo "   PDF generation will not work without Python 3"
    echo "   Visit: https://www.python.org/downloads/"
else
    echo "✅ Python 3 found: $(python3 --version)"
fi

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

# Check if Python dependencies are needed
if command -v python3 &> /dev/null; then
    echo ""
    echo "🐍 Checking Python dependencies..."
    
    if python3 -c "import reportlab" 2>/dev/null; then
        echo "✅ Python dependencies already installed"
    else
        echo "📦 Installing Python dependencies for PDF generation..."
        python3 -m venv venv 2>/dev/null || true
        source venv/bin/activate 2>/dev/null || true
        pip install reportlab --quiet 2>/dev/null || {
            echo "⚠️  Warning: Could not install Python PDF dependencies"
            echo "   PDF generation may not work"
        }
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the automation, use:"
echo "  npm run live"
echo ""
echo "Or use the launcher script:"
echo "  ./run.sh"
echo ""

