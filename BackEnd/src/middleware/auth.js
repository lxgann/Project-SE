const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'gameguessr_secret_key_256bit_secure_2026';

// Verify JWT token - any authenticated user
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', error: { code: 'AUTH_001', message: 'No token, authorization denied' } });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ status: 'error', error: { code: 'AUTH_002', message: 'Token is not valid or has expired' } });
    }
    req.user = decoded;
    next();
  });
};

// Require uploader or admin role
const requireUploader = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'uploader' && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', error: { code: 'AUTH_003', message: 'Access denied. Uploader or Admin role required.' } });
    }
    next();
  });
};

// Require admin role
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', error: { code: 'AUTH_004', message: 'Access denied. Admin role required.' } });
    }
    next();
  });
};

module.exports = { requireAuth, requireUploader, requireAdmin };
