import express from 'express';
import jwt from 'jsonwebtoken';
import { createUser, findUserByCredentials, findUserById } from '../models/users.js';
import { JWT_SECRET } from '../config.js';

const router = express.Router();

router.post('/auth/signup', async (req, res) => {
  try {
    const { userId, name, role, managerId, password } = req.body;
    if (!userId || !name || !role || !password) {
      throw new Error('userId, name, role, and password are required');
    }

    const existingUser = await findUserById(userId);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    await createUser({ userId, name, role, managerId, password });
    res.status(201).json({ status: 'OK', userId });
  } catch (err) {
    console.error('Error signing up user', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      throw new Error('userId and password are required');
    }

    const user = await findUserByCredentials(userId, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        managerId: user.managerId || null
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ accessToken: token, user: userWithoutPassword });
  } catch (err) {
    console.error('Error logging in user', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
