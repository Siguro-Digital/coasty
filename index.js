import 'dotenv/config';
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';

/**
 * Creates a new item in the Coast app
 * @param {Object} data - The data for the new item
 * @param {string} data.name - The name/title of the item
 * @param {string} data.tag - The tag to assign
 * @param {string} data.assignee - The assignee name
 * @param {string} data.dueDate - The due date
 */
async function createCoastItem(data) {
  const { name, tag, assignee, dueDate } = data;
  
  console.log('Connecting to BrowserBase...');
  
  // Check if we have a saved auth session
  let sessionId = null;
  let usingSavedSession = false;
  
  if (existsSync('auth-session.json')) {
    try {
      const authData = JSON.parse(readFileSync('auth-session.json', 'utf-8'));
      sessionId = authData.sessionId;
      usingSavedSession = true;
      console.log('✅ Using saved authentication session');
    } catch (e) {
      console.log('⚠️  Could not load saved session, creating new one');
    }
  }
  
  // If no saved session, create a new one
  if (!sessionId) {
    const sessionResponse = await fetch('https://www.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BB-API-Key': process.env.BROWSERBASE_API_KEY,
      },
      body: JSON.stringify({
        projectId: process.env.BROWSERBASE_PROJECT_ID,
      }),
    });
    
    const session = await sessionResponse.json();
    sessionId = session.id;
  }
  
  console.log('\n🎥 WATCH THE BROWSER LIVE:');
  console.log(`   https://www.browserbase.com/sessions/${sessionId}`);
  console.log('   Open this URL in your browser to watch the automation!\n');
  
  if (!usingSavedSession) {
    console.log('⚠️  No saved authentication found.');
    console.log('   If you get stuck on login, run: node setup-auth.js\n');
  }
  
  // Connect to BrowserBase using the session ID
  const browser = await chromium.connectOverCDP(
    `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
  );
  
  const defaultContext = browser.contexts()[0];
  const page = defaultContext.pages()[0];
  
  // If using saved session, restore cookies and storage
  if (usingSavedSession) {
    try {
      const authData = JSON.parse(readFileSync('auth-session.json', 'utf-8'));
      
      // Restore cookies
      if (authData.cookies && authData.cookies.length > 0) {
        await defaultContext.addCookies(authData.cookies);
        console.log('🍪 Restored cookies from saved session');
      }
      
      // Navigate first, then restore localStorage/sessionStorage
      await page.goto('https://app.coastapp.com/');
      
      // Restore localStorage
      if (authData.localStorage) {
        await page.evaluate((storage) => {
          const data = JSON.parse(storage);
          for (const [key, value] of Object.entries(data)) {
            window.localStorage.setItem(key, value);
          }
        }, authData.localStorage);
      }
      
      // Restore sessionStorage
      if (authData.sessionStorage) {
        await page.evaluate((storage) => {
          const data = JSON.parse(storage);
          for (const [key, value] of Object.entries(data)) {
            window.sessionStorage.setItem(key, value);
          }
        }, authData.sessionStorage);
      }
      
      // Reload to apply storage
      await page.reload({ waitUntil: 'networkidle' });
      console.log('✅ Authentication restored\n');
    } catch (e) {
      console.log('⚠️  Error restoring session:', e.message);
    }
  }
  
  try {
    console.log('Navigating to Coast app...');
    await page.goto('https://app.coastapp.com/', { waitUntil: 'networkidle' });
    
    // Wait a bit for the page to fully load
    await page.waitForTimeout(2000);
    
    console.log('Looking for "New" button...');
    // Click the "New" button - we'll try multiple selectors
    const newButtonSelectors = [
      'div.css-901oao:has-text("New")', // Specific class from the HTML
      'div[class*="css-901oao"]:has-text("New")',
      'button:has-text("New")',
      '[role="button"]:has-text("New")',
      'a:has-text("New")',
      'div:has-text("New")', // Fallback to any div with "New" text
    ];
    
    let clicked = false;
    for (const selector of newButtonSelectors) {
      try {
        await page.click(selector, { timeout: 5000 });
        clicked = true;
        console.log(`Clicked "New" button using selector: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      console.log('Could not find "New" button, taking screenshot for debugging...');
      await page.screenshot({ path: 'debug-new-button.png', fullPage: true });
      throw new Error('Could not find "New" button');
    }
    
    // Wait for the form to appear
    await page.waitForTimeout(1500);
    
    console.log('Filling in the form...');
    
    // Fill in the name/title input
    const nameInputSelectors = [
      'input[placeholder*="name" i]',
      'input[placeholder*="title" i]',
      'input[type="text"]:visible',
      'input:first-of-type'
    ];
    
    for (const selector of nameInputSelectors) {
      try {
        await page.fill(selector, name, { timeout: 3000 });
        console.log(`Filled name using selector: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    // Fill in the tag
    if (tag) {
      console.log('Filling in tag...');
      const tagSelectors = [
        'input[placeholder*="tag" i]',
        'input[name*="tag" i]',
        '[aria-label*="tag" i]'
      ];
      
      for (const selector of tagSelectors) {
        try {
          await page.fill(selector, tag, { timeout: 3000 });
          console.log(`Filled tag using selector: ${selector}`);
          break;
        } catch (e) {
          // Try next selector
        }
      }
    }
    
    // Fill in the assignee
    if (assignee) {
      console.log('Filling in assignee...');
      const assigneeSelectors = [
        'input[placeholder*="assignee" i]',
        'input[placeholder*="assign" i]',
        'input[name*="assignee" i]',
        '[aria-label*="assignee" i]'
      ];
      
      for (const selector of assigneeSelectors) {
        try {
          await page.fill(selector, assignee, { timeout: 3000 });
          console.log(`Filled assignee using selector: ${selector}`);
          break;
        } catch (e) {
          // Try next selector
        }
      }
    }
    
    // Fill in the due date
    if (dueDate) {
      console.log('Filling in due date...');
      const dueDateSelectors = [
        'input[placeholder*="due" i]',
        'input[type="date"]',
        'input[name*="date" i]',
        '[aria-label*="due" i]'
      ];
      
      for (const selector of dueDateSelectors) {
        try {
          await page.fill(selector, dueDate, { timeout: 3000 });
          console.log(`Filled due date using selector: ${selector}`);
          break;
        } catch (e) {
          // Try next selector
        }
      }
    }
    
    // Take a screenshot before clicking create
    await page.screenshot({ path: 'before-create.png', fullPage: true });
    
    console.log('Clicking "Create" button...');
    // Click the "Create" button
    const createButtonSelectors = [
      'button:has-text("Create")',
      'button:has-text("create")',
      'button[type="submit"]',
      '[aria-label*="Create"]'
    ];
    
    clicked = false;
    for (const selector of createButtonSelectors) {
      try {
        await page.click(selector, { timeout: 5000 });
        clicked = true;
        console.log(`Clicked "Create" button using selector: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      console.log('Could not find "Create" button, taking screenshot for debugging...');
      await page.screenshot({ path: 'debug-create-button.png', fullPage: true });
      throw new Error('Could not find "Create" button');
    }
    
    // Wait for the item to be created
    await page.waitForTimeout(2000);
    
    // Take a final screenshot
    await page.screenshot({ path: 'after-create.png', fullPage: true });
    
    console.log('✅ Item created successfully!');
    
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      console.log('Screenshot saved to error-screenshot.png');
    } catch (e) {
      // Ignore screenshot errors
    }
    throw error;
  } finally {
    await browser.close();
  }
}

// Export for use in other scripts
export { createCoastItem };

// If run directly, execute with test data
if (import.meta.url === `file://${process.argv[1]}`) {
  const testData = {
    name: 'Test Item from Automation',
    tag: 'automation',
    assignee: 'Test User',
    dueDate: '2025-11-01'
  };
  
  createCoastItem(testData)
    .then(() => {
      console.log('Automation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Automation failed:', error);
      process.exit(1);
    });
}

