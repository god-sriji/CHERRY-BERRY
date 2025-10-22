import { verifyToken } from '../utils/jwt.js';

export const validateInput = (fields) => (req, res, next) => {
  const missing = fields.filter(f => !req.body[f]);
  if (missing.length) return res.status(400).json({ success: false, message: `Missing: ${missing.join(', ')}` });
  next();
};

export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token required' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};
