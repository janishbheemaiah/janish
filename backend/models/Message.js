const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Allow user-to-user messages as well as admin-user types
  type: { type: String, enum: ['user-to-admin', 'admin-to-user', 'user-to-user'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
