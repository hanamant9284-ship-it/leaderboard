import { getDb, getMongoClient } from '../db.js';
import { getRedisClient } from '../redisClient.js';
import { getTeamLeaderboard } from '../services/leaderboardService.js';
import { updateUserManager } from '../models/users.js';

async function main() {
  await getMongoClient();
  const redis = await getRedisClient();

  const managerBId = 'managerB';
  const managerCId = 'managerC';
  const agentId = 'agent1';
  const periodKey = `lb:global:daily:${new Date().toISOString().slice(0, 10)}`;

  console.log('Fetching before reassignment');
  const beforeB = await getTeamLeaderboard(managerBId, 'daily', periodKey);
  const beforeC = await getTeamLeaderboard(managerCId, 'daily', periodKey);
  console.log('Before manager B team', beforeB.map((entry) => entry.userId));
  console.log('Before manager C team', beforeC.map((entry) => entry.userId));

  await updateUserManager(agentId, managerCId);
  console.log(`Reassigned ${agentId} from ${managerBId} to ${managerCId}`);

  const afterB = await getTeamLeaderboard(managerBId, 'daily', periodKey);
  const afterC = await getTeamLeaderboard(managerCId, 'daily', periodKey);
  console.log('After manager B team', afterB.map((entry) => entry.userId));
  console.log('After manager C team', afterC.map((entry) => entry.userId));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
