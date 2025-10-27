import 'dotenv/config';
import { chromium } from 'playwright';

/**
 * This script helps you log in once and save the session for future use.
 * Run this script, log in manually in the browser, then the session will be saved.
 */
async function setupAuthentication() {
  console.log('🔐 Setting up authentication session...\n');
  
  // Create a persistent session
  const sessionResponse = await fetch('https://www.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BB-API-Key': process.env.BROWSERBASE_API_KEY,
    },
    body: JSON.stringify({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      // Keep the session alive for longer
      keepAlive: true,
    }),
  });
  
  const session = await sessionResponse.json();
  const sessionId = session.id;
  
  console.log('🎥 MANUAL LOGIN REQUIRED:');
  console.log(`   https://www.browserbase.com/sessions/${sessionId}`);
  console.log('\n📋 INSTRUCTIONS:');
  console.log('   1. Open the URL above in your browser');
  console.log('   2. You will see a live browser session');
  console.log('   3. Navigate to https://app.coastapp.com/');
  console.log('   4. Complete the login process (email code, etc.)');
  console.log('   5. Once logged in, come back here and press Enter');
  console.log('\n⏳ Waiting for you to log in...\n');
  
  // Connect to the session
  const browser = await chromium.connectOverCDP(
    `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
  );
  
  const defaultContext = browser.contexts()[0];
  const page = defaultContext.pages()[0];
  
  // Navigate to Coast app
  await page.goto('https://app.coastapp.com/');
  
  // Wait for user to press Enter
  await new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
  
  console.log('\n💾 Saving session state...');
  
  // Get cookies and localStorage
  const cookies = await defaultContext.cookies();
  const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
  const sessionStorage = await page.evaluate(() => JSON.stringify(window.sessionStorage));
  
  // Save to a file
  const fs = await import('fs');
  const authData = {
    sessionId,
    cookies,
    localStorage,
    sessionStorage,
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync('auth-session.json', JSON.stringify(authData, null, 2));
  
  console.log('✅ Authentication session saved to auth-session.json');
  console.log(`📝 Session ID: ${sessionId}`);
  console.log('\nYou can now use this session for future automations!');
  console.log('The session will remain active for a while.');
  
  // Don't close the browser yet - keep it alive
  console.log('\n⚠️  Keeping session alive... Press Ctrl+C when done.');
}

setupAuthentication().catch(console.error);


