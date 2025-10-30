# Coasty Automation - Quick Start Guide

## For Non-Developers - SUPER EASY! (Mac Only)

### ⭐ EASIEST METHOD: Just Double-Click! ⭐

**STEP 1: Install Node.js** (One Time)
1. Go to: **https://nodejs.org/**
2. Click the big green **"Download"** button
3. Install it
4. **Restart your computer**

**STEP 2: Setup** (One Time)
- Find `Setup.command` in the folder
- **RIGHT-CLICK it and select "Open"** (or Control+Click)
- If you see "Apple cannot verify this app", click **"Open"** again
- Wait 2-5 minutes
- Done! ✅

**STEP 3: Run the Program** (Every Time)
- **RIGHT-CLICK `Run.command` and select "Open"**
- If you see "Apple cannot verify this app", click **"Open"** again
- Follow the on-screen menu

---

## Alternative: Using Terminal (If Double-Click Doesn't Work)

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

Wait a few minutes for everything to install.

### Step 3: Run the Program

```bash
./run.sh
```

**Or simply:**
```bash
npm run live
```

## That's It! 🎉

Once running, follow the on-screen instructions to upload PDFs to Coast app.

## Troubleshooting

**"Apple cannot verify this app" / Gatekeeper Warning**
- This is normal! macOS blocks unsigned scripts for security
- **Solution:** Right-click the file → Select "Open" → Click "Open" again
- After the first time, you can double-click normally

**"node: command not found"**
- Node.js isn't installed or you need to restart your computer
- Reinstall from https://nodejs.org/

**"permission denied"**
- Make scripts executable:
  ```bash
  chmod +x setup.sh run.sh Setup.command Run.command
  ```

## Need Help?

See `SETUP_GUIDE.md` for detailed instructions.

