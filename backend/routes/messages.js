const express = require('express');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/:userId — load conversation between logged-in user and someone else
router.get('/:userId', authenticate, async (req, res) => {
  const myId       = req.user._id;
  const otherId    = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: myId,    recipient: otherId },
        { sender: otherId, recipient: myId    }
      ]
    })
    .sort({ createdAt: 1 })       // oldest first
    .limit(100)                    // last 100 messages
    .populate('sender', 'firstname lastname username');

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Could not load messages' });
  }
});

// POST /api/messages — save a message to the database
router.post('/', authenticate, async (req, res) => {
  const { recipientId, content } = req.body;
  if (!recipientId || !content?.trim()) {
    return res.status(400).json({ message: 'recipientId and content are required' });
  }

  try {
    const msg = await Message.create({
      sender:    req.user._id,
      recipient: recipientId,
      content:   content.trim()
    });
    await msg.populate('sender', 'firstname lastname username');
    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(500).json({ message: 'Could not send message' });
  }
});

module.exports = router;