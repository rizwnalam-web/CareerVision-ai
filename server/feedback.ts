import express from 'express';
import { db as pool } from './src/db/database.js';

const router = express.Router();

// GET top 10 feedbacks for landing page
router.get('/top', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_name, rating, comment, created_at FROM feedbacks ORDER BY rating DESC, created_at DESC LIMIT 10'
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new feedback
router.post('/', async (req, res) => {
  const { userId, userName, rating, comment } = req.body;

  if (!userName || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO feedbacks (user_id, user_name, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId || null, userName, rating, comment]
    );
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: result[0]
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;