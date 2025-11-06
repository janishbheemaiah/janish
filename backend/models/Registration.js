const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  bikeModel: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  notes: { type: String },
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  startCode: { type: String, unique: true },
  endCode: { type: String, unique: true },
  checkIn: { type: Boolean, default: false },
  checkOut: { type: Boolean, default: false },
  overallStatus: { type: String, enum: ['Completed', 'LeftEarly', 'Absent', 'Cancelled', 'PendingApproval'], default: 'Absent' },
  message: { type: String, default: '❌ You didn\'t attend this ride.' },
  approvedPoints: { type: Number, default: 0 },
  achievementPoints: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
