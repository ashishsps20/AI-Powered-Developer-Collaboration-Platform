import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken } from '../utils/token.js';
import { serializeUser } from '../utils/userSerializer.js';

export async function registerUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const userCount = await User.countDocuments();
  let assignedRole = 'DEVELOPER';

  if (userCount === 0) {
    assignedRole = 'ADMIN';
  } else if (role === 'ADMIN') {
    throw new ApiError(403, 'Cannot self-register as admin');
  } else if (role === 'PROJECT_MANAGER' || role === 'DEVELOPER') {
    assignedRole = role;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
  });

  const token = signAccessToken(user._id.toString());
  return { user: sanitizeUser(user), token };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been suspended');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signAccessToken(user._id.toString());
  return { user: sanitizeUser(user), token };
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been suspended');
  }
  return sanitizeUser(user);
}

export async function requestPasswordReset(_email) {
  return {
    message:
      'If an account exists for this email, password reset instructions will be sent. (Email delivery will be added in a later phase.)',
  };
}
