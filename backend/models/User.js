const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  profilePicture: { type: String },
  phone: { type: String },
  licenseNumber: { type: String },
  bloodGroup: { type: String },
  bikeModel: { type: String },
  isAdmin: { type: Boolean, default: false },
  registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  uploadedPhotos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
  achievements: [{ type: String }],
  achievementPoints: { type: Number, default: 0 },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
