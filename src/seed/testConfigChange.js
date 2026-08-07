import { getMongoClient } from '../db.js';
import { upsertPointsConfig } from '../models/pointsConfig.js';
import { clearCache } from '../services/pointsConfigService.js';
import { processEvent } from '../services/eventIngestService.js';

async function main() {
  await getMongoClient();

  console.log('Updating LEAD_CREATED points to 25');
  await upsertPointsConfig('LEAD_CREATED', 'AGENT', 25);
  clearCache();

  const userId = 'agent1';
  const eventId = `test-config-${Date.now()}`;
  const occurredAt = new Date().toISOString();
  const result = await processEvent({ eventId, userId, actionType: 'LEAD_CREATED', occurredAt });

  console.log('New LEAD_CREATED event result', result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
