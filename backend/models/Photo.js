const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // optional, for event photos
  title: { type: String },
  description: { type: String },
  tags: [{ type: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked the photo
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  isEventCover: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Photo', photoSchema);
