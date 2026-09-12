import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

export const registerUser = async ({ name, email, password, role }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    error.errors = { email: 'Email is already registered' };
    throw error;
  }

  // Safe role assignment: default to researcher
  // Note: Only 'researcher' or 'admin' allowed by schema; default to 'researcher'
  const assignedRole = role === 'admin' ? 'admin' : 'researcher';

  const user = new User({
    name,
    email,
    password,
    role: assignedRole,
    reputation: 0,
  });

  await user.save();

  // Generate JWT token
  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return {
    user: user.toSafeObject(),
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  // Retrieve user with password field explicitly included
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('This account has been disabled. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  // Compare candidate password against bcrypt hash
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  });

  return {
    user: user.toSafeObject(),
    token,
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeObject();
};
