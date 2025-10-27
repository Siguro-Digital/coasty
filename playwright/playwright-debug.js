import { chromium } from 'playwright';

/**
 * Playwright DEBUG version - Opens to Coast app and pauses
 * This lets you manually test selectors and see the page structure
 * No profile needed - just for exploration
 */
async function debugCoastApp() {
  console.log('🎭 Starting Playwright DEBUG mode...');
  console.log('This will open a browser and pause so you can explore\n');
  
  // Launch a fresh Chromium browser
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
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
    
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded\n');
    
    // Take initial screenshot
    await page.screenshot({ path: 'playwright-debug-initial.png', fullPage: true });
    console.log('📸 Screenshot saved: playwright-debug-initial.png\n');
    
    console.log('🔍 Checking page content...');
    const pageText = await page.textContent('body');
    const isLoginPage = pageText.toLowerCase().includes('sign in') || 
                        pageText.toLowerCase().includes('log in') ||
                        pageText.toLowerCase().includes('email');
    
    if (isLoginPage) {
      console.log('\n⚠️  You are on the LOGIN page');
      console.log('Please log in manually in the browser window.');
      console.log('Once logged in, press Enter here to continue...\n');
      
      await new Promise((resolve) => {
        process.stdin.once('data', () => resolve());
      });
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'playwright-debug-after-login.png', fullPage: true });
      console.log('📸 Screenshot saved: playwright-debug-after-login.png\n');
    } else {
      console.log('✅ You appear to be logged in!\n');
    }
    
    console.log('🔍 Looking for "New" button...');
    console.log('Trying different selectors:\n');
    
    // Try each selector and report results
    const selectors = [
      { name: 'Specific class with text', selector: 'div.css-901oao:has-text("New")' },
      { name: 'Any div with "New"', selector: 'div:has-text("New")' },
      { name: 'Button with "New"', selector: 'button:has-text("New")' },
      { name: 'Role button with "New"', selector: '[role="button"]:has-text("New")' },
    ];
    
    for (const { name, selector } of selectors) {
      try {
        const element = page.locator(selector).first();
        const count = await element.count();
        
        if (count > 0) {
          console.log(`✅ ${name}: FOUND (${count} matches)`);
          console.log(`   Selector: ${selector}`);
          
          // Highlight the element
          await element.evaluate(el => {
            el.style.border = '3px solid red';
            el.style.backgroundColor = 'yellow';
          });
        } else {
          console.log(`❌ ${name}: Not found`);
        }
      } catch (e) {
        console.log(`❌ ${name}: Error - ${e.message}`);
      }
    }
    
    console.log('\n📸 Taking screenshot with highlighted elements...');
    await page.screenshot({ path: 'playwright-debug-highlighted.png', fullPage: true });
    console.log('Screenshot saved: playwright-debug-highlighted.png\n');
    
    console.log('\n🛑 DEBUG MODE: Browser will stay open');
    console.log('You can now:');
    console.log('  1. Inspect elements manually');
    console.log('  2. Test clicking buttons');
    console.log('  3. Check the screenshots');
    console.log('\nPress Enter when done to close...\n');
    
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve());
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    try {
      await page.screenshot({ path: 'playwright-debug-error.png', fullPage: true });
      console.log('Error screenshot saved to playwright-debug-error.png');
    } catch (e) {
      // Ignore screenshot errors
    }
    
    console.log('\nPress Enter to close...');
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve());
    });
  } finally {
    await browser.close();
  }
}

console.log('🚀 Starting Playwright DEBUG mode...\n');

debugCoastApp()
  .then(() => {
    console.log('\n✅ Debug session completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error.message);
    process.exit(1);
  });

