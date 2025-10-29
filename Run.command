#!/bin/bash

# Coasty Automation - Double-Click Launcher for Mac
# This file opens Terminal and runs the automation

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Clear the screen
clear

echo "🚀 Starting Coasty Automation..."
echo ""

# Check if setup has been run
if [ ! -d "node_modules" ]; then
    echo "⚠️  It looks like setup hasn't been run yet."
    echo ""
    read -p "Would you like to run setup now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        chmod +x setup.sh 2>/dev/null
        ./setup.sh
        if [ $? -ne 0 ]; then
            echo ""
            echo "❌ Setup failed. Please check the errors above."
            read -p "Press Enter to close..."
            exit 1
        fi
    else
        echo "Please run Setup.command first, or run: ./setup.sh"
        read -p "Press Enter to close..."
        exit 1
    fi
fi

# Make sure run script is executable
chmod +x run.sh 2>/dev/null

# Run the automation
./run.sh

# Keep window open if there's an error
if [ $? -ne 0 ]; then
    echo ""
    read -p "Press Enter to close this window..."
fi

