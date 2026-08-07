import { getRedisClient } from '../redisClient.js';
import { processEvent } from '../services/eventIngestService.js';
import { getDb } from '../db.js';

async function main() {
  await getDb();
  const redis = await getRedisClient();

  const event = await getDb().then((db) => db.collection('action_events').findOne({}));
  if (!event) {
    throw new Error('No seeded event found to test');
  }

  const periodKey = `lb:global:daily:${event.occurredAt.toISOString().slice(0, 10)}`;
  const beforeScore = await redis.zScore(periodKey, event.userId);
  console.log('Before idempotent replay', { eventId: event.eventId, userId: event.userId, beforeScore: beforeScore ? Number(beforeScore) : null });

  const result = await processEvent({
    eventId: event.eventId,
    userId: event.userId,
    actionType: event.actionType,
    occurredAt: event.occurredAt
  });

  const afterScore = await redis.zScore(periodKey, event.userId);
  console.log('Replay result', result);
  console.log('After idempotent replay', { afterScore: afterScore ? Number(afterScore) : null });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
