import { getDb } from '../db.js';
import { hashPassword, comparePassword } from './auth.js';

const COLLECTION = 'users';

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection(COLLECTION);
}

export async function findUserById(userId) {
  const users = await getUsersCollection();
  return users.findOne({ _id: userId });
}

export async function findUserByCredentials(userId, password) {
  const users = await getUsersCollection();
  const user = await users.findOne({ _id: userId });
  if (!user || !user.passwordHash) {
    return null;
  }

  const matched = await comparePassword(password, user.passwordHash);
  return matched ? user : null;
}

export async function createUser({ userId, name, role, managerId, password }) {
  const users = await getUsersCollection();
  const passwordHash = await hashPassword(password);
  return users.insertOne({
    _id: userId,
    name,
    role,
    managerId: managerId || null,
    passwordHash,
    createdAt: new Date()
  });
}

export async function insertUsers(usersArray) {
  const users = await getUsersCollection();
  return users.insertMany(usersArray);
}

export async function updateUserManager(userId, managerId) {
  const users = await getUsersCollection();
  return users.updateOne({ _id: userId }, { $set: { managerId } });
}

export async function createIndexes() {
  const users = await getUsersCollection();
  await users.createIndex({ managerId: 1 });
}

export async function lookupSubtreeIds(managerId) {
  const users = await getUsersCollection();
  const result = await users.aggregate([
    {
      $match: { _id: managerId }
    },
    {
      $graphLookup: {
        from: COLLECTION,
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'managerId',
        as: 'descendants'
      }
    },
    {
      $project: {
        ids: {
          $concatArrays: [['$_id'], '$descendants._id']
        }
      }
    }
  ]).toArray();

  return result.length > 0 ? result[0].ids : [];
}
