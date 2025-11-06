const express = require('express');
const multer = require('multer');
const path = require('path');
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const Registration = require('../models/Registration');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Multer storage for event photos
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name').populate('photos');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name').populate('photos');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (admin only)
router.post('/', auth, adminAuth, upload.array('photos', 10), async (req, res) => {
  try {
    let photoIds = [];

    // Handle photo uploads if any
    if (req.files && req.files.length > 0) {
      const photoPromises = req.files.map(async (file, index) => {
        const isCover = index === 0; // First photo is the cover
        const photo = new Photo({
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          uploadedBy: req.user.id,
          title: req.body.photoTitles ? req.body.photoTitles[file.originalname] : file.originalname,
          description: req.body.photoDescriptions ? req.body.photoDescriptions[file.originalname] : '',
          isEventCover: isCover
        });
        await photo.save();
        return photo._id;
      });
      photoIds = await Promise.all(photoPromises);
    }

    const eventData = { 
      ...req.body, 
      organizer: req.user.id, 
      photos: photoIds,
      achievementPoints: parseInt(req.body.achievementPoints) || 0 
    };
    // Remove photoTitles and photoDescriptions from eventData as they are not part of Event schema
    delete eventData.photoTitles;
    delete eventData.photoDescriptions;

    const event = new Event(eventData);
    await event.save();

    // Update photos with eventId
    if (photoIds.length > 0) {
      await Photo.updateMany({ _id: { $in: photoIds } }, { eventId: event._id });
    }

    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    // Also delete related registrations
    await Registration.deleteMany({ eventId: req.params.id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
