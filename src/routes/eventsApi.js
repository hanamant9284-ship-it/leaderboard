import express from 'express';
import { processEvent } from '../services/eventIngestService.js';

const router = express.Router();

router.post('/events', async (req, res) => {
  try {
    const result = await processEvent(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error processing event', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
