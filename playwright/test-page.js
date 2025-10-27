import { chromium } from 'playwright';

/**
 * Simple test to check if page is responsive and interactive
 */

const CONTEXT_DIR = './playwright-session';

async function testPage() {
  console.log('🧪 Testing page responsiveness...\n');
  
  const context = await chromium.launchPersistentContext(CONTEXT_DIR, {
    headless: false,
    viewport: { width: 1400, height: 900 },
  });
  
  const page = context.pages()[0] || await context.newPage();
  
  console.log('📍 Navigating to Coast app...');
  
  try {
    await page.goto('https://app.coastapp.com/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
  } catch (e) {
    console.log('⚠️  Timeout, but continuing...');
  }
  
  await page.waitForTimeout(3000);
  
  console.log('\n🔍 Testing page interactivity...\n');
  
  // Test 1: Can we get the URL?
  const url = page.url();
  console.log(`✅ URL: ${url}`);
  
  // Test 2: Can we get page title?
  const title = await page.title();
  console.log(`✅ Title: ${title}`);
  
  // Test 3: Can we take screenshot?
  await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
  console.log(`✅ Screenshot saved: test-screenshot.png`);
  
  // Test 4: Can we get body text?
  try {
    const bodyText = await page.textContent('body', { timeout: 5000 });
    console.log(`✅ Body text length: ${bodyText.length} characters`);
    console.log(`   First 100 chars: ${bodyText.substring(0, 100).replace(/\n/g, ' ')}`);
  } catch (e) {
    console.log(`❌ Could not get body text: ${e.message}`);
  }
  
  // Test 5: Check for login state
  console.log('\n🔍 Checking login state...');
  const currentUrl = page.url();
  if (currentUrl.includes('signup') || currentUrl.includes('login')) {
    console.log('❌ You are NOT logged in (on signup/login page)');
    console.log('   Please log in manually, then press Enter...\n');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve());
    });
    await page.waitForTimeout(2000);
  } else {
    console.log('✅ Appears to be logged in');
  }
  
  // Test 6: Find all divs with "Work Orders & PMs" text
  console.log('\n🔍 Looking for "Work Orders & PMs" elements...\n');
  
  const selectors = [
    'div:has-text("Work Orders & PMs")',
    'div.css-901oao:has-text("Work Orders & PMs")',
    'div.css-cens5h:has-text("Work Orders & PMs")',
    '[data-testid*="channel"]',
  ];
  
  for (const selector of selectors) {
    try {
      const elements = page.locator(selector);
      const count = await elements.count();
      console.log(`   ${selector}`);
      console.log(`   Found: ${count} element(s)`);
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const text = await elements.nth(i).textContent();
          const isVisible = await elements.nth(i).isVisible();
          console.log(`     [${i}] "${text?.substring(0, 50)}" | Visible: ${isVisible}`);
        }
      }
      console.log('');
    } catch (e) {
      console.log(`   ${selector}`);
      console.log(`   Error: ${e.message}\n`);
    }
  }
  
  // Test 7: Try clicking "Work Orders & PMs"
  console.log('🔍 Attempting to click "Work Orders & PMs"...\n');
  
  const clickSelectors = [
    'div.css-901oao.css-cens5h:has-text("Work Orders & PMs")',
    'div.css-901oao:has-text("Work Orders & PMs")',
    'div:has-text("Work Orders & PMs")',
  ];
  
  for (const selector of clickSelectors) {
    try {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible({ timeout: 2000 });
      
      if (isVisible) {
        console.log(`   Trying: ${selector}`);
        await element.click();
        console.log(`   ✅ Clicked successfully!`);
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-after-click.png', fullPage: true });
        console.log(`   📸 Screenshot after click: test-after-click.png\n`);
        break;
      }
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}\n`);
    }
  }
  
  console.log('\n✅ Test completed!');
  console.log('Browser will stay open. Press Enter to close...\n');
  
  await new Promise((resolve) => {
    process.stdin.once('data', () => resolve());
  });
  
  await context.close();
}

testPage().catch(console.error);

