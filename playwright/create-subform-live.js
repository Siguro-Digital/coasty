import { chromium } from 'playwright';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * LIVE SESSION VERSION - Browser stays open between runs!
 * 
 * How it works:
 * 1. First run: Opens browser, you log in
 * 2. Browser stays open and waits for commands
 * 3. Press 'c' to create a sub form
 * 4. Press 'b' to batch process CSV
 * 5. Press 'q' to quit
 * 
 * NO RE-LOGIN NEEDED - session stays alive!
 */

const CONTEXT_DIR = './playwright-session';

let browser = null;
let context = null;
let page = null;
let lastKey = '';

async function initialize() {
  console.log('🎭 Initializing Playwright with persistent session...\n');
  
  // Launch with persistent context
  context = await chromium.launchPersistentContext(CONTEXT_DIR, {
    headless: false,
    viewport: { width: 1400, height: 750 },
    slowMo: 600,
  });
  
  console.log('✅ Browser launched\n');
  
  page = context.pages()[0] || await context.newPage();
  
  console.log('📍 Navigating to Coast app...');
  
  try {
    await page.goto('https://app.coastapp.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
  } catch (e) {
    console.log('⚠️  Navigation timeout, but continuing...');
  }
  
  await page.waitForTimeout(1500);
  
  // Check if we need to login
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}\n`);
  
  if (currentUrl.includes('signup') || currentUrl.includes('login')) {
    console.log('\n⚠️  ⚠️  ⚠️  LOGIN REQUIRED ⚠️  ⚠️  ⚠️');
    console.log('Please log in manually in the browser window.');
    console.log('Once logged in and you see the app, press Enter here...\n');
    
    await waitForEnter();
    
    await page.waitForTimeout(1000);
    console.log('✅ Login completed!\n');
  } else {
    console.log('✅ Already logged in!\n');
  }
  
  return true;
}

// Track if we've already navigated to Sub Forms (only need to do once)
let isOnSubFormsPage = false;

async function navigateToSubForms() {
  console.log('\n🚀 Navigating to Sub Forms section...');
  
  try {
    // Make sure we're on the right page
    const currentUrl = page.url();
    if (!currentUrl.includes('coastapp.com') || currentUrl.includes('signup')) {
      console.log('⚠️  Not on the right page, navigating...');
      await page.goto('https://app.coastapp.com/');
      await page.waitForTimeout(1500);
    }
    
    // Check if page is responsive
    console.log('🔍 Checking if page is interactive...');
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await page.waitForLoadState('load', { timeout: 10000 });
      console.log('✅ Page is loaded\n');
    } catch (e) {
      console.log('⚠️  Page load state uncertain, but continuing...\n');
    }
    
    // Step 1: Click "Work Orders & PMs" in the sidebar to select channel
    console.log('🔍 Step 1: Looking for "Work Orders & PMs" in sidebar...');
    
    await page.waitForTimeout(1000);
    
    const sidebarChannelSelectors = [
      'div.css-901oao.css-cens5h:has-text("Work Orders & PMs")',
      'div.css-cens5h:has-text("Work Orders & PMs")',
    ];
    
    let channelClicked = false;
    
    for (const selector of sidebarChannelSelectors) {
      try {
        const channelName = page.locator(selector).first();
        await channelName.waitFor({ state: 'visible', timeout: 5000 });
        await channelName.click();
        console.log(`✅ Clicked "Work Orders & PMs" in sidebar\n`);
        channelClicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!channelClicked) {
      console.log('❌ Could not find "Work Orders & PMs" in sidebar');
      throw new Error('Work Orders & PMs channel not found in sidebar');
    }
    
    await page.waitForTimeout(500);
    
    // Step 1b: Now click the channel name in the HEADER
    console.log('🔍 Step 1b: Clicking "Work Orders & PMs" in header...');
    
    const headerChannel = page.locator('[data-testid="main-header-channel-name"]', {
      hasText: 'Work Orders & PMs'
    }).first();
    
    try {
      await headerChannel.waitFor({ state: 'visible', timeout: 5000 });
      await headerChannel.click();
      console.log('✅ Clicked "Work Orders & PMs" in header\n');
    } catch (e) {
      console.log('❌ Could not find "Work Orders & PMs" in header');
      throw new Error('Work Orders & PMs header not found');
    }
    
    await page.waitForTimeout(500);
    
    // Step 2: Click "Sub Forms" option
    console.log('🔍 Step 2: Looking for "Sub Forms" option...');
    const subFormsOption = page.locator('div.css-901oao', { hasText: 'Sub Forms' })
      .filter({ has: page.locator('text=Manage the sub forms') })
      .first();
    
    await subFormsOption.waitFor({ state: 'visible', timeout: 10000 });
    await subFormsOption.click();
    console.log('✅ Clicked "Sub Forms" option\n');
    
    await page.waitForTimeout(500);
    
    isOnSubFormsPage = true;
    console.log('✅ Navigation complete - now on Sub Forms page\n');
    
  } catch (error) {
    console.error('\n❌ Navigation error:', error.message);
    throw error;
  }
}

async function createSubForm(data) {
  // Extract form name from PDF filename (without extension) to preserve hyphens
  const pdfPath = data.pdfPath;
  const fileName = basename(pdfPath);
  const formName = fileName.replace(/\.pdf$/i, ''); // Remove .pdf extension, case-insensitive
  
  console.log('\n🚀 Creating sub form...');
  console.log(`Form Name: ${formName}`);
  console.log(`PDF Path: ${pdfPath}`);
  console.log('');
  
  try {
    // Only navigate if we haven't already
    if (!isOnSubFormsPage) {
      await navigateToSubForms();
    } else {
      console.log('✅ Already on Sub Forms page, skipping navigation\n');
    }
    
    // Step 3: Click the "New" button
    console.log('🔍 Step 3: Looking for "New" button...');
    
    // Try multiple selectors for the New button
    const newButtonSelectors = [
      'div.css-901oao.r-1b43r93:has-text("New")', // Specific classes from your HTML
      'div.css-901oao:has-text("New")',
      'div[class*="r-1b43r93"]:has-text("New")',
      'button:has-text("New")',
      'div:has-text("New")',
    ];
    
    let newButtonClicked = false;
    
    for (const selector of newButtonSelectors) {
      try {
        const newButton = page.locator(selector).first();
        await newButton.waitFor({ state: 'visible', timeout: 5000 });
        await newButton.click();
        console.log(`✅ Clicked "New" button using: ${selector}\n`);
        newButtonClicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!newButtonClicked) {
      console.log('❌ Could not find "New" button');
      throw new Error('New button not found');
    }
    
    await page.waitForTimeout(500);
    
    // Step 4: Click "Upload a PDF" option
    console.log('🔍 Step 4: Looking for "Upload a PDF" option...');
    
    const uploadPdfSelectors = [
      'div.css-901oao.r-1q9qjxj.r-1q02xf1.r-ubezar.r-13uqrnb.r-1it3c9n.r-afbznj.r-rjixqe.r-5lyqn3:has-text("Upload a PDF")',
      'div.css-901oao.r-1q9qjxj:has-text("Upload a PDF")',
      'div.css-901oao:has-text("Upload a PDF")',
      'div:has-text("Upload a PDF")',
    ];
    
    let uploadPdfClicked = false;
    
    for (const selector of uploadPdfSelectors) {
      try {
        const uploadPdf = page.locator(selector).first();
        await uploadPdf.waitFor({ state: 'visible', timeout: 5000 });
        await uploadPdf.click();
        console.log(`✅ Clicked "Upload a PDF" using: ${selector}\n`);
        uploadPdfClicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!uploadPdfClicked) {
      console.log('❌ Could not find "Upload a PDF" option');
      throw new Error('Upload a PDF option not found');
    }
    
    await page.waitForTimeout(500);
    
    // Step 5: Replace the "New Sub Form" input with the PDF name
    console.log('📝 Step 5: Replacing form name...');
    
    // Wait a bit for the input to be ready
    await page.waitForTimeout(300);
    
    // Find the input that has value="New Sub Form" and replace it
    const nameInputSelectors = [
      'input.css-11aywtz[value="New Sub Form"]',
      'input[maxlength="64"][value="New Sub Form"]',
      'input[type="text"][maxlength="64"]',
      'input.css-11aywtz',
      'input[type="text"]',
    ];
    
    let nameInputFilled = false;
    
    for (const selector of nameInputSelectors) {
      try {
        const nameInput = page.locator(selector).first();
        const count = await nameInput.count();
        console.log(`   Trying selector: ${selector} (found ${count} elements)`);
        
        if (count > 0) {
          await nameInput.waitFor({ state: 'visible', timeout: 3000 });
          
          // Click to focus
          await nameInput.click();
          await page.waitForTimeout(100);
          
          // Triple click to select all text
          await nameInput.click({ clickCount: 3 });
          await page.waitForTimeout(100);
          
          // Type the new name (extracted from filename)
          await nameInput.type(formName);
          
          console.log(`   ✅ Name filled: "${formName}" using: ${selector}`);
          nameInputFilled = true;
          break;
        }
      } catch (e) {
        console.log(`   ❌ Failed with ${selector}: ${e.message}`);
      }
    }
    
    if (!nameInputFilled) {
      console.log('   ❌ FAILED to fill name input');
      throw new Error('Could not fill form name');
    }
    
    await page.waitForTimeout(300);
    
    // Step 6: Set up file chooser intercept, click upload area, and set file
    console.log('🔍 Step 6: Setting up PDF upload...');
    
    try {
      // Find the upload area (Level 3 DIV based on our debugging)
      const uploadTextElement = page.locator('div.css-901oao.css-cens5h:has-text("Upload a PDF")').first();
      await uploadTextElement.waitFor({ state: 'visible', timeout: 5000 });
      
      // Get the Level 3 parent (the clickable div)
      const clickableDiv = await uploadTextElement.evaluateHandle(el => 
        el.parentElement?.parentElement?.parentElement
      );
      
      console.log('   Found clickable upload area (Level 3 DIV)');
      
      // Set up file chooser listener BEFORE clicking to intercept the native dialog
      console.log(`📁 Preparing to upload: ${pdfPath}`);
      
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        clickableDiv.click()
      ]);
      
      console.log('   ✅ File chooser intercepted (no native dialog!)');
      
      // Set the file via the intercepted file chooser
      await fileChooser.setFiles(pdfPath);
      console.log(`✅ PDF file selected\n`);
      
      // Wait for the upload to start processing (reduced from 1000ms)
      await page.waitForTimeout(300);
      
    } catch (error) {
      console.log(`\n❌ Failed to upload PDF: ${error.message}`);
      throw new Error('PDF upload failed');
    }
    
    // Step 7: Click the "Next" button
    console.log('🔍 Step 7: Looking for "Next" button...');
    
    try {
      const nextButton = page.locator('div.css-901oao.r-1q02xf1.r-1b43r93:has-text("Next")').first();
      await nextButton.waitFor({ state: 'visible', timeout: 5000 });
      await nextButton.click();
      console.log('✅ Clicked "Next" button\n');
      
      await page.waitForTimeout(500);
      
    } catch (error) {
      console.log(`⚠️  Could not find/click Next button: ${error.message}`);
    }
    
    // Step 8: Wait for "Building your form" to disappear (can take 1-3 minutes)
    console.log('🔍 Step 8: Waiting for form to build...');
    console.log('   (This can take up to 3 minutes)\n');
    
    try {
      const buildingMessage = page.locator('div.css-901oao:has-text("Building your form. This may take a minute")');
      
      // Wait for the message to appear first
      await buildingMessage.waitFor({ state: 'visible', timeout: 10000 });
      console.log('   ⏳ Form is building...');
      
      // Now wait for it to disappear (3 minute timeout)
      await buildingMessage.waitFor({ state: 'hidden', timeout: 180000 });
      console.log('   ✅ Form finished building!\n');
      
      // Wait a moment for the page to stabilize
      await page.waitForTimeout(500);
      
    } catch (error) {
      console.log(`   ⚠️  Building message handling: ${error.message}`);
      console.log('   Continuing anyway...\n');
    }
    
    // Step 9: Click the back arrow to exit
    console.log('🔍 Step 9: Clicking back button...');
    
    try {
      // Use the data-testid to find the back button
      const backButton = page.locator('[data-testid="modal-back-button"]');
      await backButton.waitFor({ state: 'visible', timeout: 5000 });
      await backButton.click();
      console.log('✅ Clicked back button\n');
      
      await page.waitForTimeout(500);
      
    } catch (error) {
      console.log(`⚠️  Could not find/click back button: ${error.message}\n`);
    }
    console.log('✅ PDF Sub form uploaded successfully!\n');
    return true;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return false;
  }
}

async function batchProcessCSV(csvPath, limit = null) {
  console.log(`\n📊 Batch processing CSV: ${csvPath}`);
  
  try {
    const fileContent = readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    console.log(`Found ${lines.length - 1} rows in CSV`);
    
    if (limit) {
      console.log(`Processing first ${limit} items only\n`);
    }
    
    const itemsToProcess = limit ? Math.min(limit, lines.length - 1) : lines.length - 1;
    
    for (let i = 1; i <= itemsToProcess; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const values = line.split(',');
      const item = {
        name: values[2] || `Item ${i}`, // NAMING CONVENTION column
        description: values[7] || '', // Description column
      };
      
      console.log(`\n[${i}/${itemsToProcess}] Processing: ${item.name}`);
      
      const success = await createSubForm(item);
      
      if (success) {
        console.log(`✅ Item ${i} completed`);
      } else {
        console.log(`❌ Item ${i} failed`);
      }
      
      // Wait between items
      console.log('⏳ Waiting 1 second before next item...');
      await page.waitForTimeout(1000);
    }
    
    console.log('\n🎉 Batch processing completed!');
    
  } catch (error) {
    console.error('❌ Error processing CSV:', error.message);
  }
}

async function findPDFByName(pdfBaseDir, subformName) {
  // Try all folder numbers 1-8
  for (let folderNum = 1; folderNum <= 8; folderNum++) {
    const folderPath = join(pdfBaseDir, folderNum.toString());
    const pdfPath = join(folderPath, `${subformName}.pdf`);
    
    if (existsSync(pdfPath)) {
      return { pdfPath, folderNum };
    }
  }
  
  return null;
}

async function uploadSinglePDFByName(pdfBaseDir = '/Users/mcardle/Sites/coasty/subforms_pdf_ai') {
  return new Promise((resolve) => {
    // Remove the main stdin listener temporarily
    const listeners = process.stdin.listeners('data');
    process.stdin.removeAllListeners('data');
    
    // Switch to line mode temporarily to read the subform name
    process.stdin.setRawMode(false);
    process.stdin.resume();
    
    const isAI = pdfBaseDir.includes('subforms_pdf_ai');
    const pdfType = isAI ? 'AI-optimized' : 'standard';
    console.log(`\n📝 Enter subform name for ${pdfType} PDF (e.g., 4.6-EX. PANEL 432-Quarterly):`);
    console.log('   (Press Enter when done, or Ctrl+C to cancel)\n');
    
    process.stdin.once('data', async (data) => {
      const input = data.toString().trim();
      
      // Restore raw mode and listeners
      setupReadline();
      listeners.forEach(listener => process.stdin.on('data', listener));
      
      if (!input) {
        console.log('❌ No name entered. Cancelled.\n');
        resolve(false);
        return;
      }
      
      console.log(`\n🔍 Searching for: ${input}`);
      
      const result = await findPDFByName(pdfBaseDir, input);
      
      if (result) {
        console.log(`✅ Found PDF in folder ${result.folderNum}`);
        console.log(`   Path: ${result.pdfPath}\n`);
        
        await createSubForm({
          pdfPath: result.pdfPath
        });
      } else {
        console.log(`❌ PDF not found: ${input}.pdf`);
        console.log('   Make sure the name matches exactly (including spaces and punctuation)\n');
      }
      
      // Show menu after completion
      await showMenu();
      resolve(true);
    });
  });
}

// Checkpoint file to track progress
const CHECKPOINT_FILE = join(__dirname, 'upload_checkpoint.json');

function loadCheckpoint() {
  try {
    if (existsSync(CHECKPOINT_FILE)) {
      const data = readFileSync(CHECKPOINT_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log(`⚠️  Could not load checkpoint: ${error.message}`);
  }
  return {};
}

function saveCheckpoint(checkpoint) {
  try {
    writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), 'utf-8');
  } catch (error) {
    console.error(`❌ Could not save checkpoint: ${error.message}`);
  }
}

function getCheckpointKey(folderNumber, fileName) {
  return `${folderNumber}:${fileName}`;
}

async function batchProcessPDFs(pdfDir, folderNumber, limit = null, resume = false) {
  const folderPath = join(pdfDir, folderNumber.toString());
  console.log(`\n📁 Batch processing PDFs from folder: ${folderNumber}`);
  console.log(`   Path: ${folderPath}`);
  
  // Load checkpoint
  const checkpoint = loadCheckpoint();
  const folderKey = `folder_${folderNumber}`;
  
  if (!checkpoint[folderKey]) {
    checkpoint[folderKey] = {
      completed: [],
      failed: [],
      errors: {},
      lastProcessed: null,
      totalFiles: 0
    };
  }
  
  const folderCheckpoint = checkpoint[folderKey];
  
  // Clean up any duplicates in checkpoint arrays
  if (folderCheckpoint.completed) {
    folderCheckpoint.completed = [...new Set(folderCheckpoint.completed)];
  }
  if (folderCheckpoint.failed) {
    folderCheckpoint.failed = [...new Set(folderCheckpoint.failed)];
  }
  
  try {
    // Use find -print0 to handle filenames with newlines and special characters
    // Use shell: false and pass args as array to avoid shell interpretation issues
    const findOutput = execSync('find', [
      folderPath,
      '-maxdepth', '1',
      '-name', '*.pdf',
      '-type', 'f',
      '-print0'
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const files = findOutput
      .split('\0')
      .filter(path => path && path.trim())
      .map(fullPath => basename(fullPath))
      .filter(file => file.endsWith('.pdf'));
    
    console.log(`   Found ${files.length} PDF files in folder ${folderNumber}`);
    
    // Filter out already completed files if resuming
    let filesToProcess = files;
    if (resume && folderCheckpoint.completed.length > 0) {
      // Normalize checkpoint filenames (convert literal \n to actual newline for comparison)
      const normalizedCompleted = folderCheckpoint.completed.map(f => f.replace(/\\n/g, '\n'));
      const completedSet = new Set(normalizedCompleted);
      filesToProcess = files.filter(f => !completedSet.has(f));
      console.log(`   📋 Resuming: ${folderCheckpoint.completed.length} already completed, ${filesToProcess.length} remaining`);
    }
    
    folderCheckpoint.totalFiles = files.length;
    
    if (limit) {
      console.log(`   Processing first ${limit} PDFs only\n`);
      filesToProcess = filesToProcess.slice(0, limit);
    }
    
    const itemsToProcess = filesToProcess.length;
    // Use deduplicated counts to handle any duplicates in checkpoint
    let successCount = new Set(folderCheckpoint.completed).size;
    let failCount = new Set(folderCheckpoint.failed).size;
    
    console.log(`\n   Starting from item ${successCount + failCount + 1} of ${files.length} total\n`);
    
    for (let i = 0; i < itemsToProcess; i++) {
      const fileName = filesToProcess[i];
      const formName = fileName.replace('.pdf', ''); // Remove .pdf extension
      const pdfPath = join(folderPath, fileName);
      const checkpointKey = getCheckpointKey(folderNumber, fileName);
      
      // Defensive check: skip if already completed (normalize for comparison)
      const normalizedCompleted = folderCheckpoint.completed.map(f => f.replace(/\\n/g, '\n'));
      if (normalizedCompleted.includes(fileName)) {
        console.log(`\n⏭️  Skipping ${formName} (already completed)`);
        continue;
      }
      
      // Calculate current progress using deduplicated counts
      const currentCompleted = new Set(folderCheckpoint.completed).size;
      const currentFailed = new Set(folderCheckpoint.failed).size;
      const currentTotal = currentCompleted + currentFailed;
      
      console.log(`\n[${currentTotal + 1}/${files.length}] Processing: ${formName}`);
      
      let success = false;
      let errorMessage = null;
      
      try {
        success = await createSubForm({
          pdfPath: pdfPath
        });
        
        if (success) {
          // Only add if not already in completed list (prevent duplicates)
          if (!folderCheckpoint.completed.includes(fileName)) {
            folderCheckpoint.completed.push(fileName);
            successCount++;
          }
          // Remove from failed list if it was there before
          const failedIndex = folderCheckpoint.failed.indexOf(fileName);
          if (failedIndex > -1) {
            folderCheckpoint.failed.splice(failedIndex, 1);
            failCount--;
          }
          delete folderCheckpoint.errors[checkpointKey];
          console.log(`✅ PDF ${currentTotal + 1} completed`);
        } else {
          console.log(`❌ PDF ${currentTotal + 1} failed`);
          if (!folderCheckpoint.failed.includes(fileName)) {
            folderCheckpoint.failed.push(fileName);
            failCount++;
          }
          folderCheckpoint.errors[checkpointKey] = 'Upload function returned false';
        }
      } catch (error) {
        // Continue processing even if individual item fails
        console.log(`❌ PDF ${currentTotal + 1} errored: ${error.message}`);
        if (!folderCheckpoint.failed.includes(fileName)) {
          folderCheckpoint.failed.push(fileName);
          failCount++;
        }
        folderCheckpoint.errors[checkpointKey] = error.message;
        success = false;
      }
      
      // Update checkpoint after each item
      folderCheckpoint.lastProcessed = fileName;
      folderCheckpoint.lastProcessedTime = new Date().toISOString();
      saveCheckpoint(checkpoint);
      
      // Wait between items
      console.log('⏳ Waiting 1 second before next item...');
      await page.waitForTimeout(1000);
    }
    
    // Use deduplicated counts for accurate reporting
    const totalCompleted = new Set(folderCheckpoint.completed).size;
    const totalFailed = new Set(folderCheckpoint.failed).size;
    const totalProcessed = totalCompleted + totalFailed;
    
    console.log(`\n📊 Batch processing folder ${folderNumber} summary:`);
    console.log(`   ✅ Completed: ${totalCompleted}/${files.length}`);
    console.log(`   ❌ Failed: ${totalFailed}/${files.length}`);
    console.log(`   📈 Progress: ${((totalProcessed / files.length) * 100).toFixed(1)}%`);
    
    if (totalFailed > 0) {
      console.log(`\n   Failed files:`);
      // Get unique failed files
      const uniqueFailed = [...new Set(folderCheckpoint.failed)];
      uniqueFailed.slice(0, 10).forEach(file => {
        const key = getCheckpointKey(folderNumber, file);
        const error = folderCheckpoint.errors[key] || 'Unknown error';
        console.log(`     - ${file}: ${error}`);
      });
      if (uniqueFailed.length > 10) {
        console.log(`     ... and ${uniqueFailed.length - 10} more`);
      }
    }
    
    if (totalCompleted === files.length) {
      console.log(`\n🎉 Batch processing folder ${folderNumber} completed!`);
    } else {
      console.log(`\n⚠️  Batch processing incomplete. Run again with resume to continue.`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing folder ${folderNumber}:`, error.message);
    console.error(`   Stack: ${error.stack}`);
    // Save checkpoint even on error
    saveCheckpoint(checkpoint);
  }
}

async function verifyFormExistsOnSite(formName) {
  try {
    // Navigate to sub forms page if not already there
    if (!isOnSubFormsPage) {
      await navigateToSubForms();
    }
    
    // Wait for page to be ready
    await page.waitForTimeout(1000);
    
    // First, clear any existing search by finding and clearing the search input
    // Look for search input that's specifically on the Sub Forms page
    // Based on the HTML structure, it should be in a container with the form list
    const searchSelectors = [
      'input[type="text"][placeholder*="Search"]',
      'input[type="text"]',
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        // Try to find search input that's visible and in the main content area
        const inputs = page.locator(selector);
        const count = await inputs.count();
        for (let i = 0; i < count; i++) {
          const input = inputs.nth(i);
          const isVisible = await input.isVisible();
          if (isVisible) {
            searchInput = input;
            break;
          }
        }
        if (searchInput) break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!searchInput) {
      console.log('   ⚠️  Could not find search bar, assuming form does not exist');
      return false;
    }
    
    // Clear any existing search first
    await searchInput.click();
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Check initial state - if "No Sub Forms" is visible with empty search, we're on the right page
    const initialNoForms = page.locator(':has-text("No Sub Forms")');
    const hasInitialNoForms = await initialNoForms.isVisible().catch(() => false);
    
    // Enter form name in search
    await searchInput.fill(formName);
    await page.waitForTimeout(2000); // Wait longer for search to filter results
    
    // Check if "No Sub Forms" message appears (means form doesn't exist)
    const noFormsSelectors = [
      ':has-text("No Sub Forms")',
      ':has-text("Add new Sub Forms")'
    ];
    
    let noFormsVisible = false;
    for (const selector of noFormsSelectors) {
      try {
        const noFormsElement = page.locator(selector).first();
        noFormsVisible = await noFormsElement.isVisible({ timeout: 500 });
        if (noFormsVisible) break;
      } catch (e) {
        // Element not found, continue checking
      }
    }
    
    // If we see "No Sub Forms" after searching, the form doesn't exist
    if (noFormsVisible) {
      await searchInput.clear(); // Clear search
      await page.waitForTimeout(500);
      return false;
    }
    
    // Check if the form name actually appears in the visible results
    // Look for the form name in visible text elements (not just page content)
    const formNameEscaped = formName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const formNameRegex = new RegExp(formNameEscaped, 'i');
    
    // Check if form name appears in visible text
    const visibleText = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      const texts = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.parentElement && window.getComputedStyle(node.parentElement).display !== 'none') {
          texts.push(node.textContent.trim());
        }
      }
      return texts.join(' ');
    });
    
    const formExists = formNameRegex.test(visibleText);
    
    // Clear search before returning
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    return formExists;
  } catch (error) {
    console.log(`   ⚠️  Error verifying form: ${error.message}`);
    return false; // If verification fails, assume it doesn't exist and should be uploaded
  }
}

async function uploadMissingForms(pdfDir) {
  const MISSING_UPLOADS_FILE = join(__dirname, '..', 'missing_uploads_list.json');
  
  if (!existsSync(MISSING_UPLOADS_FILE)) {
    console.log('\n❌ missing_uploads_list.json not found!');
    console.log('   Please run: node find_missing_uploads.js\n');
    return;
  }
  
  const missingData = JSON.parse(readFileSync(MISSING_UPLOADS_FILE, 'utf8'));
  const missingFiles = missingData.found || [];
  
  if (missingFiles.length === 0) {
    console.log('\n✅ No missing files to upload!\n');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📤 UPLOADING MISSING FORMS');
  console.log('='.repeat(60));
  console.log(`\n📊 Found ${missingFiles.length} missing forms to upload`);
  
  // Group by folder for display
  const byFolder = {};
  missingFiles.forEach(item => {
    if (!byFolder[item.folder]) {
      byFolder[item.folder] = [];
    }
    byFolder[item.folder].push(item);
  });
  
  console.log('\n📁 Files by folder:');
  Object.keys(byFolder).sort().forEach(folder => {
    console.log(`   Folder ${folder}: ${byFolder[folder].length} files`);
  });
  
  console.log('\n⚠️  This will upload all missing forms from the comparison list.');
  console.log('Press Enter to continue, or any other key to cancel...\n');
  
  const confirm = await new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim() === '');
    });
  });
  
  if (!confirm) {
    console.log('Cancelled.\n');
    return;
  }
  
  const checkpoint = loadCheckpoint();
  let successCount = 0;
  let failCount = 0;
  
  // Process files grouped by folder
  for (const folder of Object.keys(byFolder).sort()) {
    const folderFiles = byFolder[folder];
    const folderKey = `folder_${folder}`;
    const folderCheckpoint = checkpoint[folderKey] || { completed: [], failed: [] };
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📁 Processing folder ${folder} (${folderFiles.length} files)`);
    console.log('='.repeat(60));
    
    for (let i = 0; i < folderFiles.length; i++) {
      const item = folderFiles[i];
      const fileName = item.fileName;
      const pdfPath = item.fullPath;
      
      console.log(`\n📄 [${i + 1}/${folderFiles.length}] Uploading: ${fileName}`);
      
      try {
        await createSubForm({ pdfPath });
        
        // Mark as completed
        if (!folderCheckpoint.completed.includes(fileName)) {
          folderCheckpoint.completed.push(fileName);
          successCount++;
        }
        
        // Remove from failed if it was there
        const failedIndex = folderCheckpoint.failed.indexOf(fileName);
        if (failedIndex !== -1) {
          folderCheckpoint.failed.splice(failedIndex, 1);
          delete folderCheckpoint.errors[getCheckpointKey(folder, fileName)];
        }
        
        saveCheckpoint(checkpoint);
        
        // Small delay between uploads
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`\n❌ Error uploading ${fileName}:`, error.message);
        
        // Mark as failed
        if (!folderCheckpoint.failed.includes(fileName)) {
          folderCheckpoint.failed.push(fileName);
          failCount++;
        }
        folderCheckpoint.errors[getCheckpointKey(folder, fileName)] = error.message;
        
        saveCheckpoint(checkpoint);
      }
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Total processed: ${successCount + failCount}/${missingFiles.length}`);
  console.log('='.repeat(60) + '\n');
}

async function processAllRemaining(pdfDir) {
  const folders = ['-', '2', '3', '4', '5', '6', '7', '8'];
  const checkpoint = loadCheckpoint();
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PROCESSING ALL REMAINING FILES ACROSS ALL FOLDERS');
  console.log('='.repeat(60));
  
  // First, show summary of what will be processed
  let totalRemaining = 0;
  const folderSummary = [];
  
  for (const folder of folders) {
    const folderPath = join(pdfDir, folder.toString());
    if (!existsSync(folderPath)) continue;
    
    // Use find -print0 to handle filenames with newlines and special characters
    // Use shell: false and pass args as array to avoid shell interpretation issues
    const findOutput = execSync('find', [
      folderPath,
      '-maxdepth', '1',
      '-name', '*.pdf',
      '-type', 'f',
      '-print0'
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const files = findOutput
      .split('\0')
      .filter(path => path && path.trim())
      .map(fullPath => basename(fullPath))
      .filter(file => file.endsWith('.pdf'));
    
    const folderKey = `folder_${folder}`;
    const folderCheckpoint = checkpoint[folderKey] || { completed: [], failed: [] };
    // Normalize checkpoint filenames (convert literal \n to actual newline for comparison)
    const normalizedCompleted = folderCheckpoint.completed.map(f => f.replace(/\\n/g, '\n'));
    const completedSet = new Set(normalizedCompleted);
    const remaining = files.filter(f => !completedSet.has(f));
    
    if (remaining.length > 0) {
      totalRemaining += remaining.length;
      folderSummary.push({
        folder,
        remaining: remaining.length,
        failed: (folderCheckpoint.failed || []).length
      });
    }
  }
  
  if (totalRemaining === 0) {
    console.log('\n✅ All files have been processed! Nothing to do.\n');
    return;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total remaining files: ${totalRemaining}`);
  folderSummary.forEach(({ folder, remaining, failed }) => {
    console.log(`   Folder ${folder}: ${remaining} remaining${failed > 0 ? ` (${failed} failed)` : ''}`);
  });
  
  console.log('\n⚠️  This will process all remaining files across all folders.');
  console.log('Press Enter to continue, or any other key to cancel...\n');
  
  const confirm = await new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim() === '');
    });
  });
  
  if (!confirm) {
    console.log('Cancelled.\n');
    return;
  }
  
  // Process each folder
  for (const folder of folders) {
    const folderPath = join(pdfDir, folder.toString());
    if (!existsSync(folderPath)) continue;
    
    // Use find -print0 to handle filenames with newlines and special characters
    // Use shell: false and pass args as array to avoid shell interpretation issues
    const findOutput = execSync('find', [
      folderPath,
      '-maxdepth', '1',
      '-name', '*.pdf',
      '-type', 'f',
      '-print0'
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const files = findOutput
      .split('\0')
      .filter(path => path && path.trim())
      .map(fullPath => basename(fullPath))
      .filter(file => file.endsWith('.pdf'));
    
    const folderKey = `folder_${folder}`;
    const folderCheckpoint = checkpoint[folderKey] || { completed: [], failed: [] };
    // Normalize checkpoint filenames (convert literal \n to actual newline for comparison)
    const normalizedCompleted = folderCheckpoint.completed.map(f => f.replace(/\\n/g, '\n'));
    const completedSet = new Set(normalizedCompleted);
    const remaining = files.filter(f => !completedSet.has(f));
    
    if (remaining.length > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📁 Processing folder ${folder}: ${remaining.length} files remaining`);
      console.log('='.repeat(60));
      await batchProcessPDFs(pdfDir, folder, null, true); // Use resume mode
    } else {
      console.log(`\n⏭️  Folder ${folder}: All files completed, skipping...`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Finished processing all remaining files!');
  console.log('='.repeat(60) + '\n');
}

function showCheckpointStatus() {
  const checkpoint = loadCheckpoint();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 CHECKPOINT STATUS');
  console.log('='.repeat(60));
  
  const folders = ['-', '2', '3', '4', '5', '6', '7', '8'];
  let hasAnyProgress = false;
  
  for (const folder of folders) {
    const folderKey = `folder_${folder}`;
    const folderCheckpoint = checkpoint[folderKey];
    
    if (folderCheckpoint && (folderCheckpoint.completed.length > 0 || folderCheckpoint.failed.length > 0)) {
      hasAnyProgress = true;
      const total = folderCheckpoint.totalFiles || 0;
      const completed = folderCheckpoint.completed.length;
      const failed = folderCheckpoint.failed.length;
      const progress = total > 0 ? ((completed + failed) / total * 100).toFixed(1) : 0;
      
      console.log(`\n📁 Folder ${folder}:`);
      console.log(`   Total files: ${total}`);
      console.log(`   ✅ Completed: ${completed}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   📈 Progress: ${progress}%`);
      
      if (folderCheckpoint.lastProcessed) {
        console.log(`   🕐 Last processed: ${folderCheckpoint.lastProcessed}`);
        if (folderCheckpoint.lastProcessedTime) {
          const date = new Date(folderCheckpoint.lastProcessedTime);
          console.log(`   🕐 Time: ${date.toLocaleString()}`);
        }
      }
      
      if (failed > 0 && folderCheckpoint.failed.length <= 5) {
        console.log(`   Failed files:`);
        folderCheckpoint.failed.forEach(file => {
          const key = getCheckpointKey(folder, file);
          const error = folderCheckpoint.errors[key] || 'Unknown error';
          console.log(`     - ${file}`);
          console.log(`       Error: ${error}`);
        });
      }
    }
  }
  
  if (!hasAnyProgress) {
    console.log('\nℹ️  No checkpoint data found. All folders are fresh.');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.once('data', () => resolve());
  });
}

function setupReadline() {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
}

async function showMenu() {
  // Load comparison stats if available
  let siteTotal = 0;
  let localTotal = 0;
  let missingCount = 0;
  
  try {
    const comparisonFile = join(__dirname, '..', 'forms_comparison.json');
    if (existsSync(comparisonFile)) {
      const comparisonData = JSON.parse(readFileSync(comparisonFile, 'utf8'));
      siteTotal = comparisonData.metadata?.siteFormsTotal || 0;
      localTotal = comparisonData.metadata?.localFormsTotal || 0;
      missingCount = comparisonData.metadata?.extraLocallyCount || 0;
    }
  } catch (error) {
    // Ignore errors, just use defaults
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎭 COAST AUTOMATION - LIVE SESSION (PDF UPLOAD)');
  console.log('='.repeat(60));
  
  if (siteTotal > 0 || localTotal > 0) {
    const comparisonFile = join(__dirname, '..', 'forms_comparison.json');
    let missingLocallyCount = 0;
    let truncatedCount = 0;
    try {
      if (existsSync(comparisonFile)) {
        const comparisonData = JSON.parse(readFileSync(comparisonFile, 'utf8'));
        missingLocallyCount = comparisonData.metadata?.missingLocallyCount || 0;
        truncatedCount = comparisonData.metadata?.truncatedMatchesCount || 0;
      }
    } catch (error) {
      // Ignore errors
    }
    
    console.log('\n📊 STATISTICS:');
    console.log(`   Live site forms: ${siteTotal}`);
    console.log(`   Local PDF files: ${localTotal}`);
    const difference = localTotal - siteTotal;
    if (difference > 0) {
      console.log(`   📤 Need uploading: ${missingCount} forms (exist locally, not on site)`);
      if (missingLocallyCount > 0) {
        console.log(`   📥 Missing locally: ${missingLocallyCount} forms (exist on site, not local)`);
      }
      if (truncatedCount > 0) {
        console.log(`   ℹ️  Truncated matches: ${truncatedCount} (site forms with shortened names)`);
      }
      console.log(`   📊 Net difference: +${difference} (local has ${difference} more than site)`);
    } else if (difference < 0) {
      console.log(`   Difference: ${difference} (site has more)`);
    } else {
      console.log(`   ✅ Perfect match!`);
    }
  }
  
  console.log('\nPDF Folders:');
  console.log('  Folder -: 42 PDFs (starts with -)');
  console.log('  Folder 2: 375 PDFs (starts with 2)');
  console.log('  Folder 3: 148 PDFs (starts with 3)');
  console.log('  Folder 4: 65 PDFs (starts with 4)');
  console.log('  Folder 5: 225 PDFs (starts with 5)');
  console.log('  Folder 6: 19 PDFs (starts with 6)');
  console.log('  Folder 7: 175 PDFs (starts with 7)');
  console.log('  Folder 8: 14 PDFs (starts with 8)');
  console.log('\nCommands:');
  console.log('  c - Upload single test PDF (from folder 2)');
  console.log('  p - Upload single AI-optimized PDF by name (default)');
  console.log('  a - Upload single standard PDF by name');
  console.log('  - - Batch upload folder - (all PDFs)');
  console.log('  2-8 - Batch upload folder (all PDFs)');
  console.log('  F then - or 2-8 - Batch upload FULL folder with confirmation');
  console.log('  R then - or 2-8 - Resume batch upload (skip completed)');
  console.log('  A - Process ALL remaining files across ALL folders');
  console.log(`  M - Upload ${missingCount > 0 ? missingCount : 'missing'} missing forms (from comparison)`);
  console.log('  s - Show checkpoint status');
  console.log('  x - Clear checkpoint (with confirmation)');
  console.log('  r - Reload Coast app page');
  console.log('  q - Quit\n');
  console.log('Browser window will stay open - NO RE-LOGIN needed!');
  console.log('='.repeat(60));
  console.log('\nPress a key...\n');
}

async function handleCommand(key) {
  const pdfBaseDir = '/Users/mcardle/Sites/coasty/subforms_pdf_ai';  // Default to AI-optimized PDFs
  const pdfStandardDir = '/Users/mcardle/Sites/coasty/subforms_pdf';
  
  switch (key.trim()) {
    case 'c':
      // Test with the 2.16-ACCU-Semi-Annual.pdf file from folder 2
      const testPdfName = '2.16-ACCU-Semi-Annual';
      const testPdfPath = `${pdfBaseDir}/2/${testPdfName}.pdf`;
      
      console.log(`\n📄 Testing with PDF from folder 2:`);
      console.log(`   Form Name: ${testPdfName}`);
      console.log(`   PDF Path: ${testPdfPath}\n`);
      
      await createSubForm({
        pdfPath: testPdfPath
      });
      break;
    
    case 'p':
      await uploadSinglePDFByName(pdfBaseDir);  // Now defaults to AI-optimized
      return false; // Don't show menu immediately - it will be shown after input
    
    case 'a':
      await uploadSinglePDFByName(pdfStandardDir);  // 'a' now uses standard PDFs
      return false; // Don't show menu immediately - it will be shown after input
    
    // Batch process folders (all files)
    case '-':
      await batchProcessPDFs(pdfBaseDir, '-', null, false);  // Process all PDFs in folder -
      break;
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
      await batchProcessPDFs(pdfBaseDir, key, null, false);  // Process all PDFs in folder (no limit)
      break;
    
    // Full folder processing
    case 'F':
      // Next key will be the folder number
      console.log('\n📁 Enter folder (- or 2-8):');
      break;
    
    // Resume processing
    case 'R':
      console.log('\n📁 Enter folder to resume (- or 2-8):');
      break;
    
    // Process all remaining files across all folders
    case 'A':
      await processAllRemaining(pdfBaseDir);
      break;
    
    // Upload missing forms from comparison
    case 'M':
      await uploadMissingForms(pdfBaseDir);
      break;
    
    // Show checkpoint status
    case 's':
      showCheckpointStatus();
      break;
    
    // Clear checkpoint
    case 'x':
      console.log('\n⚠️  Are you sure you want to clear all checkpoint data?');
      console.log('Press Enter to confirm, or any other key to cancel...\n');
      const confirmClear = await new Promise((resolve) => {
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim() === '');
        });
      });
      if (confirmClear) {
        try {
          if (existsSync(CHECKPOINT_FILE)) {
            writeFileSync(CHECKPOINT_FILE, '{}', 'utf-8');
            console.log('\n✅ Checkpoint cleared!\n');
          } else {
            console.log('\nℹ️  No checkpoint file found.\n');
          }
        } catch (error) {
          console.log(`\n❌ Error clearing checkpoint: ${error.message}\n`);
        }
      } else {
        console.log('Cancelled.\n');
      }
      break;
      
    default:
      // Check if it's a folder number after 'F' (full processing)
      if ((key === '-' || (key >= '2' && key <= '8')) && lastKey === 'F') {
        const folderCounts = { '-': 42, '2': 375, '3': 148, '4': 65, '5': 225, '6': 19, '7': 175, '8': 14 };
        console.log(`\n⚠️  This will upload ALL ${folderCounts[key]} PDFs from folder ${key}!`);
        console.log('Press Enter to confirm, or any other key to cancel...\n');
        const confirm = await new Promise((resolve) => {
          process.stdin.once('data', (data) => {
            resolve(data.toString().trim() === '');
          });
        });
        if (confirm) {
          await batchProcessPDFs(pdfBaseDir, key, null, false);
        } else {
          console.log('Cancelled.');
        }
      }
      // Check if it's a folder number after 'R' (resume processing)
      else if ((key === '-' || (key >= '2' && key <= '8')) && lastKey === 'R') {
        const checkpoint = loadCheckpoint();
        const folderKey = `folder_${key}`;
        const folderCheckpoint = checkpoint[folderKey] || { completed: [], failed: [] };
        const totalCompleted = folderCheckpoint.completed.length;
        const totalFailed = folderCheckpoint.failed.length;
        
        console.log(`\n📋 Resuming folder ${key}:`);
        console.log(`   ✅ Already completed: ${totalCompleted}`);
        console.log(`   ❌ Previously failed: ${totalFailed}`);
        console.log(`\nPress Enter to resume, or any other key to cancel...\n`);
        const confirm = await new Promise((resolve) => {
          process.stdin.once('data', (data) => {
            resolve(data.toString().trim() === '');
          });
        });
        if (confirm) {
          await batchProcessPDFs(pdfBaseDir, key, null, true);
        } else {
          console.log('Cancelled.');
        }
      }
      break;
      
    case 'r':
      console.log('\n🔄 Reloading page...');
      await page.reload();
      await page.waitForTimeout(1000);
      console.log('✅ Page reloaded\n');
      break;
      
    case 'q':
      console.log('\n👋 Closing browser...');
      await context.close();
      process.exit(0);
      break;
  }
}

async function main() {
  console.log('🚀 Starting Coast Automation - LIVE SESSION MODE\n');
  
  await initialize();
  
  setupReadline();
  
  await showMenu();
  
  process.stdin.on('data', async (key) => {
    const keyStr = key.toString().trim();
    
    if (keyStr === '\u0003') { // Ctrl+C
      console.log('\n\nExiting...');
      await context.close();
      process.exit(0);
    }
    
    // For 'p' command, handleCommand will manage its own flow
    const handled = await handleCommand(keyStr);
    if (handled !== false) {
      lastKey = keyStr; // Track last key for multi-key commands
      await showMenu();
    }
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

