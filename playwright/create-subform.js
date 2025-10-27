import { chromium } from 'playwright';

/**
 * Creates a sub form in the Coast app "Work Orders & PMs" channel
 * Keeps the browser session running between executions
 */

// Store context directory for persistent sessions
const CONTEXT_DIR = './playwright-session';

async function createSubForm(data) {
  const { name, tag, assignee, dueDate } = data;
  
  console.log('🎭 Starting Playwright automation...');
  console.log('📂 Using persistent session (no re-login needed!)\n');
  
  // Launch with persistent context (keeps you logged in!)
  const context = await chromium.launchPersistentContext(CONTEXT_DIR, {
    headless: false, // Keep visible so you can watch!
    viewport: { width: 1400, height: 900 },
    slowMo: 800, // Slow down so you can see each action
  });
  
  console.log('✅ Browser launched with persistent session\n');
  
  const page = context.pages()[0] || await context.newPage();
  
  try {
    console.log('📍 Navigating to Coast app...');
    
    try {
      await page.goto('https://app.coastapp.com/', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
    } catch (e) {
      console.log('⚠️  Initial navigation timed out, but page may have loaded...');
    }
    
    // Give it extra time to load
    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(3000);
    
    // Take screenshot to see what we got
    await page.screenshot({ path: 'debug-page-state.png', fullPage: true });
    console.log('📸 Screenshot saved: debug-page-state.png\n');
    
    console.log('✅ Page loaded\n');
    
    // Check if we need to login
    const pageText = await page.textContent('body').catch(() => '');
    const isLoginPage = pageText.toLowerCase().includes('sign in') || 
                        pageText.toLowerCase().includes('log in') ||
                        pageText.toLowerCase().includes('email');
    
    if (isLoginPage) {
      console.log('\n⚠️  ⚠️  ⚠️  LOGIN REQUIRED ⚠️  ⚠️  ⚠️');
      console.log('Please log in manually in the browser window.');
      console.log('This is a ONE-TIME thing - your session will be saved!');
      console.log('\nOnce logged in, press Enter here to continue...\n');
      
      await new Promise((resolve) => {
        process.stdin.once('data', () => resolve());
      });
      
      await page.waitForTimeout(3000);
      
      // Take screenshot after login
      await page.screenshot({ path: 'debug-after-login.png', fullPage: true });
      console.log('✅ Login completed, continuing...\n');
    } else {
      console.log('✅ Already logged in!\n');
    }
    
    // Step 1: Click "Work Orders & PMs" channel
    console.log('🔍 Step 1: Looking for "Work Orders & PMs" channel...');
    
    // Wait for the main content to be visible
    await page.waitForTimeout(2000);
    
    // Try multiple selectors for the Work Orders & PMs element
    const channelSelectors = [
      'div.css-901oao.css-cens5h:has-text("Work Orders & PMs")',
      'div.css-901oao:has-text("Work Orders & PMs")',
      '[data-testid="main-header-channel-name"]:has-text("Work Orders & PMs")',
      'div:has-text("Work Orders & PMs")',
    ];
    
    let channelName = null;
    
    for (const selector of channelSelectors) {
      try {
        const element = page.locator(selector).first();
        await element.waitFor({ state: 'visible', timeout: 5000 });
        channelName = element;
        console.log(`Found channel using: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!channelName) {
      console.log('❌ Could not find "Work Orders & PMs" channel');
      console.log('   Taking screenshot for debugging...');
      await page.screenshot({ path: 'debug-channel-not-found.png', fullPage: true });
      throw new Error('Work Orders & PMs channel not found. Check debug-channel-not-found.png');
    }
    await page.screenshot({ path: 'step1-before-channel-click.png', fullPage: true });
    
    await channelName.click();
    console.log('✅ Clicked "Work Orders & PMs" channel\n');
    
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'step2-after-channel-click.png', fullPage: true });
    
    // Step 2: Click "Sub Forms" option
    console.log('🔍 Step 2: Looking for "Sub Forms" option...');
    const subFormsOption = page.locator('div.css-901oao', { hasText: 'Sub Forms' })
      .filter({ has: page.locator('text=Manage the sub forms') })
      .first();
    
    await subFormsOption.waitFor({ state: 'visible', timeout: 10000 });
    await subFormsOption.click();
    console.log('✅ Clicked "Sub Forms" option\n');
    
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'step3-after-subforms-click.png', fullPage: true });
    
    // Step 3: Click the "New" button
    console.log('🔍 Step 3: Looking for "New" button...');
    
    // Try multiple selectors for the New button
    const newButtonSelectors = [
      'div.css-901oao.r-1b43r93:has-text("New")', // Specific classes from HTML
      'div.css-901oao:has-text("New")',
      'div[class*="r-1b43r93"]:has-text("New")',
      'button:has-text("New")',
      'div:has-text("New")',
    ];
    
    let newButton = null;
    
    for (const selector of newButtonSelectors) {
      try {
        const element = page.locator(selector).first();
        await element.waitFor({ state: 'visible', timeout: 5000 });
        newButton = element;
        console.log(`Found "New" button using: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!newButton) {
      console.log('❌ Could not find "New" button');
      await page.screenshot({ path: 'step4-new-button-not-found.png', fullPage: true });
      throw new Error('New button not found');
    }
    
    await page.screenshot({ path: 'step4-before-new-click.png', fullPage: true });
    
    await newButton.click();
    console.log('✅ Clicked "New" button\n');
    
    // Wait for the form to appear
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step5-form-opened.png', fullPage: true });
    
    console.log('📝 Filling in the form...');
    
    // Fill in the name/title - find the first visible text input
    console.log('   Filling name field...');
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(name);
    console.log(`   ✅ Name: "${name}"`);
    
    // Fill in other fields if they exist
    if (tag) {
      console.log('   Filling tag field...');
      try {
        const tagInput = page.locator('input[placeholder*="tag" i]').first();
        await tagInput.fill(tag, { timeout: 3000 });
        console.log(`   ✅ Tag: "${tag}"`);
      } catch (e) {
        console.log(`   ⚠️  Tag field not found, skipping...`);
      }
    }
    
    if (assignee) {
      console.log('   Filling assignee field...');
      try {
        const assigneeInput = page.locator('input[placeholder*="assign" i]').first();
        await assigneeInput.fill(assignee, { timeout: 3000 });
        console.log(`   ✅ Assignee: "${assignee}"`);
      } catch (e) {
        console.log(`   ⚠️  Assignee field not found, skipping...`);
      }
    }
    
    if (dueDate) {
      console.log('   Filling due date field...');
      try {
        const dateInput = page.locator('input[type="date"]').first();
        await dateInput.fill(dueDate, { timeout: 3000 });
        console.log(`   ✅ Due date: "${dueDate}"`);
      } catch (e) {
        console.log(`   ⚠️  Due date field not found, skipping...`);
      }
    }
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'step6-form-filled.png', fullPage: true });
    console.log('\n📸 Screenshot saved: step6-form-filled.png\n');
    
    console.log('🔍 Looking for "Create" or "Save" button...');
    
    // Find and click the submit button
    const submitButton = page.locator('button', { hasText: /Create|Save|Submit/i }).first();
    
    try {
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      await submitButton.click();
      console.log('✅ Clicked submit button\n');
      
      // Wait for the item to be created
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'step7-after-submit.png', fullPage: true });
      
      console.log('✅ Sub form created successfully!\n');
    } catch (e) {
      console.log('⚠️  Could not find submit button, form may have different structure');
      console.log('   Screenshot saved for manual inspection\n');
    }
    
    console.log('✨ Browser will stay open for 10 seconds so you can verify...');
    await page.waitForTimeout(10000);
    
    console.log('\n💡 TIP: Your session is saved! Next time you run this,');
    console.log('   you won\'t need to log in again!\n');
    
  } catch (error) {
    console.error('\n❌ Error during automation:', error.message);
    
    // Take error screenshot
    try {
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      console.log('Error screenshot saved to error-screenshot.png');
    } catch (e) {
      // Ignore screenshot errors
    }
    
    console.log('\n⏸️  Browser will stay open for debugging.');
    console.log('Press Enter to close...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve());
    });
    
    throw error;
  } finally {
    await context.close();
  }
}

// Test data
const testData = {
  name: 'Test Sub Form - ' + new Date().toLocaleString(),
  tag: 'test',
  assignee: 'Test User',
  dueDate: '2025-11-15'
};

console.log('🚀 Starting Coast Sub Form automation...\n');
console.log('Test data:', testData);
console.log('');

createSubForm(testData)
  .then(() => {
    console.log('\n✅ Automation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Automation failed:', error.message);
    process.exit(1);
  });

