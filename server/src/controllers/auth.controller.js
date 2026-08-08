import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie.js';

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  setAuthCookie(res, token);
  res.status(201).json({ success: true, data: { user, token } });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  setAuthCookie(res, token);
  res.json({ success: true, data: { user, token } });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  res.json({ success: true, data: { user } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  res.json({ success: true, data: result });
});
