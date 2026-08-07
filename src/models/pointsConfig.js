import { getDb } from '../db.js';

const COLLECTION = 'points_config';

export async function getPointsConfigCollection() {
  const db = await getDb();
  return db.collection(COLLECTION);
}

export async function insertPointsConfig(rows) {
  const coll = await getPointsConfigCollection();
  return coll.insertMany(rows);
}

export async function getActivePointsConfig() {
  const coll = await getPointsConfigCollection();
  return coll.find({ active: { $ne: false }}).toArray();
}

export async function upsertPointsConfig(actionType, role, points) {
  const coll = await getPointsConfigCollection();
  return coll.updateOne(
    { actionType, role },
    { $set: { actionType, role, points, active: true, updatedAt: new Date() } },
    { upsert: true }
  );
}
