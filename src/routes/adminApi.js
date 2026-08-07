import express from 'express';
import { upsertPointsConfig } from '../models/pointsConfig.js';
import { clearCache } from '../services/pointsConfigService.js';
import { closePeriod } from '../services/rolloverService.js';

const router = express.Router();

router.put('/admin/points-config', async (req, res) => {
  try {
    const { actionType, role, points } = req.body;
    if (!actionType || !role || typeof points !== 'number') {
      throw new Error('actionType, role, and numeric points are required');
    }
    await upsertPointsConfig(actionType, role, points);
    clearCache();
    res.json({ status: 'OK' });
  } catch (err) {
    console.error('Error updating points config', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/admin/rollover', async (req, res) => {
  try {
    const { period, periodKey } = req.body;
    if (!period || !periodKey) {
      throw new Error('period and periodKey are required');
    }

    const redisKey = periodKey;
    const snapshot = await closePeriod(period, periodKey, redisKey);
    res.json({ status: 'ROLLED_OVER', snapshot });
  } catch (err) {
    console.error('Error rolling over', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
