import express from 'express';
import { getMongoClient } from './db.js';
import { getRedisClient } from './redisClient.js';
import { createIndexes } from './models/users.js';
import { ensureIndexes as ensureActionEventIndexes } from './models/actionEvents.js';
import { ensureIndexes as ensureSnapshotIndexes } from './models/leaderboardSnapshots.js';
import eventsApi from './routes/eventsApi.js';
import leaderboardApi from './routes/leaderboardApi.js';
import adminApi from './routes/adminApi.js';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(eventsApi);
app.use(leaderboardApi);
app.use(adminApi);

app.get('/', (req, res) => res.json({ status: 'leaderboard-local ok' }));

const PORT = process.env.PORT || 3000;

async function start() {
  await getMongoClient();
  await getRedisClient();
  await createIndexes();
  await ensureActionEventIndexes();
  await ensureSnapshotIndexes();

  app.listen(PORT, () => {
    console.log(`Leaderboard-local listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
