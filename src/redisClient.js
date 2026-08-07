import { createClient } from 'redis';
import { REDIS_URL } from './config.js';

let client;

export async function getRedisClient() {
  if (!client) {
    console.log('Connecting to Redis...');
    client = createClient({ url: REDIS_URL });
    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();
    console.log('Connected to Redis');
  }
  return client;
}

export async function closeRedisClient() {
  if (client) {
    await client.quit();
    client = null;
    console.log('Redis connection closed');
  }
}
