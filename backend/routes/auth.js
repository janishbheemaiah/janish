const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailjs = require('@emailjs/nodejs');
const crypto = require('crypto');

// Initialize EmailJS with public key
emailjs.init({publicKey: 'DFVjJCxJ2RQW31b1N'});

const otpStore = new Map();

// Helper to normalize email for otp storage (lowercase + trim)
function normalizeEmailForOtp(email) {
  return (email || '').toString().trim().toLowerCase();
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = express.Router();

// Multer configuration for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send reset email via EmailJS
    await emailjs.send(
      'service_yc8xc26',       // service ID
      'template_3f0lsa5',      // template ID
      { email: email, reset_link: resetLink }, // template parameters
      { privateKey: 'H7TyZkrTts1EIPt6_nirf' } // private key
    );

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('EmailJS error:', error);
    res.status(500).json({ message: 'Failed to send reset email, check server logs' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { token, email, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    // Update password
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  const rawEmail = req.body.email;
  const email = (rawEmail || '').toString().trim();
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    // Case-insensitive check for existing user
    const existingUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 min
    // Store using normalized key
    otpStore.set(normalizeEmailForOtp(email), { otp, expiry });
    console.log(`OTP for ${email}: ${otp}`);

    // Send OTP email
    await emailjs.send(
      'service_yc8xc26',       // service ID
      'template_owxlmdc',      // template ID
      { email: email, otp: otp }, // template parameters
      { privateKey: 'H7TyZkrTts1EIPt6_nirf' } // private key
    );

    res.json({ message: 'OTP sent' });
  } catch (error) {
    console.error('EmailJS error:', error);
    res.status(500).json({ message: 'Failed to send OTP, check server logs' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email: rawEmail, password, name, phone, licenseNumber, bloodGroup, bikeModel, otp } = req.body;
    const email = (rawEmail || '').toString().trim();

    // Verify OTP (compare as string and use normalized key)
    const key = normalizeEmailForOtp(email);
    const stored = otpStore.get(key);

    // Debug logging to help diagnose failures (remove in production)
    console.log('Register OTP check:', { email, key, providedOtp: String(otp), stored });

    if (!stored) {
      return res.status(400).json({ message: 'No OTP found for this email or it has expired' });
    }

    if (Date.now() > stored.expiry) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (stored.otp !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP
    otpStore.delete(key);

    // Check if username is already taken
    let existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already taken' });

    existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ username, email, password, name, phone, licenseNumber, bloodGroup, bikeModel });
    if (email === 'admin@motoconnect.com') {
      user.isAdmin = true;
    }
    await user.save();

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userData = await User.findById(user._id).select('-password');
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Set admin for specific email
    if (email === 'admin@motoconnect.com') {
      user.isAdmin = true;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userData = await User.findById(user._id).select('-password');
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Calculate total achievement points from completed registrations
    const Registration = require('../models/Registration');
    const completedRegistrations = await Registration.find({
      userId: req.user.id,
      overallStatus: 'Completed'
    });
    const totalPoints = completedRegistrations.reduce((sum, reg) => sum + (reg.achievementPoints || 0), 0);
    user.achievementPoints = totalPoints;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Prevent password update here
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture
router.post('/upload-profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const profilePictureUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user.id, { profilePicture: profilePictureUrl }, { new: true }).select('-password');
    res.json({ profilePicture: profilePictureUrl, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
