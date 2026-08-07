import { getRedisClient } from '../redisClient.js';
import { insertLeaderboardSnapshot } from '../models/leaderboardSnapshots.js';

export async function closePeriod(period, periodKey, redisKey) {
  console.log('Closing period', { period, periodKey, redisKey });
  const redis = await getRedisClient();
  const entries = await redis.zRevRangeWithScores(redisKey, 0, -1);
  const ranked = entries.map((entry, index) => ({ rank: index + 1, userId: entry.value, points: Number(entry.score) }));

  const snapshot = {
    period,
    periodKey,
    redisKey,
    ranked,
    createdAt: new Date()
  };

  await insertLeaderboardSnapshot(snapshot);
  await redis.del(redisKey);

  console.log(`Closed period snapshot stored (${ranked.length} entries)`);
  return snapshot;
}
