import { chromium } from 'playwright';

/**
 * Playwright version - runs on your local machine with Brave profile
 * This version uses Playwright's built-in browser automation
 * 
 * IMPORTANT: Close Brave before running this!
 */
async function createCoastItemPlaywright(data) {
  const { name, tag, assignee, dueDate } = data;
  
  console.log('🎭 Starting Playwright automation...');
  console.log('\n⚠️  ⚠️  ⚠️  IMPORTANT ⚠️  ⚠️  ⚠️');
  console.log('CLOSE BRAVE BROWSER COMPLETELY BEFORE RUNNING THIS!');
  console.log('(Quit Brave from the menu or press Cmd+Q)');
  console.log('');
  console.log('If Brave is already closed and you still get an error,');
  console.log('try: npm run playwright-fresh instead\n');
  
  // Use your Brave profile
  const userDataDir = process.env.HOME + '/Library/Application Support/BraveSoftware/Brave-Browser';
  
  console.log(`Using Brave profile: ${userDataDir}\n`);
  
  // Launch Brave with your profile
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    viewport: { width: 1280, height: 720 },
    slowMo: 500, // Slow down so you can see what's happening
  });
  
  console.log('✅ Brave launched with your profile (you should be logged in!)\n');
  
  const page = context.pages()[0] || await context.newPage();
  
  try {
    console.log('📍 Navigating to Coast app...');
    await page.goto('https://app.coastapp.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded\n');
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);
    
    console.log('🔍 Looking for "New" button...');
    
    // Find and click the "New" button
    const newButton = await page.locator('div.css-901oao', { hasText: 'New' }).first();
    
    // Check if button exists
    const buttonExists = await newButton.count() > 0;
    
    if (!buttonExists) {
      console.log('❌ New button not found. Taking screenshot...');
      await page.screenshot({ path: 'playwright-debug-new-button.png', fullPage: true });
      console.log('Screenshot saved to playwright-debug-new-button.png');
      throw new Error('Could not find "New" button');
    }
    
    // Click the button
    await newButton.click();
    console.log('✅ Clicked "New" button\n');
    
    // Wait for the form modal to appear
    await page.waitForTimeout(1500);
    
    console.log('📝 Filling in the form...');
    
    // Take a screenshot of the form
    await page.screenshot({ path: 'playwright-form-opened.png', fullPage: true });
    console.log('📸 Form screenshot saved: playwright-form-opened.png\n');
    
    // Fill in the name/title - try to find the first visible text input
    console.log('   Filling name field...');
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(name);
    console.log(`   ✅ Name: "${name}"`);
    
    // Fill in tag if present
    if (tag) {
      console.log('   Filling tag field...');
      try {
        const tagInput = page.locator('input').filter({ hasText: /tag/i }).or(
          page.locator('input[placeholder*="tag" i]')
        ).first();
        await tagInput.fill(tag, { timeout: 3000 });
        console.log(`   ✅ Tag: "${tag}"`);
      } catch (e) {
        console.log(`   ⚠️  Could not find tag field, skipping...`);
      }
    }
    
    // Fill in assignee if present
    if (assignee) {
      console.log('   Filling assignee field...');
      try {
        const assigneeInput = page.locator('input[placeholder*="assign" i]').or(
          page.locator('input').filter({ hasText: /assign/i })
        ).first();
        await assigneeInput.fill(assignee, { timeout: 3000 });
        console.log(`   ✅ Assignee: "${assignee}"`);
      } catch (e) {
        console.log(`   ⚠️  Could not find assignee field, skipping...`);
      }
    }
    
    // Fill in due date if present
    if (dueDate) {
      console.log('   Filling due date field...');
      try {
        const dateInput = page.locator('input[type="date"]').or(
          page.locator('input[placeholder*="due" i]')
        ).first();
        await dateInput.fill(dueDate, { timeout: 3000 });
        console.log(`   ✅ Due date: "${dueDate}"`);
      } catch (e) {
        console.log(`   ⚠️  Could not find due date field, skipping...`);
      }
    }
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'playwright-before-create.png', fullPage: true });
    console.log('\n📸 Screenshot before create: playwright-before-create.png\n');
    
    console.log('🔍 Looking for "Create" button...');
    
    // Find and click the Create button
    const createButton = page.locator('button', { hasText: 'Create' }).or(
      page.locator('button[type="submit"]')
    ).first();
    
    const createButtonExists = await createButton.count() > 0;
    
    if (!createButtonExists) {
      console.log('❌ Create button not found. Taking screenshot...');
      await page.screenshot({ path: 'playwright-debug-create-button.png', fullPage: true });
      console.log('Screenshot saved to playwright-debug-create-button.png');
      throw new Error('Could not find "Create" button');
    }
    
    await createButton.click();
    console.log('✅ Clicked "Create" button\n');
    
    // Wait for the item to be created
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ path: 'playwright-after-create.png', fullPage: true });
    console.log('📸 Final screenshot: playwright-after-create.png\n');
    
    console.log('✅ Item created successfully!');
    console.log('Browser will stay open for 5 seconds so you can verify...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('\n❌ Error during automation:', error.message);
    
    // Take error screenshot
    try {
      await page.screenshot({ path: 'playwright-error.png', fullPage: true });
      console.log('Error screenshot saved to playwright-error.png');
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
  name: 'Playwright Test - ' + new Date().toLocaleString(),
  tag: 'playwright',
  assignee: 'Test User',
  dueDate: '2025-11-15'
};

console.log('🚀 Starting Playwright automation test...\n');
console.log('Test data:', testData);
console.log('');

createCoastItemPlaywright(testData)
  .then(() => {
    console.log('\n✅ Automation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Automation failed:', error.message);
    process.exit(1);
  });

