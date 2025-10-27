import 'dotenv/config';
import { createCoastItem } from './index.js';

/**
 * Test script to verify the automation works
 */
async function runTest() {
  console.log('🚀 Starting Coast automation test...\n');
  
  const testData = {
    name: 'Test Item - ' + new Date().toLocaleString(),
    tag: 'test-tag',
    assignee: 'Test Assignee',
    dueDate: '2025-11-15'
  };
  
  console.log('Test data:', testData);
  console.log('');
  
  try {
    await createCoastItem(testData);
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();

