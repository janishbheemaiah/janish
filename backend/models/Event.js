const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  maxParticipants: { type: Number, required: true },
  registeredCount: { type: Number, default: 0 },
  meetingPoint: { type: String, required: true },
  route: { type: String, required: true },
  requirements: { type: String },
  achievementPoints: { type: Number, required: true, default: 0 },
  image: { type: String }, // Keep for backward compatibility, but will use photos array
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
