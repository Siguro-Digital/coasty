#!/bin/bash

# Coasty Automation - Double-Click Setup for Mac
# This file opens Terminal and runs the setup script automatically

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Clear the screen
clear

echo "🚀 Coasty Automation - Setup"
echo "============================"
echo ""
echo "This will install everything needed to run Coasty Automation."
echo "Please wait..."
echo ""

# Make scripts executable
chmod +x setup.sh run.sh 2>/dev/null

# Run the setup script
./setup.sh

# If setup succeeded, ask if they want to run now
if [ $? -eq 0 ]; then
    echo ""
    read -p "Setup complete! Press Enter to start the program now, or close this window to exit..."
    if [ $? -eq 0 ]; then
        ./run.sh
    fi
else
    echo ""
    echo "⚠️  Setup encountered some issues. Please check the errors above."
    echo ""
    read -p "Press Enter to close this window..."
fi

