import { MongoClient } from 'mongodb';
import { MONGO_URI } from './config.js';

let client;
let db;

export async function getMongoClient() {
  if (!client) {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
  }
  return client;
}

export async function getDb() {
  if (!db) {
    const mongoClient = await getMongoClient();
    db = mongoClient.db();
  }
  return db;
}

export async function closeMongoClient() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}
