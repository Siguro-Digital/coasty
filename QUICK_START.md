# Coasty Automation - Quick Start Guide

## For Non-Developers - Easy Setup!

### Step 1: Install Node.js (One Time Setup)

1. Go to: **https://nodejs.org/**
2. Click the big green **"Download"** button
3. Run the installer
4. **Restart your computer** after installation

### Step 2: Run Setup (One Time)

**On Mac/Linux:**
1. Open Terminal
2. Navigate to the Coasty folder:
   ```bash
   cd /path/to/coasty
   ```
3. Run:
   ```bash
   ./setup.sh
   ```

**On Windows:**
1. Open PowerShell (not Command Prompt)
2. Navigate to the Coasty folder:
   ```powershell
   cd C:\path\to\coasty
   ```
3. Run:
   ```powershell
   .\setup.ps1
   ```

Wait a few minutes for everything to install.

### Step 3: Run the Program

**On Mac/Linux:**
```bash
./run.sh
```

**On Windows:**
```powershell
.\run.ps1
```

**Or simply:**
```bash
npm run live
```

## That's It! 🎉

Once running, follow the on-screen instructions to upload PDFs to Coast app.

## Troubleshooting

**"node: command not found"**
- Node.js isn't installed or you need to restart your computer
- Reinstall from https://nodejs.org/

**"permission denied" (Mac/Linux)**
- Make scripts executable:
  ```bash
  chmod +x setup.sh run.sh
  ```

**Scripts won't run (Windows)**
- Use PowerShell, not Command Prompt
- Allow scripts: `Set-ExecutionPolicy RemoteSigned`

## Need Help?

See `SETUP_GUIDE.md` for detailed instructions.

