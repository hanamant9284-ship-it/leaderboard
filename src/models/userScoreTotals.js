import { getDb } from '../db.js';

const COLLECTION = 'user_score_totals';

export async function getUserScoreTotalsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION);
}

export async function upsertUserScoreTotals(userId, period, periodKey, points, actionType) {
  const coll = await getUserScoreTotalsCollection();
  const update = {
    $inc: {
      points,
      [`breakdown.${actionType}`]: 1
    }
  };
  return coll.updateOne(
    { userId, period, periodKey },
    update,
    { upsert: true }
  );
}

export async function getTotalsByUser(userId, period, periodKey) {
  const coll = await getUserScoreTotalsCollection();
  return coll.findOne({ userId, period, periodKey });
}
