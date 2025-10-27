import { chromium } from 'playwright';

/**
 * Playwright version - fresh browser without profile
 * Use this if you don't want to use your Brave profile
 * You'll need to log in manually when it opens
 */
async function createCoastItemPlaywright(data) {
  const { name, tag, assignee, dueDate } = data;
  
  console.log('🎭 Starting Playwright automation (fresh browser)...');
  console.log('⚠️  You may need to log in when the browser opens\n');
  
  // Launch a fresh Chromium browser
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  
  const page = await context.newPage();
  
  console.log('✅ Browser launched\n');
  
  try {
    console.log('📍 Navigating to Coast app...');
    await page.goto('https://app.coastapp.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded\n');
    
    // Check if we're on login page
    const pageText = await page.textContent('body');
    const isLoginPage = pageText.toLowerCase().includes('sign in') || 
                        pageText.toLowerCase().includes('log in') ||
                        pageText.toLowerCase().includes('email');
    
    if (isLoginPage) {
      console.log('\n⚠️  ⚠️  ⚠️  LOGIN REQUIRED ⚠️  ⚠️  ⚠️');
      console.log('Please log in manually in the browser window.');
      console.log('Once logged in, press Enter here to continue...\n');
      
      await new Promise((resolve) => {
        process.stdin.once('data', () => resolve());
      });
      
      await page.waitForTimeout(2000);
    }
    
    console.log('🔍 Looking for "New" button...');
    
    // Find and click the "New" button using Playwright's modern locators
    const newButton = page.locator('div.css-901oao', { hasText: 'New' }).first();
    
    // Wait for button to be visible
    await newButton.waitFor({ state: 'visible', timeout: 10000 });
    
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
        const tagInput = page.locator('input[placeholder*="tag" i]').first();
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
        const assigneeInput = page.locator('input[placeholder*="assign" i]').first();
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
        const dateInput = page.locator('input[type="date"]').first();
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
    const createButton = page.locator('button', { hasText: 'Create' }).first();
    
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
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
    await browser.close();
  }
}

// Test data
const testData = {
  name: 'Playwright Test - ' + new Date().toLocaleString(),
  tag: 'playwright',
  assignee: 'Test User',
  dueDate: '2025-11-15'
};

console.log('🚀 Starting Playwright automation test (fresh browser)...\n');
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

