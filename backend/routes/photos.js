const express = require('express');
const multer = require('multer');
const path = require('path');
const Photo = require('../models/Photo');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
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

// Upload photo
router.post('/upload', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { title, description, tags, eventId } = req.body;
    const photo = new Photo({
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      eventId,
      title,
      description,
      tags: tags ? tags.split(',') : []
    });
    await photo.save();

    // Update user uploadedPhotos
    await require('../models/User').findByIdAndUpdate(req.user.id, { $push: { uploadedPhotos: photo._id } });

    res.status(201).json(photo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get photos
router.get('/', async (req, res) => {
  try {
    const { userId, eventId } = req.query;
    let query = { isEventCover: { $ne: true } };

    if (userId) {
      // If userId is specified, show photos from that user
      query.uploadedBy = userId;
    } else {
      // For gallery view (no userId), only show admin photos
      const User = require('../models/User');
      const adminUsers = await User.find({ isAdmin: true }).select('_id');
      const adminIds = adminUsers.map(user => user._id);
      query.uploadedBy = { $in: adminIds };
    }

    if (eventId) query.eventId = eventId;

    const photos = await Photo.find(query).populate('uploadedBy', 'name username').populate('eventId', 'title');
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Download photo
router.get('/:id/download', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    res.download(photo.path, photo.filename);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    const userId = req.user.id;
    const isLiked = photo.likes.some(like => like.toString() === userId);

    if (isLiked) {
      // Unlike
      photo.likes = photo.likes.filter(like => like.toString() !== userId);
      await photo.save();
      res.json({ message: 'Photo unliked', likes: photo.likes.length });
    } else {
      // Like
      photo.likes.push(userId);
      await photo.save();
      res.json({ message: 'Photo liked', likes: photo.likes.length });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a photo
router.get('/:id/comments', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).populate('comments.user', 'name username');
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    res.json(photo.comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment to a photo
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) return res.status(400).json({ message: 'Comment text is required' });

    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    const newComment = {
      user: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    };

    photo.comments.push(newComment);
    await photo.save();

    // Populate the user info for the response
    await photo.populate('comments.user', 'name username');
    const addedComment = photo.comments[photo.comments.length - 1];

    res.status(201).json(addedComment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (photo.uploadedBy.toString() !== req.user.id && !req.user.isAdmin) return res.status(403).json({ message: 'Not authorized' });

    // Delete file from disk
    const fs = require('fs');
    if (fs.existsSync(photo.path)) fs.unlinkSync(photo.path);

    await Photo.findByIdAndDelete(req.params.id);
    // Remove from user uploadedPhotos
    await require('../models/User').findByIdAndUpdate(req.user.id, { $pull: { uploadedPhotos: req.params.id } });

    res.json({ message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
