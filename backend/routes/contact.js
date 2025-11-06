const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Submit contact message (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, category, subject, message } = req.body;

    const contactMessage = new ContactMessage({
      name,
      email,
      phone,
      category,
      subject,
      message
    });

    await contactMessage.save();
    res.status(201).json({ message: 'Message sent successfully! We\'ll get back to you soon.' });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

// Get all contact messages (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contact message status (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete contact message (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
