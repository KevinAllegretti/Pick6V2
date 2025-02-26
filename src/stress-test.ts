// stress-test.ts - A TypeScript script to load test your MongoDB application
import axios from 'axios';
import { MongoClient, Collection } from 'mongodb';
import * as os from 'os';

// Types
interface RequestMetrics {
  time: number;
  success: boolean;
  responseTime?: number;
}

interface ServerStats {
  initialMemory: NodeJS.MemoryUsage;
  finalMemory: NodeJS.MemoryUsage | null;
  cpuUsageStart: number[];
  cpuUsageEnd: number[] | null;
  freeMem: {
    start: number;
    end: number | null;
  };
}

interface TestConfig {
  baseUrl: string;
  apiEndpoint: string;
  mongoDbUri: string;
  dbName: string;
  collectionName: string;
  concurrentUsers: number;
  testDurationSec: number;
  rampUpSec: number;
  requestIntervalMs: number;
  // Array of usernames to test with - randomly selected for each request
  usernames: string[];
}

// Configuration - MODIFY THESE VALUES
const config: TestConfig = {
  baseUrl: 'http://localhost:3000', // Your site URL
  apiEndpoint: '/api/getUserProfile', // Profile endpoint
  mongoDbUri: 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/', // Your MongoDB connection string
  dbName: 'Pick6',
  collectionName: 'users',
  concurrentUsers: 24, // Number of simulated concurrent users
  testDurationSec: 60, // Duration of test in seconds
  rampUpSec: 10, // Time to ramp up to full load
  requestIntervalMs: 500, // Time between requests from each "user"
  usernames: ['test1', 'test2', 'test3', 'test4', 'test5'] // Add your actual usernames here
};

// Metrics storage
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let responseTimeTotal = 0;
let dbOperationTimeTotal = 0;
let totalDbOperations = 0;
let errorsByType: Record<string, number> = {};
let maxResponseTime = 0;
let minResponseTime = Number.MAX_SAFE_INTEGER;
let requestTimestamps: RequestMetrics[] = [];
let serverStats: ServerStats = {
  initialMemory: process.memoryUsage(),
  finalMemory: null,
  cpuUsageStart: os.loadavg(),
  cpuUsageEnd: null,
  freeMem: {
    start: os.freemem(),
    end: null
  }
};

// Print test configuration
console.log('====================================');
console.log('STRESS TEST CONFIGURATION');
console.log('====================================');
console.log(`Target URL: ${config.baseUrl}${config.apiEndpoint}`);
console.log(`Concurrent Users: ${config.concurrentUsers}`);
console.log(`Test Duration: ${config.testDurationSec} seconds`);
console.log(`Ramp Up Time: ${config.rampUpSec} seconds`);
console.log(`Request Interval: ${config.requestIntervalMs}ms per user`);
console.log('====================================');

// Get a random username from the list
const getRandomUsername = (): string => {
  return config.usernames[Math.floor(Math.random() * config.usernames.length)];
};

// Sleep function
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Simulates a single user's activity
async function simulateUser(userId: number): Promise<void> {
  const startTime = Date.now();
  const endTime = startTime + (config.testDurationSec * 1000);
  
  console.log(`User ${userId} started`);
  
  while (Date.now() < endTime) {
    try {
      // Get a random username for this request
      const username = getRandomUsername();
      
      // API request test
      const requestStart = Date.now();
      const response = await axios.get(`${config.baseUrl}${config.apiEndpoint}/${username}`);
      const requestEnd = Date.now();
      const responseTime = requestEnd - requestStart;
      
      // Record metrics
      totalRequests++;
      successfulRequests++;
      responseTimeTotal += responseTime;
      maxResponseTime = Math.max(maxResponseTime, responseTime);
      minResponseTime = Math.min(minResponseTime, responseTime);
      requestTimestamps.push({ 
        time: requestEnd, 
        success: true,
        responseTime
      });
      
      // Optional: Test database operations directly
      try {
        const client = new MongoClient(config.mongoDbUri);
        const dbStart = Date.now();
        await client.connect();
        const db = client.db(config.dbName);
        const collection = db.collection(config.collectionName);
        
        // Perform a simple find operation (adjust as needed)
        await collection.find({}).limit(5).toArray();
        
        const dbEnd = Date.now();
        dbOperationTimeTotal += (dbEnd - dbStart);
        totalDbOperations++;
        await client.close();
      } catch (dbErr: any) {
        // Record database errors
        const errorType = dbErr.name || 'UnknownDBError';
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        console.error(`DB Error (User ${userId}):`, dbErr.message);
      }
      
      // Wait before next request
      await sleep(config.requestIntervalMs);
      
    } catch (err: any) {
        failedRequests++;
        const errorType = err.name || 'UnknownError';
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        requestTimestamps.push({ time: Date.now(), success: false });
        // Add more detailed error logging
        console.error(`Error (User ${userId}):`, err.message);
        if (err.response) {
          console.error(`Response status: ${err.response.status}`);
          console.error(`Response data:`, err.response.data);
        }
        
        // Wait before retrying
        await sleep(config.requestIntervalMs);
      }
  }
  
  console.log(`User ${userId} finished`);
}

// Calculate and display metrics
function displayResults(): void {
  serverStats.finalMemory = process.memoryUsage();
  serverStats.cpuUsageEnd = os.loadavg();
  serverStats.freeMem.end = os.freemem();
  
  // Calculate metrics
  const avgResponseTime = successfulRequests > 0 ? responseTimeTotal / successfulRequests : 0;
  const avgDbOperationTime = totalDbOperations > 0 ? dbOperationTimeTotal / totalDbOperations : 0;
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
  const requestsPerSecond = totalRequests / config.testDurationSec;
  
  // Calculate memory usage delta
  const memoryUsageDeltaMB = (serverStats.finalMemory.heapUsed - serverStats.initialMemory.heapUsed) / (1024 * 1024);
  
  // Calculate requests per second over time (for identifying degradation)
  const timeSegments = Math.floor(config.testDurationSec / 5); // 5-second segments
  let requestsOverTime = Array(timeSegments).fill(0);
  
  requestTimestamps.forEach(stamp => {
    const segmentIndex = Math.floor((stamp.time - requestTimestamps[0].time) / (5000));
    if (segmentIndex >= 0 && segmentIndex < timeSegments) {
      requestsOverTime[segmentIndex]++;
    }
  });
  
  // Calculate response time percentiles
  const sortedResponseTimes = requestTimestamps
    .filter(stamp => stamp.responseTime !== undefined)
    .map(stamp => stamp.responseTime!)
    .sort((a, b) => a - b);
  
  const p50Index = Math.floor(sortedResponseTimes.length * 0.5);
  const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
  const p99Index = Math.floor(sortedResponseTimes.length * 0.99);
  
  const p50 = sortedResponseTimes[p50Index] || 0;
  const p95 = sortedResponseTimes[p95Index] || 0;
  const p99 = sortedResponseTimes[p99Index] || 0;
  
  // Display results
  console.log('\n====================================');
  console.log('STRESS TEST RESULTS');
  console.log('====================================');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful Requests: ${successfulRequests}`);
  console.log(`Failed Requests: ${failedRequests}`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Requests Per Second: ${requestsPerSecond.toFixed(2)}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Min Response Time: ${minResponseTime}ms`);
  console.log(`Max Response Time: ${maxResponseTime}ms`);
  console.log(`Median Response Time (P50): ${p50.toFixed(2)}ms`);
  console.log(`95th Percentile Response Time (P95): ${p95.toFixed(2)}ms`);
  console.log(`99th Percentile Response Time (P99): ${p99.toFixed(2)}ms`);
  console.log(`Average DB Operation Time: ${avgDbOperationTime.toFixed(2)}ms`);
  
  console.log('\nPerformance Over Time (Requests per 5-second interval):');
  requestsOverTime.forEach((count, i) => {
    console.log(`  ${i*5}-${(i+1)*5}s: ${count} requests (${(count/5).toFixed(2)}/sec)`);
  });
  
  console.log('\nSystem Resource Usage:');
  console.log(`Memory Usage Change: ${memoryUsageDeltaMB.toFixed(2)} MB`);
  console.log(`Initial Free Memory: ${(serverStats.freeMem.start / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`Final Free Memory: ${(serverStats.freeMem.end / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`CPU Load Average (start): ${serverStats.cpuUsageStart}`);
  console.log(`CPU Load Average (end): ${serverStats.cpuUsageEnd}`);
  
  if (Object.keys(errorsByType).length > 0) {
    console.log('\nErrors by Type:');
    for (const [type, count] of Object.entries(errorsByType)) {
      console.log(`  ${type}: ${count}`);
    }
  }
  
  console.log('====================================');
  
  // Performance interpretation
  console.log('\nPERFORMANCE ANALYSIS:');
  
  if (failedRequests > totalRequests * 0.1) {
    console.log('⚠️ HIGH ERROR RATE: Your system is struggling under this load.');
  }
  
  if (maxResponseTime > 5000) {
    console.log('⚠️ HIGH MAXIMUM RESPONSE TIME: Some requests are taking too long.');
  }
  
  // Check for degradation over time
  const firstHalfAvg = requestsOverTime.slice(0, Math.floor(timeSegments/2)).reduce((a, b) => a + b, 0) / Math.floor(timeSegments/2);
  const secondHalfAvg = requestsOverTime.slice(Math.floor(timeSegments/2)).reduce((a, b) => a + b, 0) / (timeSegments - Math.floor(timeSegments/2));
  
  if (secondHalfAvg < firstHalfAvg * 0.8) {
    console.log('⚠️ PERFORMANCE DEGRADATION: Throughput decreased over time by more than 20%.');
    console.log(`  First half avg: ${firstHalfAvg.toFixed(2)} req/5sec, Second half avg: ${secondHalfAvg.toFixed(2)} req/5sec`);
  }
  
  console.log('\nRECOMMENDATION:');
  if (successRate > 95 && avgResponseTime < 1000 && maxResponseTime < 3000) {
    console.log('✅ Your system handled this load well. Consider increasing the load to find your limit.');
  } else if (successRate > 85 && avgResponseTime < 2000) {
    console.log('⚠️ Your system is near capacity with this load. This is likely your practical limit with current resources.');
  } else {
    console.log('❌ Your system is overloaded under these conditions. Reduce concurrent users or upgrade your resources.');
  }
}

// Main test function
async function runTest(): Promise<void> {
  console.log(`Starting stress test with ${config.concurrentUsers} concurrent users...`);
  console.log(`Test will run for ${config.testDurationSec} seconds.`);
  
  const userPromises: Promise<void>[] = [];
  
  // Ramp up user load gradually
  for (let i = 0; i < config.concurrentUsers; i++) {
    userPromises.push(simulateUser(i + 1));
    
    // Delay between starting users during ramp-up
    if (i < config.concurrentUsers - 1) {
      await sleep((config.rampUpSec * 1000) / config.concurrentUsers);
    }
  }
  
  // Wait for all simulated users to complete
  await Promise.all(userPromises);
  
  // Display test results
  displayResults();
}

// Run the test
runTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});