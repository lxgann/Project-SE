const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDb } = require('./config/db');

// Load environment variable
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { status: 'error', error: { code: 'RATE_001', message: 'Too many attempts. Please try again later.' } }
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});

// Express Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Serve Static Files (Uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quizzes');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Welcome to GameGuessr API Server!', version: '1.0.0-MVP' });
});

// Socket.io for Real-Time Quiz Coordination
const activeTimers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join quiz session room
  socket.on('join_session', ({ quizId, username }) => {
    const room = `quiz_${quizId}`;
    socket.join(room);
    console.log(`${username} joined room ${room}`);
    socket.to(room).emit('user_joined', { username, socketId: socket.id });
  });

  // Start timer for a question
  socket.on('start_timer', ({ quizId, timeLimit, questionIndex }) => {
    const timerKey = `${socket.id}_${questionIndex}`;
    let remaining = timeLimit;

    const timer = setInterval(() => {
      remaining--;
      socket.emit('timer:sync', { remainingSeconds: remaining, questionIndex });

      if (remaining <= 0) {
        clearInterval(timer);
        activeTimers.delete(timerKey);
        socket.emit('timer:expired', { questionIndex });
      }
    }, 1000);

    activeTimers.set(timerKey, timer);
  });

  // Submit answer
  socket.on('answer:submit', ({ quizId, username, questionIndex, answerId }) => {
    socket.emit('answer:received', { questionIndex, answerId });
  });

  // Leave session
  socket.on('leave_session', ({ quizId, username }) => {
    socket.leave(`quiz_${quizId}`);
    // Clear all timers for this socket
    for (const [key, timer] of activeTimers) {
      if (key.startsWith(socket.id)) {
        clearInterval(timer);
        activeTimers.delete(key);
      }
    }
  });

  socket.on('disconnect', () => {
    // Clean up timers
    for (const [key, timer] of activeTimers) {
      if (key.startsWith(socket.id)) {
        clearInterval(timer);
        activeTimers.delete(key);
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ status: 'error', error: { code: 'FILE_001', message: 'File too large. Maximum size is 10MB.' } });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', error: { code: 'SRV_001', message: 'Internal server error' } });
});

// Initialize DB and Boot Server
initDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`GameGuessr API Server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
