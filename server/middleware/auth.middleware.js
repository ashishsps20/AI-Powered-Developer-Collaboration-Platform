import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Find user by ID
    const user = await User.findById(decoded.sub);

    // Verify user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Prepare safe user object
    const userObject = user.toObject();
    delete userObject.password;
    userObject.id = userObject._id;
    delete userObject._id;
    delete userObject.__v;

    // Attach to request
    req.user = userObject;

    next();
  } catch (error) {
    // If JWT is expired or invalid, jwt.verify throws an error
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};
