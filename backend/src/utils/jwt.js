import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign({ user_id: user.user_id, email: user.email, google_id: user.google_id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
