import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const required = [
  'MONGO_URI',
  'REDIS_URL',
  'TIMEZONE',
  'CONFIG_CACHE_TTL_SECONDS',
  'JWT_SECRET'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var ${key}`);
  }
}

export const MONGO_URI = process.env.MONGO_URI;
export const REDIS_URL = process.env.REDIS_URL;
export const TIMEZONE = process.env.TIMEZONE;
export const CONFIG_CACHE_TTL_SECONDS = Number(process.env.CONFIG_CACHE_TTL_SECONDS);
export const JWT_SECRET = process.env.JWT_SECRET;

export default {
  MONGO_URI,
  REDIS_URL,
  TIMEZONE,
  CONFIG_CACHE_TTL_SECONDS
};
