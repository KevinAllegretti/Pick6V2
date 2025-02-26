#!/usr/bin/env node
// run-tests.ts - Run multiple stress tests with different user counts

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration for the test runs
const testRuns = [
  { users: 20, duration: 60, name: 'light-load' },
  { users: 50, duration: 60, name: 'medium-load' },
  { users: 100, duration: 60, name: 'heavy-load' },
  { users: 200, duration: 60, name: 'extreme-load' },
];

// Results directory
const resultsDir = path.join(__dirname, 'stress-test-results');

// Ensure results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Function to run a single test
async function runTest(users: number, duration: number, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n========================================`);
    console.log(`Starting test: ${name} (${users} users, ${duration}s)`);
    console.log(`========================================\n`);
    
    // Create a temporary config file with the specified parameters
    const configContent = `
    export const testConfig = {
      concurrentUsers: ${users},
      testDurationSec: ${duration},
      // Other configs remain the same
    };
    `;
    
    fs.writeFileSync(path.join(__dirname, 'temp-config.ts'), configContent);
    
    // Execute the stress test
    const logFile = path.join(resultsDir, `${name}-results.log`);
    const child = exec(`npx ts-node ./stress-test.ts | tee ${logFile}`);
    
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ Test "${name}" completed successfully. Results saved to ${logFile}`);
        resolve();
      } else {
        console.error(`\n❌ Test "${name}" failed with code ${code}`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
  });
}

// Run all tests in sequence
async function runAllTests() {
  console.log('Starting automated stress test sequence');
  console.log(`Will run ${testRuns.length} tests with different user loads`);
  console.log('Results will be saved to:', resultsDir);
  
  for (const test of testRuns) {
    try {
      await runTest(test.users, test.duration, test.name);
      // Add a brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error running test "${test.name}":`, error);
      // Continue with next test even if one fails
    }
  }
  
  console.log('\n========================================');
  console.log('All tests completed!');
  console.log('Check the results in:', resultsDir);
  console.log('========================================');
}

// Execute all tests
runAllTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});