import { readFileSync, existsSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';

const PDF_BASE_DIR = '/Users/mcardle/Sites/coasty/subforms_pdf_ai';
const COMPARISON_FILE = 'forms_comparison.json';
const FOLDERS = ['-', '2', '3', '4', '5', '6', '7', '8'];

function getAllPDFsInFolder(folder) {
  const folderPath = join(PDF_BASE_DIR, folder);
  if (!existsSync(folderPath)) return [];
  
  try {
    // Use find command as shell string (macOS compatible)
    const findCmd = `find "${folderPath}" -maxdepth 1 -name "*.pdf" -type f -print0`;
    const findOutput = execSync(findCmd, { 
      encoding: 'utf8', 
      maxBuffer: 10 * 1024 * 1024 
    });
    
    return findOutput
      .split('\0')
      .filter(path => path && path.trim())
      .map(fullPath => ({
        fullPath,
        fileName: basename(fullPath),
        formName: basename(fullPath).replace(/\.pdf$/i, '')
      }));
  } catch (error) {
    // If find fails, fall back to readdirSync (less accurate for newlines)
    try {
      return readdirSync(folderPath)
        .filter(file => file.endsWith('.pdf'))
        .map(file => ({
          fullPath: join(folderPath, file),
          fileName: file,
          formName: file.replace(/\.pdf$/i, '')
        }));
    } catch (e) {
      return [];
    }
  }
}

function findPDFFile(formName, allFilesByFolder) {
  // Search through pre-loaded files
  for (const folder of FOLDERS) {
    const files = allFilesByFolder[folder] || [];
    for (const file of files) {
      if (file.formName === formName) {
        return {
          folder,
          fileName: file.fileName,
          fullPath: file.fullPath
        };
      }
    }
  }
  return null;
}

async function main() {
  console.log('🔍 Finding PDF files for missing forms...\n');
  
  // Load comparison data
  const comparisonData = JSON.parse(readFileSync(COMPARISON_FILE, 'utf8'));
  const extraLocally = comparisonData.extraLocally || [];
  const truncatedSiteForms = new Set(comparisonData.truncatedMatches || []);
  
  // Also need to find local forms that match truncated site forms
  // These need to be uploaded because site only has truncated versions
  console.log('📂 Loading all PDF files from folders...\n');
  
  // Pre-load all files from all folders
  const allFilesByFolder = {};
  for (const folder of FOLDERS) {
    allFilesByFolder[folder] = getAllPDFsInFolder(folder);
    console.log(`   Folder ${folder}: ${allFilesByFolder[folder].length} PDFs`);
  }
  
  // Load site forms to check if local forms are already on site
  const siteData = JSON.parse(readFileSync('forms_from_site.json', 'utf8'));
  const siteFormsSet = new Set(siteData.forms);
  
  // Find local forms that match truncated site forms
  // Only include if they're not already exactly on the site
  const localFormsMatchingTruncated = [];
  const usedTruncatedSiteForms = new Set(); // Track which truncated site forms we've matched
  
  for (const folder of FOLDERS) {
    const files = allFilesByFolder[folder] || [];
    for (const file of files) {
      const formName = file.formName;
      
      // Skip if already exactly on site
      if (siteFormsSet.has(formName)) {
        continue;
      }
      
      // Check if this local form matches a truncated site form
      for (const truncatedSiteForm of truncatedSiteForms) {
        // Only match each truncated site form once (to avoid duplicates)
        if (usedTruncatedSiteForms.has(truncatedSiteForm)) {
          continue;
        }
        
        const localFormNoNewline = formName.replace(/\n/g, '');
        const siteFormNoNewline = truncatedSiteForm.replace(/\n/g, '');
        if (localFormNoNewline.startsWith(siteFormNoNewline) && localFormNoNewline.length > siteFormNoNewline.length) {
          localFormsMatchingTruncated.push({
            formName,
            folder,
            fileName: file.fileName,
            fullPath: file.fullPath,
            matchedTruncatedSiteForm: truncatedSiteForm
          });
          usedTruncatedSiteForms.add(truncatedSiteForm);
          break; // Only match one local form per truncated site form
        }
      }
    }
  }
  
  // Combine extra locally forms with forms matching truncated site forms
  // But limit to the actual difference (local - site)
  const expectedDifference = comparisonData.metadata.localFormsTotal - comparisonData.metadata.siteFormsTotal;
  const missingForms = [...extraLocally];
  
  // Only add forms matching truncated site forms if we haven't reached the expected difference
  // Since we have 4 extra forms, we can add up to (expectedDifference - 4) forms matching truncated site forms
  const maxTruncatedToAdd = Math.max(0, expectedDifference - extraLocally.length);
  const formsToAddFromTruncated = localFormsMatchingTruncated.slice(0, maxTruncatedToAdd);
  
  console.log(`\n📊 Forms breakdown:`);
  console.log(`   Extra locally (no match): ${extraLocally.length}`);
  console.log(`   Forms matching truncated site forms found: ${localFormsMatchingTruncated.length}`);
  console.log(`   Expected difference (local - site): ${expectedDifference}`);
  console.log(`   Adding ${formsToAddFromTruncated.length} forms matching truncated site forms`);
  console.log(`   Total missing forms: ${missingForms.length + formsToAddFromTruncated.length}\n`);
  
  console.log('🔍 Matching missing forms to files...\n');
  
  const found = [];
  const notFound = [];
  
  // Add forms from extraLocally
  for (const formName of missingForms) {
    const result = findPDFFile(formName, allFilesByFolder);
    if (result) {
      found.push({ formName, ...result });
    } else {
      notFound.push(formName);
    }
  }
  
  // Add forms that match truncated site forms (limited to expected difference)
  formsToAddFromTruncated.forEach(item => {
    found.push({
      formName: item.formName,
      folder: item.folder,
      fileName: item.fileName,
      fullPath: item.fullPath,
      matchedTruncatedSiteForm: item.matchedTruncatedSiteForm
    });
  });
  
  // Group by folder
  const byFolder = {};
  found.forEach(item => {
    if (!byFolder[item.folder]) {
      byFolder[item.folder] = [];
    }
    byFolder[item.folder].push(item);
  });
  
  // Print results
  console.log('✅ FOUND FILES:\n');
  console.log('='.repeat(80));
  
  Object.keys(byFolder).sort().forEach(folder => {
    console.log(`\n📁 Folder: ${folder} (${byFolder[folder].length} files)`);
    console.log('-'.repeat(80));
    byFolder[folder].forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.formName}`);
      console.log(`     File: ${item.fileName}`);
    });
  });
  
  if (notFound.length > 0) {
    console.log('\n\n❌ NOT FOUND:\n');
    console.log('='.repeat(80));
    notFound.forEach((formName, idx) => {
      console.log(`  ${idx + 1}. ${formName}`);
    });
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY:');
  console.log('='.repeat(80));
  console.log(`✅ Found: ${found.length}`);
  console.log(`❌ Not found: ${notFound.length}`);
  console.log(`📁 Folders with missing forms:`);
  Object.keys(byFolder).sort().forEach(folder => {
    console.log(`   - Folder ${folder}: ${byFolder[folder].length} files`);
  });
  
  // Output JSON for programmatic use
  const output = {
    found: found.map(item => ({
      formName: item.formName,
      folder: item.folder,
      fileName: item.fileName,
      fullPath: item.fullPath,
      matchedTruncatedSiteForm: item.matchedTruncatedSiteForm || null
    })),
    notFound,
    summary: {
      totalMissing: missingForms.length + formsToAddFromTruncated.length,
      expectedDifference: expectedDifference,
      extraLocally: extraLocally.length,
      matchingTruncatedFound: localFormsMatchingTruncated.length,
      matchingTruncatedAdded: formsToAddFromTruncated.length,
      found: found.length,
      notFound: notFound.length,
      byFolder: Object.keys(byFolder).reduce((acc, folder) => {
        acc[folder] = byFolder[folder].length;
        return acc;
      }, {})
    }
  };
  
  writeFileSync(
    'missing_uploads_list.json',
    JSON.stringify(output, null, 2)
  );
  
  console.log('\n💾 Detailed list saved to: missing_uploads_list.json');
}

main();

