# Coasty - Coast App Automation Tool

Automated tool to create items in the Coast app using BrowserBase browser automation.

## Features

- 🤖 Automated item creation in Coast app
- 📊 CSV batch processing support
- 🎯 Flexible field mapping (name, tag, assignee, due date)
- 📸 Debug screenshots on errors
- 🔄 Retry logic with multiple selector strategies

## Prerequisites

- Node.js (v16 or higher)
- BrowserBase account with API key and Project ID
- Access to Coast app (https://app.coastapp.com/)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Make sure your `.env` file contains:
```
BROWSERBASE_API_KEY=your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here
```

3. **Set up authentication (IMPORTANT):**

Since Coast app requires email login, you need to authenticate once:

```bash
node setup-auth.js
```

This will:
- Open a live browser session
- Give you a URL to watch the browser
- Let you manually log in to Coast app
- Save your authentication for future runs

**Follow the instructions in the terminal** - you'll need to complete the email login process in the BrowserBase live view, then press Enter to save the session.

## Usage

### Option A: Run Locally (Easiest for Testing)

If you want to run the automation on your local machine and watch it live:

```bash
npm run local
```

This will:
- Open Chrome on your machine (visible, not headless)
- Let you log in manually if needed
- Run the automation while you watch
- Perfect for debugging and adjusting selectors

### Option B: Use BrowserBase with Saved Authentication

**First time only** - Set up authentication:

```bash
npm run setup-auth
```

Follow the prompts to log in to Coast app. This only needs to be done once (or when your session expires).

**Then run the automation:**

```bash
npm test
```

### Test Single Item Creation

Run a quick test to verify the automation works:

```bash
npm test
```

Or directly:
```bash
node test.js
```

This will create a single test item in the Coast app.

### Create Single Item

Run the main script directly:

```bash
node index.js
```

This uses the test data defined in `index.js`.

### Batch Process CSV File

To process multiple items from a CSV file:

```bash
node csv-automation.js sample-data.csv
```

Or with your own CSV file:
```bash
node csv-automation.js path/to/your/data.csv
```

#### CSV Format

Your CSV file should have the following columns:

```csv
name,tag,assignee,dueDate
Task 1,urgent,John Doe,2025-11-01
Task 2,normal,Jane Smith,2025-11-05
```

- **name** (required): The title/name of the item
- **tag** (optional): Tag to assign
- **assignee** (optional): Person to assign the item to
- **dueDate** (optional): Due date in YYYY-MM-DD format

## How It Works

1. **Connects to BrowserBase**: Uses Playwright to connect to a remote browser session
2. **Navigates to Coast app**: Goes to https://app.coastapp.com/
3. **Clicks "New" button**: Finds and clicks the button to create a new item
4. **Fills in form fields**: Enters the name, tag, assignee, and due date
5. **Submits the form**: Clicks the "Create" button
6. **Takes screenshots**: Saves screenshots for debugging if errors occur

## Debugging

If the automation fails, check the following screenshots that are automatically generated:

- `error-screenshot.png` - Screenshot when an error occurs
- `debug-new-button.png` - Screenshot if "New" button can't be found
- `debug-create-button.png` - Screenshot if "Create" button can't be found
- `before-create.png` - Screenshot before clicking "Create"
- `after-create.png` - Screenshot after item creation

## Project Structure

```
coasty/
├── index.js              # Main automation script
├── test.js               # Test script for single item
├── csv-automation.js     # CSV batch processing script
├── setup-auth.js         # Authentication setup script
├── sample-data.csv       # Example CSV file
├── auth-session.json     # Saved authentication (created by setup-auth.js)
├── package.json          # Dependencies
├── .env                  # Environment variables (not in git)
└── README.md            # This file
```

## Customization

### Modify Test Data

Edit the `testData` object in `index.js` or `test.js`:

```javascript
const testData = {
  name: 'Your Item Name',
  tag: 'your-tag',
  assignee: 'Assignee Name',
  dueDate: '2025-12-31'
};
```

### Adjust Selectors

If the Coast app UI changes, you may need to update the selectors in `index.js`. The script uses multiple fallback selectors to be resilient to UI changes.

### Add Delays

If the automation is too fast, increase the timeout values:

```javascript
await page.waitForTimeout(2000); // Increase this value
```

## Troubleshooting

### Stuck on Login Page

If the automation gets stuck on the login page:

1. **Run the setup script:**
   ```bash
   node setup-auth.js
   ```

2. **Log in manually** in the BrowserBase live view

3. **Press Enter** in the terminal to save the session

4. **Run your automation again** - it will use the saved authentication

### Session Expired

If your saved session expires:
- Delete `auth-session.json`
- Run `node setup-auth.js` again to create a new authenticated session

### "Could not find New button"
- The Coast app UI may have changed
- Check `debug-new-button.png` to see what the page looks like
- Update the selectors in `index.js`

### "Could not find Create button"
- Check `debug-create-button.png`
- The form may not have loaded properly
- Increase wait times in the script

### Connection errors
- Verify your BrowserBase API key and Project ID are correct
- Check your internet connection
- Ensure BrowserBase service is available

## Notes

- The automation includes a 3-second delay between CSV items to avoid rate limiting
- Screenshots are saved in the project root directory
- Failed items in CSV processing won't stop the entire batch

## License

ISC

