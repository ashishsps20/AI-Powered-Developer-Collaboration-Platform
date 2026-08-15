import authService from '../services/auth.service.js';
import { registerValidator } from '../validators/auth.validator.js';

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
}

export default new AuthController();
