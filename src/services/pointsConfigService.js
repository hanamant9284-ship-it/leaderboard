import { getActivePointsConfig } from '../models/pointsConfig.js';
import { CONFIG_CACHE_TTL_SECONDS } from '../config.js';

let cache = new Map();
let cacheUpdatedAt = 0;

function buildCache(rows) {
  const nextCache = new Map();
  for (const row of rows) {
    const key = `${row.actionType}:${row.role}`;
    nextCache.set(key, row.points);
  }
  cache = nextCache;
  cacheUpdatedAt = Date.now();
}

async function ensureCache() {
  const ageSeconds = (Date.now() - cacheUpdatedAt) / 1000;
  if (cache.size === 0 || ageSeconds >= CONFIG_CACHE_TTL_SECONDS) {
    console.log('Refreshing points config cache...');
    const rows = await getActivePointsConfig();
    buildCache(rows);
    console.log(`Loaded ${rows.length} points config rows into cache`);
  }
}

export async function lookupPoints(actionType, role) {
  await ensureCache();

  const exactKey = `${actionType}:${role}`;
  if (cache.has(exactKey)) {
    return cache.get(exactKey);
  }

  const fallbackKey = `${actionType}:ALL`;
  if (cache.has(fallbackKey)) {
    return cache.get(fallbackKey);
  }

  throw new Error(`No points config found for actionType=${actionType}`);
}

export function clearCache() {
  console.log('Clearing points config cache');
  cache = new Map();
  cacheUpdatedAt = 0;
}
