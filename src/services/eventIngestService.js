import { insertEvent } from '../models/actionEvents.js';
import { findUserById } from '../models/users.js';
import { lookupPoints } from './pointsConfigService.js';
import { upsertUserScoreTotals } from '../models/userScoreTotals.js';
import { getRedisClient } from '../redisClient.js';
import { getDailyKey, getWeeklyKey, getMonthlyKey } from '../periodKeys.js';

const DAILY_TTL = 60 * 60 * 24 * 2;
const WEEKLY_TTL = 60 * 60 * 24 * 14;
const MONTHLY_TTL = 60 * 60 * 24 * 60;

export async function processEvent({ eventId, userId, actionType, occurredAt }) {
  console.log('Processing event', { eventId, userId, actionType, occurredAt });

  const user = await findUserById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const points = await lookupPoints(actionType, user.role);

  const eventDoc = { eventId, userId, actionType, occurredAt: new Date(occurredAt), createdAt: new Date() };
  try {
    await insertEvent(eventDoc);
  } catch (err) {
    if (err.code === 11000 || err.codeName === 'DuplicateKey' || err.message?.includes('E11000')) {
      console.log('Duplicate event detected', eventId);
      return { status: 'ALREADY_PROCESSED' };
    }
    throw err;
  }

  const redis = await getRedisClient();
  const date = new Date(occurredAt);
  const dailyKey = getDailyKey(date);
  const weeklyKey = getWeeklyKey(date);
  const monthlyKey = getMonthlyKey(date);

  const pipeline = redis.multi();
  pipeline.zIncrBy(dailyKey, points, userId);
  pipeline.zIncrBy(weeklyKey, points, userId);
  pipeline.zIncrBy(monthlyKey, points, userId);
  pipeline.expire(dailyKey, DAILY_TTL, 'NX');
  pipeline.expire(weeklyKey, WEEKLY_TTL, 'NX');
  pipeline.expire(monthlyKey, MONTHLY_TTL, 'NX');
  await pipeline.exec();

  await upsertUserScoreTotals(userId, 'daily', dailyKey, points, actionType);
  await upsertUserScoreTotals(userId, 'weekly', weeklyKey, points, actionType);
  await upsertUserScoreTotals(userId, 'monthly', monthlyKey, points, actionType);

  console.log('Event applied', { eventId, points, dailyKey, weeklyKey, monthlyKey });
  return { status: 'APPLIED', points };
}
