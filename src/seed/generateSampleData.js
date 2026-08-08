import { getDb, getMongoClient } from '../db.js';
import { createIndexes as createUserIndexes } from '../models/users.js';
import { upsertPointsConfig } from '../models/pointsConfig.js';
import { processEvent } from '../services/eventIngestService.js';
import { clearCache } from '../services/pointsConfigService.js';
import { hashPassword } from '../models/auth.js';

const users = [
  { _id: 'managerA', name: 'Top Manager', role: 'MANAGER', managerId: null, password: 'managerA123' },
  { _id: 'managerB', name: 'Mid Manager B', role: 'MANAGER', managerId: 'managerA', password: 'managerB123' },
  { _id: 'managerC', name: 'Mid Manager C', role: 'MANAGER', managerId: 'managerA', password: 'managerC123' },
  { _id: 'agent1', name: 'Agent One', role: 'AGENT', managerId: 'managerB', password: 'agent1123' },
  { _id: 'agent2', name: 'Agent Two', role: 'AGENT', managerId: 'managerB', password: 'agent2123' },
  { _id: 'agent3', name: 'Agent Three', role: 'AGENT', managerId: 'managerC', password: 'agent3123' },
  { _id: 'agent4', name: 'Agent Four', role: 'AGENT', managerId: 'managerC', password: 'agent4123' },
  { _id: 'agent5', name: 'Agent Five', role: 'AGENT', managerId: 'managerB', password: 'agent5123' }
];

const pointsConfig = [
  { actionType: 'LEAD_CREATED', role: 'AGENT', points: 10 },
  { actionType: 'LEAD_CONVERTED', role: 'AGENT', points: 50 },
  { actionType: 'MEETING_COMPLETED', role: 'ALL', points: 20 }
];

const ACTION_TYPES = ['LEAD_CREATED', 'LEAD_CONVERTED', 'MEETING_COMPLETED'];

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomPastTimestamp(daysAgo) {
  const now = new Date();
  const target = new Date(now);
  target.setDate(now.getDate() - daysAgo);
  target.setHours(0, 0, 0, 0);
  const offset = randomInt(24 * 60 * 60 * 1000);
  return new Date(target.getTime() + offset).toISOString();
}

function randomEventUser() {
  return users[3 + randomInt(users.length - 3)];
}

async function main() {
  console.log('Starting sample data generation...');
  await getMongoClient();
  await createUserIndexes();

  console.log('Seeding users...');
  const db = await getDb();
  await Promise.all(users.map((user) => {
    const { password, ...userData } = user;
    return db.collection('users').updateOne(
      { _id: user._id },
      { $set: userData },
      { upsert: true }
    );
  }));

  console.log('Seeding points config...');
  await Promise.all(pointsConfig.map((row) => upsertPointsConfig(row.actionType, row.role, row.points)));
  clearCache();
  
  console.log('Seeding initial passwords...');
  await Promise.all(users.map(async (user) => {
    const { password, _id } = user;
    if (!password) return;
    const passwordHash = await hashPassword(password);
    await db.collection('users').updateOne(
      { _id },
      { $set: { passwordHash } }
    );
  }));

  const eventCount = 120;
  let applied = 0;

  console.log(`Seeding ${eventCount} random events over the last 14 days...`);

  for (let i = 0; i < eventCount; i += 1) {
    const user = randomEventUser();
    const actionType = ACTION_TYPES[randomInt(ACTION_TYPES.length)];
    const eventId = `seed-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
    const daysAgo = randomInt(14);
    const occurredAt = randomPastTimestamp(daysAgo);

    const result = await processEvent({ eventId, userId: user._id, actionType, occurredAt });
    if (result.status === 'APPLIED') {
      applied += 1;
    }
  }

  console.log(`Sample data loaded. Events applied: ${applied}/${eventCount}`);
  console.log('Ready for frontend testing. Use managerB or managerC for team leaderboards.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
