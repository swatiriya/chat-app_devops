const express   = require('express');
const jwt       = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User      = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: create a JWT token
function makeToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', [
  body('firstname').trim().notEmpty().withMessage('First name is required'),
  body('lastname').trim().notEmpty().withMessage('Last name is required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { firstname, lastname, username, email, password } = req.body;

  try {
    // Check if email already used
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'This email is already registered' });

    // Check if username taken
    if (await User.findOne({ username: username.toLowerCase() }))
      return res.status(400).json({ message: 'Username already taken' });

    // Create user (password gets hashed automatically by User model)
    const user  = await User.create({ firstname, lastname, username, email, password });
    const token = makeToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // Mark user as online
await User.findByIdAndUpdate(
  user._id,
  {
    status: 'online'
  }
);

    const token = makeToken(user._id);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me — get logged-in user's info
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { status: 'offline', lastSeen: new Date() });
  res.json({ message: 'Logged out' });
});

module.exports = router;