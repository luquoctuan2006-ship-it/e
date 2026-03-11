// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ 
      error: { message: 'Access token required', status: 401 } 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: { message: 'Invalid or expired token', status: 403 } 
      });
    }
    req.user = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: { message: 'Admin access required', status: 403 } 
    });
  }
  next();
};

const isOrganizer = (req, res, next) => {
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ 
      error: { message: 'Organizer access required', status: 403 } 
    });
  }
  next();
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = decoded;
    }
    next();
  });
};

module.exports = { verifyToken, isAdmin, isOrganizer, optionalAuth, JWT_SECRET };