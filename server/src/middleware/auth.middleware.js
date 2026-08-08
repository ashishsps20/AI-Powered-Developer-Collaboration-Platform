import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';
import { getTokenFromRequest } from '../utils/authCookie.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been suspended');
  }

  req.user = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name,
  };
  next();
});

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}
