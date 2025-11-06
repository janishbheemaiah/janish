const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Function to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get all users (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin users
router.get('/admins', auth, async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true }).select('name email _id');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users by username
// NOTE: place this before the '/:id' route so the literal path '/search' doesn't get
// treated as an ID (Express matches routes in declaration order).
router.get('/search', auth, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'Username query required' });

    // Escape special regex characters to prevent regex injection
    const escapedUsername = escapeRegex(username.trim());

    const users = await User.find({
      username: { $regex: escapedUsername, $options: 'i' }
    }).select('username name profilePicture bikeModel achievementPoints createdAt _id');
    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // validate ObjectId to avoid CastError and return a friendly 400
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(req.params.id).select('username name email profilePicture bikeModel achievementPoints createdAt _id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
