import { getDb } from '../db.js';

const COLLECTION = 'action_events';

export async function getActionEventsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION);
}

export async function ensureIndexes() {
  const coll = await getActionEventsCollection();
  await coll.createIndex({ eventId: 1 }, { unique: true });
}

export async function insertEvent(event) {
  const coll = await getActionEventsCollection();
  return coll.insertOne(event);
}
