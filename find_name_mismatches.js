import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { basename } from 'path';

/**
 * Compare live forms from site with local PDF filenames
 * Find name mismatches and duplicates
 */

function normalizeFormName(name) {
  // Remove "X fields" suffix and normalize
  return name
    .replace(/\d+\s+fields?$/i, '')
    .replace(/\d+\s+field$/i, '')
    .trim();
}

function getLocalPDFs() {
  const pdfDir = 'subforms_pdf_ai';
  const folders = ['-', '2', '3', '4', '5', '6', '7', '8'];
  const localFiles = [];
  
  folders.forEach(folder => {
    const folderPath = `${pdfDir}/${folder}`;
    try {
      const findOutput = execSync(`find "${folderPath}" -maxdepth 1 -name "*.pdf" -type f -print0`, 
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      
      const files = findOutput
        .split('\0')
        .filter(path => path && path.trim())
        .map(fullPath => {
          const fileName = basename(fullPath);
          const formName = fileName.replace(/\.pdf$/i, '');
          return {
            folder,
            fileName,
            formName,
            fullPath
          };
        });
      
      localFiles.push(...files);
    } catch (error) {
      console.error(`Error reading folder ${folder}:`, error.message);
    }
  });
  
  return localFiles;
}

function findMismatchesAndDuplicates() {
  console.log('Loading live forms from site...');
  const siteData = JSON.parse(readFileSync('forms_from_site.json', 'utf8'));
  const liveForms = siteData.forms.map(form => normalizeFormName(form));
  
  console.log(`Found ${liveForms.length} live forms on site`);
  
  console.log('\nLoading local PDF files...');
  const localFiles = getLocalPDFs();
  console.log(`Found ${localFiles.length} local PDF files`);
  
  // Create maps for comparison
  const liveFormsSet = new Set(liveForms);
  const liveFormsMap = new Map(); // formName -> count
  liveForms.forEach(form => {
    liveFormsMap.set(form, (liveFormsMap.get(form) || 0) + 1);
  });
  
  const localFormsMap = new Map(); // formName -> [files]
  localFiles.forEach(file => {
    if (!localFormsMap.has(file.formName)) {
      localFormsMap.set(file.formName, []);
    }
    localFormsMap.get(file.formName).push(file);
  });
  
  // Find exact matches
  const exactMatches = [];
  liveForms.forEach(liveForm => {
    if (localFormsMap.has(liveForm)) {
      exactMatches.push({
        liveForm,
        localFiles: localFormsMap.get(liveForm)
      });
    }
  });
  
  // Find name mismatches (live form exists but name doesn't match exactly)
  const nameMismatches = [];
  liveForms.forEach(liveForm => {
    if (!localFormsMap.has(liveForm)) {
      // Check if there's a similar name (fuzzy match)
      let foundMatch = false;
      const possibleMatches = [];
      
      localFiles.forEach(localFile => {
        const localFormNoNewline = localFile.formName.replace(/\n/g, ' ');
        const liveFormNoNewline = liveForm.replace(/\n/g, ' ');
        
        // Check if they're similar (one contains the other, or vice versa)
        if (localFormNoNewline.includes(liveFormNoNewline) || 
            liveFormNoNewline.includes(localFormNoNewline)) {
          possibleMatches.push(localFile);
          foundMatch = true;
        }
      });
      
      if (foundMatch) {
        nameMismatches.push({
          liveForm,
          possibleMatches
        });
      }
    }
  });
  
  // Find duplicates in live forms
  const liveDuplicates = [];
  liveFormsMap.forEach((count, formName) => {
    if (count > 1) {
      liveDuplicates.push({
        formName,
        count
      });
    }
  });
  
  // Find duplicates in local files (same form name, multiple PDFs)
  const localDuplicates = [];
  localFormsMap.forEach((files, formName) => {
    if (files.length > 1) {
      localDuplicates.push({
        formName,
        count: files.length,
        files: files.map(f => ({
          folder: f.folder,
          fileName: f.fileName,
          fullPath: f.fullPath
        }))
      });
    }
  });
  
  // Find forms on site but not local (exact match)
  const missingLocally = liveForms.filter(liveForm => !localFormsMap.has(liveForm));
  
  // Find forms local but not on site (exact match)
  const extraLocally = Array.from(localFormsMap.keys()).filter(localForm => !liveFormsSet.has(localForm));
  
  // Create report
  const report = {
    metadata: {
      analyzedAt: new Date().toISOString(),
      liveFormsCount: liveForms.length,
      localFilesCount: localFiles.length,
      exactMatchesCount: exactMatches.length,
      nameMismatchesCount: nameMismatches.length,
      liveDuplicatesCount: liveDuplicates.length,
      localDuplicatesCount: localDuplicates.length,
      missingLocallyCount: missingLocally.length,
      extraLocallyCount: extraLocally.length
    },
    exactMatches: exactMatches.slice(0, 100), // Limit for readability
    nameMismatches,
    liveDuplicates,
    localDuplicates,
    missingLocally: missingLocally.slice(0, 100),
    extraLocally: extraLocally.slice(0, 100)
  };
  
  // Write report
  writeFileSync('live_forms.json', JSON.stringify({ forms: liveForms, metadata: siteData.metadata }, null, 2), 'utf8');
  writeFileSync('name_mismatches_report.json', JSON.stringify(report, null, 2), 'utf8');
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('COMPARISON SUMMARY');
  console.log('='.repeat(60));
  console.log(`Live forms on site: ${liveForms.length}`);
  console.log(`Local PDF files: ${localFiles.length}`);
  console.log(`✅ Exact matches: ${exactMatches.length}`);
  console.log(`⚠️  Name mismatches: ${nameMismatches.length}`);
  console.log(`🔄 Live form duplicates: ${liveDuplicates.length}`);
  console.log(`🔄 Local file duplicates: ${localDuplicates.length}`);
  console.log(`❌ Missing locally: ${missingLocally.length}`);
  console.log(`➕ Extra locally: ${extraLocally.length}`);
  console.log('='.repeat(60));
  
  if (nameMismatches.length > 0) {
    console.log('\n📋 NAME MISMATCHES (first 20):');
    nameMismatches.slice(0, 20).forEach(({ liveForm, possibleMatches }) => {
      console.log(`\n  Live: "${liveForm}"`);
      possibleMatches.slice(0, 3).forEach(match => {
        console.log(`    → Local: "${match.formName}" (Folder ${match.folder})`);
      });
    });
  }
  
  if (liveDuplicates.length > 0) {
    console.log('\n🔄 LIVE FORM DUPLICATES:');
    liveDuplicates.forEach(({ formName, count }) => {
      console.log(`  "${formName}" appears ${count} times on site`);
    });
  }
  
  if (localDuplicates.length > 0) {
    console.log('\n🔄 LOCAL FILE DUPLICATES:');
    localDuplicates.forEach(({ formName, count, files }) => {
      console.log(`  "${formName}" has ${count} PDF files:`);
      files.forEach(file => {
        console.log(`    - ${file.folder}/${file.fileName}`);
      });
    });
  }
  
  console.log('\n📄 Full report written to: name_mismatches_report.json');
  console.log('📄 Live forms list written to: live_forms.json');
  
  return report;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('find_name_mismatches.js')) {
  findMismatchesAndDuplicates();
}

export { findMismatchesAndDuplicates };


