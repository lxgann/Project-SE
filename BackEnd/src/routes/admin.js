const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/admin/users - List all users
router.get('/users', requireAdmin, async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT id, username, email, display_name, role, avatar_url, is_active, created_at FROM users WHERE 1=1`;
    const params = [];

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }
    if (search) {
      query += ` AND (username LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.query(query, params);

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM users`);

    res.json({ status: 'success', data: { users, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ status: 'error', error: { code: 'ADMIN_001', message: 'Database error' } });
  }
});

// PATCH /api/admin/users/:userId - Update user role
router.patch('/users/:userId', requireAdmin, async (req, res) => {
  const { role } = req.body;
  const validRoles = ['participant', 'uploader'];

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ status: 'error', error: { code: 'ADMIN_002', message: 'Invalid role. Must be participant or uploader.' } });
  }

  try {
    await pool.query(`UPDATE users SET role = ? WHERE id = ? AND role != 'admin'`, [role, req.params.userId]);

    // Audit log
    await pool.query(
      `INSERT INTO audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, 'ROLE_CHANGE', 'user', req.params.userId, `Changed role to ${role}`]
    );

    res.json({ status: 'success', message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Admin role update error:', err);
    res.status(500).json({ status: 'error', error: { code: 'ADMIN_003', message: 'Database error' } });
  }
});

// DELETE /api/admin/users/:userId - Soft-delete user
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    // Don't allow deleting admin accounts
    const [user] = await pool.query(`SELECT role FROM users WHERE id = ?`, [req.params.userId]);
    if (user[0]?.role === 'admin') {
      return res.status(400).json({ status: 'error', error: { code: 'ADMIN_004', message: 'Cannot delete admin accounts' } });
    }

    await pool.query(`UPDATE users SET is_active = 0 WHERE id = ?`, [req.params.userId]);

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)`,
      [req.user.id, 'USER_DEACTIVATE', 'user', req.params.userId]
    );

    res.json({ status: 'success', message: 'User deactivated successfully' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ status: 'error', error: { code: 'ADMIN_005', message: 'Database error' } });
  }
});

// GET /api/admin/quizzes - List all quizzes
router.get('/quizzes', requireAdmin, async (req, res) => {
  const { status, search } = req.query;

  try {
    let query = `SELECT q.*, u.username as creator_name,
      (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
      (SELECT COUNT(*) FROM scores WHERE quiz_id = q.id) as attempt_count
      FROM quizzes q LEFT JOIN users u ON q.created_by = u.id WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND q.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND q.title LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY q.created_at DESC`;

    const [quizzes] = await pool.query(query, params);
    res.json({ status: 'success', data: quizzes });
  } catch (err) {
    console.error('Admin quizzes error:', err);
    res.status(500).json({ status: 'error', error: { code: 'ADMIN_010', message: 'Database error' } });
  }
});

// PATCH /api/admin/quizzes/:quizId - Hide/unhide quiz
router.patch('/quizzes/:quizId', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['published', 'hidden'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ status: 'error', error: { code: 'ADMIN_011', message: 'Invalid status. Must be published or hidden.' } });
  }

  try {
    await pool.query(`UPDATE quizzes SET status = ? WHERE id = ?`, [status, req.params.quizId]);

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, 'QUIZ_STATUS_CHANGE', 'quiz', req.params.quizId, `Changed status to ${status}`]
    );

    res.json({ status: 'success', message: `Quiz ${status === 'hidden' ? 'hidden' : 'published'} successfully` });
  } catch (err) {
    res.status(500).json({ status: 'error', error: { code: 'ADMIN_012', message: 'Database error' } });
  }
});

// DELETE /api/admin/quizzes/:quizId - Delete quiz and scores
router.delete('/quizzes/:quizId', requireAdmin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM scores WHERE quiz_id = ?`, [req.params.quizId]);
    await pool.query(`DELETE FROM questions WHERE quiz_id = ?`, [req.params.quizId]);
    await pool.query(`DELETE FROM quizzes WHERE id = ?`, [req.params.quizId]);

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?)`,
      [req.user.id, 'QUIZ_DELETE', 'quiz', req.params.quizId]
    );

    res.json({ status: 'success', message: 'Quiz deleted permanently' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: { code: 'ADMIN_013', message: 'Database error' } });
  }
});

// GET /api/admin/stats - System statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers] = await pool.query(`SELECT COUNT(*) as count FROM users WHERE is_active = 1`);
    const [totalQuizzes] = await pool.query(`SELECT COUNT(*) as count FROM quizzes`);
    const [totalAttempts] = await pool.query(`SELECT COUNT(*) as count FROM scores`);
    const [avgScore] = await pool.query(`SELECT ROUND(AVG(score)) as avg FROM scores`);
    const [newUsersPerDay] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_active = 1
       GROUP BY DATE(created_at) ORDER BY date DESC`
    );
    const [roleDistribution] = await pool.query(
      `SELECT role, COUNT(*) as count FROM users WHERE is_active = 1 GROUP BY role`
    );

    res.json({
      status: 'success',
      data: {
        totalUsers: totalUsers[0].count,
        totalQuizzes: totalQuizzes[0].count,
        totalAttempts: totalAttempts[0].count,
        avgScore: avgScore[0].avg || 0,
        newUsersPerDay,
        roleDistribution
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ status: 'error', error: { code: 'ADMIN_020', message: 'Database error' } });
  }
});

module.exports = router;
