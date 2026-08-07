import { getDb } from '../db.js';

const COLLECTION = 'leaderboard_snapshots';

export async function getLeaderboardSnapshotsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION);
}

export async function insertLeaderboardSnapshot(snapshot) {
  const coll = await getLeaderboardSnapshotsCollection();
  return coll.insertOne(snapshot);
}

export async function findSnapshot(period, periodKey) {
  const coll = await getLeaderboardSnapshotsCollection();
  return coll.findOne({ period, periodKey });
}

export async function ensureIndexes() {
  const coll = await getLeaderboardSnapshotsCollection();
  await coll.createIndex({ period: 1, periodKey: 1 }, { unique: true });
}
