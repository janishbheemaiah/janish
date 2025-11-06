const express = require('express');
const multer = require('multer');
const path = require('path');
const Team = require('../models/Team');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'profile-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// Get all team members
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find();
    const teamsWithUrls = teams.map(team => ({
      ...team.toObject(),
      imageUrl: `http://localhost:5000/uploads/${team.image}`
    }));
    res.json(teamsWithUrls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add team member (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const { name, role, bio, specialization } = req.body;
    const team = new Team({
      name,
      role,
      bio,
      image: req.file.filename,
      specialization
    });
    await team.save();
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update team member (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const { name, role, bio, specialization } = req.body;
    const updateData = { name, role, bio, specialization };

    if (req.file) {
      updateData.image = req.file.filename;
      // Optionally delete old image
    }

    const team = await Team.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!team) return res.status(404).json({ message: 'Team member not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete team member (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team member not found' });

    // Delete image file
    const fs = require('fs');
    const imagePath = path.join(__dirname, '../uploads', team.image);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team member deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
