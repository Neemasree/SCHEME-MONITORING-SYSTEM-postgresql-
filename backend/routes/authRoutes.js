const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticate, allowRoles } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be configured before issuing tokens');
  }

  return jwt.sign({ id }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
};

const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= 8 && password.length <= 128;

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

const getLoginAttempt = (key) => {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || now - current.startedAt >= LOGIN_WINDOW_MS) {
    const fresh = { count: 0, startedAt: now };
    loginAttempts.set(key, fresh);
    return fresh;
  }
  return current;
};

// @desc Authenticate user and get token
// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const attemptKey = `${req.ip || 'unknown'}:${email}`;
  const attempt = getLoginAttempt(attemptKey);
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many login attempts. Try again in 15 minutes.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.matchPassword(password))) {
      attempt.count += 1;
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    loginAttempts.delete(attemptKey);
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

// Admin-only user administration. Public registration remains beneficiary-only.
router.get('/users', authenticate, allowRoles('admin'), async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'district', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    return res.json(users);
  } catch (error) {
    console.error('List users failed:', error);
    return res.status(500).json({ message: 'Unable to list users' });
  }
});

router.post('/users', authenticate, allowRoles('admin'), async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  const role = req.body?.role;
  const district = typeof req.body?.district === 'string' ? req.body.district.trim() : '';

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'A valid email address is required' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
  }
  if (!['admin', 'district_officer', 'field_officer', 'beneficiary'].includes(role)) {
    return res.status(400).json({ message: 'A valid role is required' });
  }
  if (['district_officer', 'field_officer'].includes(role) && !district) {
    return res.status(400).json({ message: 'A district is required for officer accounts' });
  }

  try {
    const user = await User.create({ name, email, password, role, district: district || null });
    return res.status(201).json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      district: user.district, isActive: user.isActive, createdAt: user.createdAt,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    console.error('Create user failed:', error);
    return res.status(400).json({ message: 'Unable to create user; check the supplied fields' });
  }
});

router.patch('/users/:id/deactivate', authenticate, allowRoles('admin'), async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isActive) return res.json({ message: 'User is already deactivated' });
    user.isActive = false;
    await user.save();
    return res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user failed:', error);
    return res.status(500).json({ message: 'Unable to deactivate user' });
  }
});

module.exports = router;
