import { getRedisClient } from '../redisClient.js';
import { findSnapshot } from '../models/leaderboardSnapshots.js';
import { lookupSubtreeIds } from '../models/users.js';

const VALID_PERIODS = new Set(['daily', 'weekly', 'monthly']);

function resolvePeriodKey(period, periodKey) {
  if (!VALID_PERIODS.has(period)) {
    throw new Error(`Unsupported period ${period}`);
  }
  return periodKey;
}

function redisLeaderboardKey(periodKey) {
  return periodKey;
}

function parseZRangeWithScores(results) {
  const entries = [];
  for (let i = 0; i < results.length; i += 2) {
    entries.push({ value: results[i], score: results[i + 1] });
  }
  return entries;
}

export async function getGlobalLeaderboard(period, periodKey, page = 1, pageSize = 20) {
  const redis = await getRedisClient();
  const key = redisLeaderboardKey(resolvePeriodKey(period, periodKey));
  const start = (page - 1) * pageSize;
  const stop = start + pageSize - 1;

  const exists = await redis.exists(key);
  if (exists) {
    const entries = await redis.zRangeWithScores(key, start, stop, { REV: true });
    return entries.map((entry, idx) => ({ rank: start + idx + 1, userId: entry.value, points: Number(entry.score) }));
  }

  const snapshot = await findSnapshot(period, periodKey);
  if (!snapshot) {
    return [];
  }

  return snapshot.ranked.slice(start, stop).map((entry) => ({ rank: entry.rank, userId: entry.userId, points: entry.points }));
}

export async function getMyRank(userId, period, periodKey) {
  const redis = await getRedisClient();
  const key = redisLeaderboardKey(resolvePeriodKey(period, periodKey));
  const exists = await redis.exists(key);
  if (exists) {
    const rank = await redis.zRevRank(key, userId);
    if (rank === null) {
      return null;
    }
    const score = await redis.zScore(key, userId);
    return { rank: rank + 1, points: score !== null ? Number(score) : 0 };
  }

  const snapshot = await findSnapshot(period, periodKey);
  if (!snapshot) {
    return null;
  }
  const entry = snapshot.ranked.find((row) => row.userId === userId);
  return entry ? { rank: entry.rank, points: entry.points } : null;
}

export async function getTeamLeaderboard(managerId, period, periodKey, page = 1, pageSize = 20) {
  const redis = await getRedisClient();
  const ids = await lookupSubtreeIds(managerId);
  if (ids.length === 0) {
    return [];
  }

  const tempSetKey = `tmp:subtree:${managerId}`;
  const tempDestKey = `tmp:subtree:${managerId}:${periodKey}`;

  const members = ids.map(String);
  await redis.del(tempSetKey, tempDestKey);
  await redis.zAdd(tempSetKey, members.map((value) => ({ score: 0, value })));
  await redis.expire(tempSetKey, 30);

  await redis.zInterStore(tempDestKey, [tempSetKey, periodKey], {
    WEIGHTS: [0, 1],
    AGGREGATE: 'MAX'
  });
  await redis.expire(tempDestKey, 30);

  const start = (page - 1) * pageSize;
  const stop = start + pageSize - 1;
  const entries = await redis.zRangeWithScores(tempDestKey, start, stop, { REV: true });

  await redis.del(tempSetKey, tempDestKey);

  return entries.map((entry, idx) => ({ rank: start + idx + 1, userId: entry.value, points: Number(entry.score) }));
}
