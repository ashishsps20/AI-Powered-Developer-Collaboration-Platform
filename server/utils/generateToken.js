import jwt from 'jsonwebtoken';

const generateToken = (userId, platformRole) => {
  return jwt.sign(
    { sub: userId, platformRole },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

export default generateToken;
