const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/quizzes - Browse all published quizzes
router.get('/', async (req, res) => {
  try {
    const [quizzes] = await pool.query(
      `SELECT q.*, u.username as creator_name, u.display_name as creator_display,
       (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.status = 'published'
       ORDER BY q.created_at DESC`
    );
    res.json({ status: 'success', data: quizzes });
  } catch (err) {
    console.error('Quiz list error:', err);
    res.status(500).json({ status: 'error', error: { code: 'QUIZ_001', message: 'Database error' } });
  }
});

// GET /api/quizzes/leaderboard/global - Global leaderboard
router.get('/leaderboard/global', async (req, res) => {
  try {
    const [leaderboard] = await pool.query(
      `SELECT SUM(s.score) as total_score, u.username, u.display_name, u.avatar_url,
       COUNT(s.id) as quizzes_taken, ROUND(AVG(s.score)) as avg_score
       FROM scores s
       JOIN users u ON s.user_id = u.id
       WHERE u.is_active = 1
       GROUP BY s.user_id
       ORDER BY total_score DESC
       LIMIT 50`
    );
    res.json({ status: 'success', data: leaderboard });
  } catch (err) {
    console.error('Global leaderboard error:', err);
    res.status(500).json({ status: 'error', error: { code: 'LEAD_001', message: 'Database error' } });
  }
});

// GET /api/quizzes/history/me - Current user's quiz history
router.get('/history/me', requireAuth, async (req, res) => {
  try {
    // Get quiz history
    const [history] = await pool.query(
      `SELECT s.score, s.time_taken, s.finished_at, q.title as quiz_title, q.id as quiz_id,
       (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as total_questions
       FROM scores s
       JOIN quizzes q ON s.quiz_id = q.id
       WHERE s.user_id = ?
       ORDER BY s.finished_at DESC`,
      [req.user.id]
    );

    // Calculate rank for each quiz attempt
    const historyWithRanks = [];
    for (const h of history) {
      const [rankResult] = await pool.query(
        `SELECT COUNT(*) + 1 as user_rank FROM scores WHERE quiz_id = ? AND score > ?`,
        [h.quiz_id, h.score]
      );
      historyWithRanks.push({ ...h, rank: rankResult[0].user_rank });
    }

    // Summary statistics
    const [stats] = await pool.query(
      `SELECT COUNT(*) as total_quizzes, ROUND(AVG(score)) as avg_score,
       MAX(score) as highest_score, SUM(score) as total_score
       FROM scores WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: {
        history: historyWithRanks,
        stats: stats[0]
      }
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ status: 'error', error: { code: 'HIST_001', message: 'Database error' } });
  }
});

// GET /api/quizzes/:id - Get specific quiz info
router.get('/:id', async (req, res) => {
  try {
    const [quizzes] = await pool.query(
      `SELECT q.*, u.username as creator_name,
       (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = ? AND q.status = 'published'`,
      [req.params.id]
    );
    if (!quizzes[0]) {
      return res.status(404).json({ status: 'error', error: { code: 'QUIZ_002', message: 'Quiz not found' } });
    }
    res.json({ status: 'success', data: quizzes[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', error: { code: 'QUIZ_003', message: 'Database error' } });
  }
});

// GET /api/quizzes/:id/questions - Get quiz questions
router.get('/:id/questions', async (req, res) => {
  try {
    const [questions] = await pool.query(
      `SELECT * FROM questions WHERE quiz_id = ? ORDER BY RAND()`,
      [req.params.id]
    );
    res.json({ status: 'success', data: questions });
  } catch (err) {
    res.status(500).json({ status: 'error', error: { code: 'QUIZ_004', message: 'Database error' } });
  }
});

// POST /api/quizzes/:id/submit - Submit quiz score (one attempt per user per quiz)
router.post('/:id/submit', requireAuth, async (req, res) => {
  const quizId = req.params.id;
  const userId = req.user.id;
  const { score, time_taken } = req.body;

  if (score === undefined) {
    return res.status(400).json({ status: 'error', error: { code: 'QUIZ_005', message: 'Score is required' } });
  }

  try {
    // Check if user already completed this quiz (BR-01)
    const [existing] = await pool.query(
      `SELECT id FROM scores WHERE user_id = ? AND quiz_id = ?`,
      [userId, quizId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', error: { code: 'QUIZ_006', message: 'You have already completed this quiz.' } });
    }

    // Check if user is the quiz creator (BR-02)
    const [quiz] = await pool.query(`SELECT created_by FROM quizzes WHERE id = ?`, [quizId]);
    if (quiz[0] && quiz[0].created_by === userId) {
      return res.status(400).json({ status: 'error', error: { code: 'QUIZ_007', message: 'You cannot participate in a quiz you created.' } });
    }

    const [result] = await pool.query(
      `INSERT INTO scores (user_id, quiz_id, score, time_taken) VALUES (?, ?, ?, ?)`,
      [userId, quizId, score, time_taken || 0]
    );

    // Get rank
    const [rankResult] = await pool.query(
      `SELECT COUNT(*) + 1 as user_rank FROM scores WHERE quiz_id = ? AND score > ?`,
      [quizId, score]
    );

    res.json({
      status: 'success',
      data: { scoreId: result.insertId, finalScore: score, rank: rankResult[0].user_rank },
      message: 'Score submitted successfully!'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', error: { code: 'QUIZ_006', message: 'You have already completed this quiz.' } });
    }
    console.error('Submit score error:', err);
    res.status(500).json({ status: 'error', error: { code: 'QUIZ_099', message: 'Database error' } });
  }
});

// GET /api/quizzes/:id/leaderboard - Per-quiz leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const [leaderboard] = await pool.query(
      `SELECT s.score, s.time_taken, s.finished_at, u.username, u.display_name, u.avatar_url, u.id as user_id
       FROM scores s
       JOIN users u ON s.user_id = u.id
       WHERE s.quiz_id = ?
       ORDER BY s.score DESC, s.time_taken ASC
       LIMIT 50`,
      [req.params.id]
    );
    res.json({ status: 'success', data: leaderboard });
  } catch (err) {
    res.status(500).json({ status: 'error', error: { code: 'LEAD_002', message: 'Database error' } });
  }
});

// GET /api/quizzes/:id/check - Check if user already completed this quiz
router.get('/:id/check', requireAuth, async (req, res) => {
  try {
    const [existing] = await pool.query(
      `SELECT id, score, time_taken FROM scores WHERE user_id = ? AND quiz_id = ?`,
      [req.user.id, req.params.id]
    );
    res.json({ status: 'success', data: { completed: existing.length > 0, score: existing[0] || null } });
  } catch (err) {
    res.status(500).json({ status: 'error', error: { code: 'QUIZ_010', message: 'Database error' } });
  }
});

module.exports = router;
