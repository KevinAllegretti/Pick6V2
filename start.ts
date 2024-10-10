// start.ts
import './api/index.ts';
import './src/microservices/scheduler.ts';
import './src/microservices/serverUtils.ts';

setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.log(JSON.stringify({
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100} MB`
    }));
  }, 30000); // Log every 30 seconds