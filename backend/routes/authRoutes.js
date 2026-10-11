const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be configured before issuing tokens');
  }

  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= 8 && password.length <= 128;

// @desc Authenticate user and get token
// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Unable to log in right now' });
  }
});

// @desc Register a beneficiary account.
// Privileged roles must be provisioned by an administrator, not chosen by
// an unauthenticated request. Add an authenticated admin-only user-management
// endpoint before enabling officer self-service provisioning.
// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
  }

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'A valid email address is required' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return res.status(503).json({ message: 'Authentication is not configured' });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Never accept privileged roles from public registration input.
    const user = await User.create({ name, email, password, role: 'beneficiary' });
    const token = generateToken(user.id);

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    console.error('Registration failed:', error);
    return res.status(500).json({ message: 'Unable to create the account right now' });
  }
});

module.exports = router;
