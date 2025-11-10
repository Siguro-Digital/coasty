import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { basename } from 'path';

/**
 * Compare forms from the site (JSON) with local PDF files
 * Find what's missing locally and what's extra locally
 */

function normalizeFormName(name) {
  // Remove "X fields" suffix and other metadata
  return name
    .replace(/\d+\s+fields?$/i, '')
    .replace(/\d+\s+field$/i, '')
    .trim();
}

function getLocalPDFs() {
  const pdfDir = 'subforms_pdf_ai';
  const folders = ['-', '2', '3', '4', '5', '6', '7', '8'];
  const localForms = new Set();
  
  folders.forEach(folder => {
    const folderPath = `${pdfDir}/${folder}`;
    try {
      // Use find -print0 to handle filenames with newlines
      const findOutput = execSync(`find "${folderPath}" -maxdepth 1 -name "*.pdf" -type f -print0`, 
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      
      const files = findOutput
        .split('\0')
        .filter(path => path && path.trim())
        .map(fullPath => basename(fullPath))
        .filter(file => file.endsWith('.pdf'))
        .map(file => file.replace('.pdf', '')); // Remove .pdf extension
      
      files.forEach(form => localForms.add(form));
    } catch (error) {
      console.error(`Error reading folder ${folder}:`, error.message);
    }
  });
  
  return localForms;
}

function compareForms(siteJsonPath, outputPath) {
  console.log('Loading site forms from JSON...');
  const siteData = JSON.parse(readFileSync(siteJsonPath, 'utf8'));
  
  // Normalize site form names (remove "X fields" suffixes)
  const siteForms = new Set(
    siteData.forms.map(form => normalizeFormName(form))
  );
  
  console.log(`Site forms (after normalization): ${siteForms.size}`);
  
  console.log('Loading local PDF forms...');
  const localForms = getLocalPDFs();
  console.log(`Local forms: ${localForms.size}`);
  
  // Find forms on site but not locally
  // But check if they're actually prefixes of local forms (truncated names)
  const missingLocally = [];
  const truncatedMatches = new Set(); // Track which site forms are actually truncated versions
  
  siteForms.forEach(siteForm => {
    if (!localForms.has(siteForm)) {
      // Check if this site form is a prefix of any local form (handles newlines)
      let isTruncated = false;
      localForms.forEach(localForm => {
        // Remove newlines from local form for comparison
        const localFormNoNewline = localForm.replace(/\n/g, '');
        const siteFormNoNewline = siteForm.replace(/\n/g, '');
        
        // Check if site form matches the start of local form
        if (localFormNoNewline.startsWith(siteFormNoNewline) && localFormNoNewline.length > siteFormNoNewline.length) {
          isTruncated = true;
          truncatedMatches.add(siteForm);
        }
      });
      
      if (!isTruncated) {
        missingLocally.push(siteForm);
      }
    }
  });
  
  // Find forms locally but not on site
  const extraLocally = [];
  localForms.forEach(localForm => {
    if (!siteForms.has(localForm)) {
      // Check if this local form is actually a longer version of a site form
      let isExtended = false;
      siteForms.forEach(siteForm => {
        const localFormNoNewline = localForm.replace(/\n/g, '');
        const siteFormNoNewline = siteForm.replace(/\n/g, '');
        if (localFormNoNewline.startsWith(siteFormNoNewline) && localFormNoNewline.length > siteFormNoNewline.length) {
          isExtended = true;
        }
      });
      
      if (!isExtended) {
        extraLocally.push(localForm);
      }
    }
  });
  
  // Find matching forms
  const matching = [];
  siteForms.forEach(siteForm => {
    if (localForms.has(siteForm)) {
      matching.push(siteForm);
    }
  });
  
  // Create comparison report
  const report = {
    metadata: {
      comparedAt: new Date().toISOString(),
      siteFormsTotal: siteForms.size,
      localFormsTotal: localForms.size,
      matchingCount: matching.length,
      missingLocallyCount: missingLocally.length,
      extraLocallyCount: extraLocally.length,
      truncatedMatchesCount: truncatedMatches.size
    },
    matching: matching.sort(),
    missingLocally: missingLocally.sort(),
    extraLocally: extraLocally.sort(),
    truncatedMatches: Array.from(truncatedMatches).sort() // Forms on site that are truncated versions of local forms
  };
  
  // Write report
  writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('COMPARISON SUMMARY');
  console.log('='.repeat(60));
  console.log(`Site forms: ${siteForms.size}`);
  console.log(`Local forms: ${localForms.size}`);
  console.log(`✅ Matching: ${matching.length}`);
  console.log(`❌ Missing locally: ${missingLocally.length}`);
  console.log(`➕ Extra locally: ${extraLocally.length}`);
  if (truncatedMatches.size > 0) {
    console.log(`ℹ️  Truncated matches: ${truncatedMatches.size} (site forms that are prefixes of local forms)`);
  }
  console.log('='.repeat(60));
  
  if (missingLocally.length > 0) {
    console.log(`\n📋 Top 20 forms missing locally:`);
    missingLocally.slice(0, 20).forEach(form => console.log(`   - ${form}`));
    if (missingLocally.length > 20) {
      console.log(`   ... and ${missingLocally.length - 20} more`);
    }
  }
  
  if (extraLocally.length > 0) {
    console.log(`\n📋 Top 20 forms extra locally:`);
    extraLocally.slice(0, 20).forEach(form => console.log(`   - ${form}`));
    if (extraLocally.length > 20) {
      console.log(`   ... and ${extraLocally.length - 20} more`);
    }
  }
  
  console.log(`\n📄 Full report written to: ${outputPath}`);
  
  return report;
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('compare_forms.js')) {
  const siteJson = process.argv[2] || 'forms_from_site.json';
  const outputFile = process.argv[3] || 'forms_comparison.json';
  compareForms(siteJson, outputFile);
}

export { compareForms };

