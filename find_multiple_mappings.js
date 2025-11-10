import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { basename } from 'path';

/**
 * Find cases where one site form maps to multiple local PDF files
 * This helps identify if names are being truncated or if there are true duplicates
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

function findMultipleMappings() {
  console.log('Loading live forms from site...');
  const siteData = JSON.parse(readFileSync('forms_from_site.json', 'utf8'));
  const liveForms = siteData.forms.map(form => normalizeFormName(form));
  
  console.log(`Found ${liveForms.length} live forms on site`);
  
  console.log('\nLoading local PDF files...');
  const localFiles = getLocalPDFs();
  console.log(`Found ${localFiles.length} local PDF files`);
  
  // Find cases where a site form matches multiple local PDFs
  const multipleMappings = [];
  
  liveForms.forEach(liveForm => {
    const matchingLocalFiles = [];
    
    localFiles.forEach(localFile => {
      const localFormNoNewline = localFile.formName.replace(/\n/g, ' ');
      const liveFormNoNewline = liveForm.replace(/\n/g, ' ');
      
      // Check if live form is a prefix of local form (truncated match)
      if (localFormNoNewline.startsWith(liveFormNoNewline) && 
          localFormNoNewline.length > liveFormNoNewline.length) {
        matchingLocalFiles.push(localFile);
      }
      // Also check exact match
      else if (localFormNoNewline === liveFormNoNewline) {
        matchingLocalFiles.push(localFile);
      }
    });
    
    if (matchingLocalFiles.length > 1) {
      multipleMappings.push({
        liveForm,
        liveFormLength: liveForm.length,
        localFiles: matchingLocalFiles.map(f => ({
          folder: f.folder,
          fileName: f.fileName,
          formName: f.formName,
          formNameLength: f.formName.length,
          difference: f.formName.length - liveForm.length
        }))
      });
    }
  });
  
  // Sort by number of matches (most matches first)
  multipleMappings.sort((a, b) => b.localFiles.length - a.localFiles.length);
  
  // Create report
  const report = {
    metadata: {
      analyzedAt: new Date().toISOString(),
      liveFormsCount: liveForms.length,
      localFilesCount: localFiles.length,
      multipleMappingsCount: multipleMappings.length,
      totalAffectedLocalFiles: multipleMappings.reduce((sum, m) => sum + m.localFiles.length, 0)
    },
    multipleMappings
  };
  
  // Write report
  writeFileSync('multiple_mappings_report.json', JSON.stringify(report, null, 2), 'utf8');
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('MULTIPLE MAPPINGS REPORT');
  console.log('='.repeat(60));
  console.log(`Site forms mapping to multiple local PDFs: ${multipleMappings.length}`);
  console.log(`Total affected local PDF files: ${report.metadata.totalAffectedLocalFiles}`);
  console.log('='.repeat(60));
  
  if (multipleMappings.length > 0) {
    console.log('\n📋 DETAILED LISTING:\n');
    
    multipleMappings.forEach((mapping, idx) => {
      console.log(`${idx + 1}. Site Form: "${mapping.liveForm}"`);
      console.log(`   Length: ${mapping.liveFormLength} characters`);
      console.log(`   Maps to ${mapping.localFiles.length} local PDF(s):`);
      
      mapping.localFiles.forEach((localFile, fileIdx) => {
        const truncatedPart = localFile.formName.substring(mapping.liveFormLength);
        console.log(`   ${fileIdx + 1}. "${localFile.formName}"`);
        console.log(`      Folder: ${localFile.folder}`);
        console.log(`      Length: ${localFile.formNameLength} chars (+${localFile.difference} chars)`);
        console.log(`      Truncated part: "${truncatedPart}"`);
        console.log(`      File: ${localFile.fileName}`);
      });
      console.log('');
    });
  }
  
  // Summary statistics
  console.log('\n📊 SUMMARY STATISTICS:');
  console.log('='.repeat(60));
  const mappingCounts = {};
  multipleMappings.forEach(m => {
    const count = m.localFiles.length;
    mappingCounts[count] = (mappingCounts[count] || 0) + 1;
  });
  
  Object.keys(mappingCounts).sort((a, b) => b - a).forEach(count => {
    console.log(`  ${mappingCounts[count]} site form(s) map to ${count} local PDF(s)`);
  });
  
  console.log('\n📄 Full report written to: multiple_mappings_report.json');
  
  return report;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('find_multiple_mappings.js')) {
  findMultipleMappings();
}

export { findMultipleMappings };


