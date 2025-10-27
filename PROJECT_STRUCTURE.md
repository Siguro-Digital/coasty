# Coast Automation - Project Structure

This project contains multiple automation approaches for the Coast app. Each approach has its own use case.

## 📁 Directory Structure

```
coasty/
├── browserbase/                    # BrowserBase (cloud) automation
│   ├── index.js                    # Main BrowserBase script with auth
│   ├── test.js                     # Test single item
│   ├── csv-automation.js           # Batch process CSV files
│   └── setup-auth.js               # One-time auth setup
│
├── playwright/                     # Playwright (local) automation  
│   ├── playwright-local.js         # Uses your Brave profile (logged in)
│   └── playwright-fresh.js         # Fresh browser (need to login)
│
├── local-automation.js             # Legacy local script
├── local-with-profile.js           # Legacy local with profile
├── sample-data.csv                 # Example CSV data
├── package.json                    # Dependencies
└── .env                            # Environment variables
```

## 🎯 Which Version to Use?

### 1. **Playwright (Recommended for Local Testing)** 🎭

**Best for:** Quick testing, debugging, seeing what's happening

**Pros:**
- ✅ Runs entirely on your machine
- ✅ Uses modern Playwright locators
- ✅ Can use your Brave profile (already logged in)
- ✅ Fast and responsive
- ✅ Great for debugging

**Commands:**
```bash
# Use your Brave profile (already logged in)
npm run playwright

# Fresh browser (need to login)
npm run playwright-fresh
```

**Location:** `playwright/` directory

---

### 2. **BrowserBase (For Production/Batch Processing)** ☁️

**Best for:** Production batch processing, CI/CD, scheduled tasks

**Pros:**
- ✅ Runs in the cloud (doesn't use your machine)
- ✅ Can watch live via web interface
- ✅ Session recordings for debugging
- ✅ Saved authentication
- ✅ Perfect for CSV batch processing

**Commands:**
```bash
# First time: setup authentication
npm run setup-auth

# Then run automation
npm test

# Batch process CSV
node csv-automation.js data.csv
```

**Location:** Root directory (`index.js`, `test.js`, etc.)

---

## 🚀 Quick Start Guide

### For Local Development & Testing:
1. Close Brave completely
2. Run: `npm run playwright`
3. Watch it work!

### For Production/Batch Processing:
1. Run: `npm run setup-auth` (one-time)
2. Log in via the BrowserBase web interface
3. Run: `npm test` or process CSV files

## 🔄 Switching Between Approaches

All approaches coexist peacefully! You can:
- Test locally with Playwright
- Move to BrowserBase for production
- Revert back anytime

No code changes needed - just use different npm commands.

## 📝 Key Differences

| Feature | Playwright | BrowserBase |
|---------|-----------|-------------|
| **Location** | Your machine | Cloud |
| **Speed** | Faster | Depends on network |
| **Authentication** | Use Brave profile | Saved session |
| **Debugging** | Direct access | Web viewer |
| **Best For** | Testing | Production |
| **Watch Live** | Direct view | Web interface |
| **Cost** | Free | BrowserBase pricing |

## 🔧 Common Commands

```bash
# Playwright (local)
npm run playwright              # With your Brave profile
npm run playwright-fresh        # Fresh browser

# BrowserBase (cloud)
npm run setup-auth              # One-time auth setup
npm test                        # Test single item
node csv-automation.js file.csv # Batch process

# Legacy scripts (still work!)
npm run local                   # Old local version
npm run local-profile           # Old local with profile
```

## 💡 Recommendations

**Starting out?** → Use `npm run playwright`
- Fastest way to see if it works
- Easy to debug and adjust selectors
- No auth hassles with your Brave profile

**Moving to production?** → Use BrowserBase
- More reliable for scheduled tasks
- Better for batch processing
- Session recordings help debug issues

**Want both?** → They work together!
- Test locally with Playwright
- Deploy with BrowserBase

