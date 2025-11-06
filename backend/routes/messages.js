const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    // Validate receiver
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    // Allow user-to-user messaging
    const type = req.user.isAdmin ? 'admin-to-user' : (receiver.isAdmin ? 'user-to-admin' : 'user-to-user');

    const message = new Message({
      senderId,
      receiverId,
      content,
      type
    });

    await message.save();
    await message.populate('senderId', 'name email');

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for user (conversations)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.params.userId },
        { receiverId: req.params.userId }
      ],
      $or: [
        { isDeleted: false }, // Show all non-deleted messages
        { // Show deleted messages only to the sender
          isDeleted: true,
          senderId: req.params.userId
        }
      ]
    })
    .populate('senderId', 'name email')
    .populate('receiverId', 'name email')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all messages for admin
router.get('/admin', auth, adminAuth, async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation between current user and another user
router.get('/with/:otherId', auth, async (req, res) => {
  try {
    const me = req.user.id;
    const otherId = req.params.otherId;

    if (!mongoose.Types.ObjectId.isValid(otherId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: otherId },
        { senderId: otherId, receiverId: me }
      ],
      $or: [
        { isDeleted: false },
        { isDeleted: true, senderId: me } // show deleted only to sender
      ]
    })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Conversation fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Only receiver can mark as read
    if (message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isRead = true;
    await message.save();

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unsend/Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Only sender can unsend
    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only sender can unsend messages.' });
    }

    // Check if message is within unsend time limit (e.g., 1 hour)
    const timeLimit = 60 * 60 * 1000; // 1 hour in milliseconds
    const messageAge = Date.now() - message.createdAt.getTime();
    
    if (messageAge > timeLimit) {
      return res.status(400).json({ message: 'Message cannot be unsent after 1 hour' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user.id;
    await message.save();

    res.json({ message: 'Message unsent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore (undo unsend)
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Only the user who deleted (sender) can restore
    if (!message.isDeleted || message.deletedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied or message not deleted' });
    }

    // Allow restore within a short undo window (10 seconds)
    const undoWindow = 10 * 1000; // 10 seconds
    const deletedAt = message.deletedAt ? message.deletedAt.getTime() : 0;
    if (Date.now() - deletedAt > undoWindow) {
      return res.status(400).json({ message: 'Undo window expired' });
    }

    message.isDeleted = false;
    message.deletedAt = null;
    message.deletedBy = null;
    await message.save();

    res.json({ message: 'Message restored' });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
