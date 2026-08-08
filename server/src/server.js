import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`Server running on ${env.serverUrl} (port ${env.port})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
