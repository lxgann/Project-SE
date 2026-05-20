const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'gameguessr_secret_key_256bit_secure_2026';

// Validate username: alphanumeric, 3-20 chars
const isValidUsername = (username) => /^[a-zA-Z0-9]{3,20}$/.test(username);

// Validate password: 8+ chars, at least 1 letter and 1 number
const isValidPassword = (password) => password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

// Validate email format (basic)
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ status: 'error', error: { code: 'REG_001', message: 'Please enter all fields (username, email, password)' } });
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({ status: 'error', error: { code: 'REG_002', message: 'Username must be alphanumeric, 3-20 characters' } });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ status: 'error', error: { code: 'REG_003', message: 'Please enter a valid email address' } });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ status: 'error', error: { code: 'REG_004', message: 'Password must be at least 8 characters with at least one letter and one number' } });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, 'participant', ?)`,
      [username, email, hashedPassword, username, avatarUrl]
    );

    const userId = result.insertId;
    const token = jwt.sign(
      { id: userId, username, email, role: 'participant', avatar_url: avatarUrl, display_name: username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      status: 'success',
      data: {
        token,
        user: { id: userId, username, email, role: 'participant', avatar_url: avatarUrl, display_name: username }
      },
      message: 'Registration successful!'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('username')) {
        return res.status(400).json({ status: 'error', error: { code: 'REG_005', message: 'Username already exists' } });
      }
      if (err.message.includes('email')) {
        return res.status(400).json({ status: 'error', error: { code: 'REG_006', message: 'Email already exists' } });
      }
    }
    console.error('Registration error:', err);
    res.status(500).json({ status: 'error', error: { code: 'REG_099', message: 'Server error during registration' } });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', error: { code: 'LOGIN_001', message: 'Please enter email and password' } });
  }

  try {
    const [rows] = await pool.query(`SELECT * FROM users WHERE email = ? AND is_active = 1`, [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ status: 'error', error: { code: 'LOGIN_002', message: 'The email or password you entered is incorrect.' } });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', error: { code: 'LOGIN_002', message: 'The email or password you entered is incorrect.' } });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url, display_name: user.display_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      status: 'success',
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url, display_name: user.display_name || user.username }
      },
      message: 'Login successful!'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', error: { code: 'LOGIN_099', message: 'Server error during login' } });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, email, display_name, role, avatar_url, created_at FROM users WHERE id = ? AND is_active = 1`,
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ status: 'error', error: { code: 'PROFILE_001', message: 'User not found' } });
    }
    res.json({ status: 'success', data: rows[0] });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ status: 'error', error: { code: 'PROFILE_099', message: 'Server error' } });
  }
});

// PATCH /api/auth/profile - Update display name and avatar
router.patch('/profile', requireAuth, async (req, res) => {
  const { display_name, avatar_url } = req.body;

  try {
    const updates = [];
    const values = [];

    if (display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(display_name);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ status: 'error', error: { code: 'PROFILE_002', message: 'No fields to update' } });
    }

    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query(
      `SELECT id, username, email, display_name, role, avatar_url, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );

    // Generate new token with updated info
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url, display_name: user.display_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ status: 'success', data: { user, token }, message: 'Profile updated successfully!' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ status: 'error', error: { code: 'PROFILE_099', message: 'Server error' } });
  }
});

module.exports = router;
