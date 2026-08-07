import express from 'express';
import { getGlobalLeaderboard, getMyRank, getTeamLeaderboard } from '../services/leaderboardService.js';

const router = express.Router();

router.get('/leaderboard', async (req, res) => {
  try {
    const { period, date, week, month, page = '1', scope = 'global', managerId } = req.query;
    let periodKey;

    if (period === 'daily') {
      if (!date) throw new Error('date query param is required for daily');
      periodKey = `lb:global:daily:${date}`;
    } else if (period === 'weekly') {
      if (!week) throw new Error('week query param is required for weekly');
      periodKey = `lb:global:weekly:${week}`;
    } else if (period === 'monthly') {
      if (!month) throw new Error('month query param is required for monthly');
      periodKey = `lb:global:monthly:${month}`;
    } else {
      throw new Error('Invalid period');
    }

    const pageNum = Number(page);
    if (scope === 'global') {
      const leaderboard = await getGlobalLeaderboard(period, periodKey, pageNum);
      return res.json({ period, periodKey, page: pageNum, leaderboard });
    }

    if (scope === 'team') {
      if (!managerId) throw new Error('managerId query param is required for team scope');
      const leaderboard = await getTeamLeaderboard(managerId, period, periodKey, pageNum);
      return res.json({ period, periodKey, page: pageNum, managerId, leaderboard });
    }

    throw new Error('Invalid scope');
  } catch (err) {
    console.error('Error fetching leaderboard', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/leaderboard/me', async (req, res) => {
  try {
    const { userId, period, date, week, month } = req.query;
    if (!userId) throw new Error('userId is required');

    let periodKey;
    if (period === 'daily') {
      if (!date) throw new Error('date query param is required for daily');
      periodKey = `lb:global:daily:${date}`;
    } else if (period === 'weekly') {
      if (!week) throw new Error('week query param is required for weekly');
      periodKey = `lb:global:weekly:${week}`;
    } else if (period === 'monthly') {
      if (!month) throw new Error('month query param is required for monthly');
      periodKey = `lb:global:monthly:${month}`;
    } else {
      throw new Error('Invalid period');
    }

    const result = await getMyRank(userId, period, periodKey);
    res.json({ period, periodKey, userId, result });
  } catch (err) {
    console.error('Error fetching my rank', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
