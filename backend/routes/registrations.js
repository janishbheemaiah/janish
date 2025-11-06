const express = require('express');
const crypto = require('crypto');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate unique code
const generateUniqueCode = async () => {
  let code;
  let exists;
  do {
    code = crypto.randomBytes(4).toString('hex').toUpperCase();
    exists = await Registration.findOne({ $or: [{ startCode: code }, { endCode: code }] });
  } while (exists);
  return code;
};

// Helper function to update overall status
const updateOverallStatus = (checkIn, checkOut) => {
  if (checkIn && checkOut) {
    return { overallStatus: 'Completed', message: '🎉wwoohh!!,your ride has completed successfully!' };
  } else if (checkIn && !checkOut) {
    return { overallStatus: 'LeftEarly', message: '⚠️ You attended but didn\'t complete the ride.' };
  } else {
    return { overallStatus: 'Absent', message: '❌ You didn\'t attend this ride.' };
  }
};

// Register for event
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, name, email, phone, licenseNumber, bloodGroup, bikeModel, emergencyContact, notes } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.registeredCount >= event.maxParticipants) return res.status(400).json({ message: 'Event is full' });

    const existingReg = await Registration.findOne({ eventId, userId: req.user.id, status: 'approved' });
    if (existingReg) return res.status(400).json({ message: 'Already registered' });

    const startCode = await generateUniqueCode();
    const endCode = await generateUniqueCode();

    const registration = new Registration({
      eventId, userId: req.user.id, name, email, phone, licenseNumber, bloodGroup, bikeModel, emergencyContact, notes,
      startCode, endCode
    });
    await registration.save();

    // Update event count
    event.registeredCount += 1;
    await event.save();

    // Update user registeredEvents
    await require('../models/User').findByIdAndUpdate(req.user.id, { $push: { registeredEvents: eventId } });

    res.status(201).json(registration);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get registrations for user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && !req.user.isAdmin) return res.status(403).json({ message: 'Access denied' });
    const registrations = await Registration.find({ userId: req.params.userId }).populate('eventId');
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all registrations (admin)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { eventId } = req.query;
    let query = {};
    if (eventId) query.eventId = eventId;
    const registrations = await Registration.find(query).populate('eventId userId', 'title name');
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update registration status (admin)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { status, achievementPoints } = req.body;
    const updateData = { status };

    if (status === 'rejected') {
      updateData.overallStatus = 'Cancelled';
      updateData.message = "Your registration has been cancelled due to some reason, please register again.";
      updateData.achievementPoints = 0;

      // Decrement event registeredCount
      const event = await Event.findByIdAndUpdate(
        req.body.eventId || updateData.eventId,
        { $inc: { registeredCount: -1 } },
        { new: true }
      );

      // Remove from user's registeredEvents
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { registeredEvents: req.body.eventId || updateData.eventId }
      });
    } else if (status === 'approved') {
      updateData.overallStatus = 'Absent';
      updateData.message = '❌ You didn\'t attend this ride.';
      updateData.checkIn = false;
      updateData.checkOut = false;

      // Add to user's registeredEvents if not already there
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { registeredEvents: req.body.eventId || updateData.eventId }
      });
    }

    if (achievementPoints !== undefined) {
      updateData.approvedPoints = achievementPoints;
    }

    const registration = await Registration.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('eventId');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    // If the ride is completed and approvedPoints are set, update achievementPoints
    if (registration.overallStatus === 'Completed' && registration.approvedPoints > 0 && registration.achievementPoints === 0) {
      registration.achievementPoints = registration.approvedPoints;
      await registration.save();
    }

    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete registration (admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    // If approved, decrement event count
    if (registration.status === 'approved') {
      const event = await Event.findById(registration.eventId);
      if (event && event.registeredCount > 0) {
        event.registeredCount -= 1;
        await event.save();
      }
    }

    await Registration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registration deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check-in with start code
router.post('/checkin', auth, adminAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const registration = await Registration.findOne({ startCode: code.toUpperCase() });
    if (!registration) return res.status(404).json({ message: 'Invalid start code' });

    if (registration.checkIn) return res.status(400).json({ message: 'Already checked in' });

    registration.checkIn = true;
    const statusUpdate = updateOverallStatus(true, registration.checkOut);
    registration.overallStatus = statusUpdate.overallStatus;
    registration.message = statusUpdate.message;

    await registration.save();
    res.json({ message: 'Check-in successful', registration });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Request re-approval for rejected registration (user)
router.put('/:id/request-reapproval', auth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (registration.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    if (registration.status !== 'rejected') return res.status(400).json({ message: 'Only rejected registrations can request re-approval' });

    // Check if event exists and is not full
    const event = await Event.findById(registration.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.registeredCount >= event.maxParticipants) return res.status(400).json({ message: 'Event is full' });

    registration.status = 'pending';
    registration.overallStatus = 'PendingApproval';
    registration.message = '⏳ Application sent, waiting for admin approval.';
    registration.achievementPoints = 0;
    registration.checkIn = false;
    registration.checkOut = false;
    await registration.save();

    // Increment event registeredCount
    await Event.findByIdAndUpdate(registration.eventId, { $inc: { registeredCount: 1 } });

    // Add back to user's registeredEvents
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { registeredEvents: registration.eventId } });

    res.json(registration);
  } catch (err) {
    console.error('Re-approval error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Check-out with end code
router.post('/checkout', auth, adminAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const registration = await Registration.findOne({ endCode: code.toUpperCase() });
    if (!registration) return res.status(404).json({ message: 'Invalid end code' });

    if (!registration.checkIn) return res.status(400).json({ message: 'Must check-in first' });
    if (registration.checkOut) return res.status(400).json({ message: 'Already checked out' });

    registration.checkOut = true;
    const statusUpdate = updateOverallStatus(registration.checkIn, true);
    registration.overallStatus = statusUpdate.overallStatus;
    registration.message = statusUpdate.message;

    // Award achievement points only if the ride is completed
    if (registration.overallStatus === 'Completed' && registration.approvedPoints > 0) {
      registration.achievementPoints = registration.approvedPoints;

      // Update user's total achievement points
      const User = require('../models/User');
      await User.findByIdAndUpdate(registration.userId, {
        $inc: { achievementPoints: registration.approvedPoints }
      });
    }

    await registration.save();
    res.json({ message: 'Check-out successful', registration });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
