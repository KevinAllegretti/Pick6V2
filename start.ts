// start.ts
import './api/index.ts';
import './src/microservices/scheduler.ts';
import './src/microservices/serverUtils.ts';
import * as v8 from 'v8';
console.log('Heap Stats:', v8.getHeapStatistics());