const express = require('express');
const User    = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — get all users except yourself (for the contacts list)
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .limit(50);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Could not load users' });
  }
});

// GET /api/users/:id — get one user's profile
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Could not load user' });
  }
});

module.exports = router;