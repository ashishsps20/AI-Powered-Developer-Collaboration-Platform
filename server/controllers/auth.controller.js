import authService from '../services/auth.service.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';

class AuthController {
  async register(req, res, next) {
    try {
      // Validate request body
      const { error, value } = registerValidator.validate(req.body, { abortEarly: false });
      
      if (error) {
        // Return 400 with first error message or all error details
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      // Call service
      const user = await authService.registerUser(value);

      // Return 201 Created
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user,
        },
      });
    } catch (err) {
      // Check if it's our thrown custom error from service
      if (err.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: err.message,
        });
      }
      // Otherwise, pass to centralized error handler
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { error, value } = loginValidator.validate(req.body, { abortEarly: false });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { user, token } = await authService.loginUser(value);

      // Set HTTP-only cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 15 minutes to match example JWT_EXPIRES_IN=15m
        path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
        },
      });
    } catch (err) {
      if (err.statusCode === 401) {
        return res.status(401).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      res.cookie('jwt', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0, // Clear the cookie instantly
        path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();
