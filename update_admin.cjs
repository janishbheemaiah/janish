const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/motoconnect');
    const user = await User.findOneAndUpdate(
      { email: 'admin@motoconnect.com' },
      { isAdmin: true },
      { new: true }
    );
    if (user) {
      console.log('Admin user updated:', user.email, 'isAdmin:', user.isAdmin);
    } else {
      console.log('Admin user not found');
    }
    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

updateAdmin();
