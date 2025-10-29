# Coasty Automation - Setup Guide for Non-Developers

This guide will help you set up and run the Coasty automation tool on your computer.

## Quick Start (Easiest Method)

### Step 1: Install Node.js

1. Visit https://nodejs.org/
2. Click the big green "Download" button (LTS version)
3. Run the installer and follow the instructions
4. **Important:** Restart your computer after installation

### Step 2: Run Setup

1. Open Terminal (Mac) or Command Prompt/PowerShell (Windows)
2. Navigate to the folder where you extracted Coasty:
   ```bash
   cd /path/to/coasty
   ```
   (Replace `/path/to/coasty` with the actual folder location)

3. Make the setup script executable (Mac/Linux only):
   ```bash
   chmod +x setup.sh
   ```

4. Run the setup script:
   - **Mac/Linux:**
     ```bash
     ./setup.sh
     ```
   - **Windows:** (run in PowerShell)
     ```powershell
     .\setup.ps1
     ```

5. Wait for setup to complete (may take a few minutes)

### Step 3: Run the Automation

Once setup is complete, you can run the automation:

- **Mac/Linux:**
  ```bash
  ./run.sh
  ```
  
- **Windows:**
  ```powershell
  .\run.ps1
  ```

Or simply:
```bash
npm run live
```

## What You Need

### Required:
- **Node.js** (v16 or higher) - https://nodejs.org/
- **Internet connection** (for downloading dependencies and connecting to Coast app)

### Optional (for PDF generation):
- **Python 3** - https://www.python.org/downloads/
  - Needed only if you want to generate PDFs from CSV files
  - During installation, check "Add Python to PATH" (Windows) or it's automatic (Mac)

## Manual Setup (If Scripts Don't Work)

If the automated scripts don't work on your system, follow these steps:

### 1. Install Node.js
- Download from https://nodejs.org/
- Install and restart your computer

### 2. Install Dependencies
Open Terminal/Command Prompt in the Coasty folder and run:
```bash
npm install
```

### 3. Install Playwright Browser
```bash
npx playwright install chromium
```

### 4. (Optional) Setup Python for PDFs
If you have Python installed:
```bash
python3 -m venv venv
source venv/bin/activate    # Mac/Linux
# OR
venv\Scripts\activate       # Windows

pip install reportlab
```

### 5. Run the Automation
```bash
npm run live
```

## Troubleshooting

### "node: command not found"
- Node.js is not installed or not in your PATH
- Reinstall Node.js and restart your computer
- On Windows, make sure to check "Add to PATH" during installation

### "npm: command not found"
- Usually means Node.js wasn't installed correctly
- Reinstall Node.js from https://nodejs.org/

### Scripts won't run (Mac/Linux)
- Make sure scripts are executable:
  ```bash
  chmod +x setup.sh run.sh
  ```

### Scripts won't run (Windows)
- Make sure you're using PowerShell (not Command Prompt)
- You may need to allow script execution:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### "Permission denied" errors
- Try running with `sudo` (Mac/Linux only):
  ```bash
  sudo ./setup.sh
  ```

## Need Help?

If you encounter issues:
1. Make sure Node.js is installed: `node --version`
2. Make sure npm is installed: `npm --version`
3. Check that you're in the correct folder
4. Try running the manual setup steps above

## What Gets Installed?

The setup script installs:
- Node.js packages (playwright, dotenv, csv-parse)
- Playwright Chromium browser (needed for automation)
- Python packages (reportlab) - only if Python is installed

All dependencies are installed locally in the project folder, so they won't affect other programs on your computer.

