import User from '../models/User.js';
import bcrypt from 'bcrypt';
import generateToken from '../utils/generateToken.js';

class AuthService {
  async registerUser(data) {
    const { name, email, password } = data;
    
    // Normalize email (lowercase and trim already handled by Mongoose schema, but we do it safely)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error('An account with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Create user
      const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
      });

      // Convert to plain object and remove password
      const userObject = user.toObject();
      delete userObject.password;
      
      // Map _id to id for cleaner response
      userObject.id = userObject._id;
      delete userObject._id;
      delete userObject.__v;

      return userObject;
    } catch (error) {
      // Handle MongoDB duplicate-key race condition safely (11000 is duplicate key error)
      if (error.code === 11000) {
        const dupError = new Error('An account with this email already exists');
        dupError.statusCode = 409;
        throw dupError;
      }
      throw error;
    }
  }

  async loginUser(data) {
    const { email, password } = data;
    
    const normalizedEmail = email.toLowerCase().trim();

    // Find user and explicitly select password for comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error('Account is disabled');
      error.statusCode = 401;
      throw error;
    }

    // Generate token
    const token = generateToken(user._id, user.platformRole);

    // Prepare safe user object
    const userObject = user.toObject();
    delete userObject.password;
    userObject.id = userObject._id;
    delete userObject._id;
    delete userObject.__v;

    return { user: userObject, token };
  }
}

export default new AuthService();
