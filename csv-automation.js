import 'dotenv/config';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { createCoastItem } from './index.js';

/**
 * Processes a CSV file and creates items in Coast app
 * CSV should have columns: name, tag, assignee, dueDate
 */
async function processCSV(filePath) {
  console.log(`📄 Reading CSV file: ${filePath}\n`);
  
  try {
    // Read and parse CSV
    const fileContent = readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Found ${records.length} items to process\n`);
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`\n📝 Processing item ${i + 1}/${records.length}:`);
      console.log(`   Name: ${record.name}`);
      console.log(`   Tag: ${record.tag || 'N/A'}`);
      console.log(`   Assignee: ${record.assignee || 'N/A'}`);
      console.log(`   Due Date: ${record.dueDate || 'N/A'}`);
      
      try {
        await createCoastItem({
          name: record.name,
          tag: record.tag,
          assignee: record.assignee,
          dueDate: record.dueDate
        });
        
        console.log(`   ✅ Item ${i + 1} created successfully`);
        
        // Add a delay between items to avoid rate limiting
        if (i < records.length - 1) {
          console.log('   ⏳ Waiting 3 seconds before next item...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`   ❌ Failed to create item ${i + 1}:`, error.message);
        // Continue with next item instead of stopping
      }
    }
    
    console.log('\n\n🎉 CSV processing completed!');
    
  } catch (error) {
    console.error('❌ Error processing CSV:', error.message);
    process.exit(1);
  }
}

// Get CSV file path from command line argument
const csvFile = process.argv[2];

if (!csvFile) {
  console.error('❌ Please provide a CSV file path');
  console.log('\nUsage: node csv-automation.js <path-to-csv-file>');
  console.log('\nExample CSV format:');
  console.log('name,tag,assignee,dueDate');
  console.log('Task 1,urgent,John Doe,2025-11-01');
  console.log('Task 2,normal,Jane Smith,2025-11-05');
  process.exit(1);
}

processCSV(csvFile);

