// =========================================
// models/Booking.js
// =========================================
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name too long'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
  },
  date: {
    type: String,    // stored as YYYY-MM-DD string
    required: [true, 'Date is required'],
  },
  time: {
    type: String,    // stored as HH:MM (24h)
    required: [true, 'Time slot is required'],
    enum: {
      values: ['09:00','10:00','11:00','13:00','14:00','15:00','16:00'],
      message: 'Invalid time slot',
    },
  },
  service: {
    type: String,
    enum: ['web', 'multimedia', 'both', 'consultation'],
    default: 'consultation',
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message too long'],
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Compound index: prevent duplicate date+time bookings
bookingSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);