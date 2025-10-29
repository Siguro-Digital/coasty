#!/bin/bash

# Coasty Automation Launcher
# Simple script to run the automation without needing to know npm commands

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Starting Coasty Automation..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Running setup..."
    ./setup.sh
    if [ $? -ne 0 ]; then
        echo "❌ Setup failed. Please check the errors above."
        exit 1
    fi
fi

# Run the live automation script
npm run live

