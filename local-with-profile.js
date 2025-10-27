import 'dotenv/config';
import { chromium } from 'playwright';

/**
 * LOCAL VERSION with your existing Brave profile
 * This uses your actual Brave browser profile where you're already logged in
 * 
 * NOTE: Close Brave before running this, as Playwright can't connect to an already-running instance
 */
async function createCoastItemLocal(data) {
  const { name, tag, assignee, dueDate } = data;
  
  console.log('🖥️  Starting LOCAL browser automation with your Brave profile...');
  console.log('⚠️  IMPORTANT: Close Brave Browser before running this!\n');
  
  // Brave user data directory on macOS
  const userDataDir = process.env.HOME + '/Library/Application Support/BraveSoftware/Brave-Browser';
  
  console.log(`Using profile: ${userDataDir}\n`);
  
  // Launch browser with your user data (so you're already logged in)
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Show the browser so you can watch
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    slowMo: 500, // Slow down actions so you can see them
    channel: undefined,
  });
  
  console.log('✅ Using your Brave Browser profile (you should be logged in!)\n');
  
  const page = browser.pages()[0] || await browser.newPage();
  
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
        console.log(`✅ Clicked "New" button using selector: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      console.log('❌ Could not find "New" button');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'local-debug-new-button.png', fullPage: true });
      console.log('Screenshot saved to local-debug-new-button.png');
      
      console.log('\n⏸️  Browser will stay open for manual inspection.');
      console.log('Press Enter to close...');
      await new Promise((resolve) => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
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
        console.log(`✅ Filled name using selector: ${selector}`);
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
          console.log(`✅ Filled tag using selector: ${selector}`);
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
          console.log(`✅ Filled assignee using selector: ${selector}`);
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
          console.log(`✅ Filled due date using selector: ${selector}`);
          break;
        } catch (e) {
          // Try next selector
        }
      }
    }
    
    // Take a screenshot before clicking create
    await page.screenshot({ path: 'local-before-create.png', fullPage: true });
    console.log('📸 Screenshot saved: local-before-create.png');
    
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
        console.log(`✅ Clicked "Create" button using selector: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      console.log('❌ Could not find "Create" button');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'local-debug-create-button.png', fullPage: true });
      console.log('Screenshot saved to local-debug-create-button.png');
      
      console.log('\n⏸️  Browser will stay open for manual inspection.');
      console.log('Press Enter to close...');
      await new Promise((resolve) => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
      throw new Error('Could not find "Create" button');
    }
    
    // Wait for the item to be created
    await page.waitForTimeout(2000);
    
    // Take a final screenshot
    await page.screenshot({ path: 'local-after-create.png', fullPage: true });
    console.log('📸 Screenshot saved: local-after-create.png');
    
    console.log('\n✅ Item created successfully!');
    console.log('Browser will stay open for 5 seconds so you can verify...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ Error during automation:', error.message);
    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: 'local-error-screenshot.png', fullPage: true });
      console.log('Screenshot saved to local-error-screenshot.png');
    } catch (e) {
      // Ignore screenshot errors
    }
    
    console.log('\n⏸️  Browser will stay open for debugging.');
    console.log('Press Enter to close...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Test data
const testData = {
  name: 'Local Test Item - ' + new Date().toLocaleString(),
  tag: 'local-test',
  assignee: 'Test User',
  dueDate: '2025-11-15'
};

console.log('🚀 Starting LOCAL automation test with your Brave profile...\n');
console.log('Test data:', testData);
console.log('');

createCoastItemLocal(testData)
  .then(() => {
    console.log('\n✅ Automation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Automation failed:', error.message);
    process.exit(1);
  });


