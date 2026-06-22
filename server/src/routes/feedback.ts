import express from 'express';
import { db as pool } from '../db/database.js';

const router = express.Router();

// GET top 10 APPROVED feedbacks for landing page
router.get('/top', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_name, rating, comment, created_at
       FROM feedbacks
       WHERE status = 'approved'
       ORDER BY rating DESC, created_at DESC
       LIMIT 10`
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all feedbacks for admin review (optionally filtered by status)
router.get('/admin', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? `WHERE status = $1` : '';
    const params = status ? [status] : [];
    const result = await pool.query(
      `SELECT id, user_id, user_name, rating, comment, status, created_at
       FROM feedbacks
       ${where}
       ORDER BY
         CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         created_at DESC`,
      params
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching admin feedbacks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH approve or reject a feedback (admin only)
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be approved, rejected or pending' });
  }

  try {
    const updated = await pool.oneOrNone(
      `UPDATE feedbacks SET status = $1 WHERE id = $2
       RETURNING id, user_name, rating, comment, status, created_at`,
      [status, id]
    );
    if (!updated) return res.status(404).json({ error: 'Feedback not found' });
    res.json({ success: true, feedback: updated });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new feedback — saved as 'pending' by default (DB default)
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
      message: 'Feedback submitted and pending admin review',
      feedback: result[0]
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
