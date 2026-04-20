// =========================================
// controllers/bookingController.js
// =========================================
const Booking = require('../models/Booking');

// ── POST /api/bookings  (public) ──────────
exports.createBooking = async (req, res) => {
  try {
    const { name, email, date, time, service, message } = req.body;

    // Basic validation
    if (!name || !email || !date || !time) {
      return res.status(400).json({ message: 'Name, email, date, and time are required.' });
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.', field: 'email' });
    }

    // Date must not be in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'Please select a future date.', field: 'date' });
    }

    // Check for duplicate date + time
    const existing = await Booking.findOne({ date, time });
    if (existing) {
      return res.status(409).json({
        message: 'That time slot is already booked. Please choose another.',
        field: 'time',
      });
    }

    const booking = await Booking.create({ name, email, date, time, service, message });

    res.status(201).json({
      message: 'Booking created successfully!',
      booking,
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'That time slot is already taken. Please select a different slot.',
        field: 'time',
      });
    }
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message });
    }
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── GET /api/bookings  (protected) ────────
exports.getBookings = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date)   filter.date   = date;

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({ bookings, total, page: parseInt(page) });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/bookings/:id  (protected) ────
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── PUT /api/bookings/:id  (protected) ────
exports.updateBooking = async (req, res) => {
  try {
    const { name, email, date, time, service, message, status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Check duplicate if date/time changed
    if ((date && date !== booking.date) || (time && time !== booking.time)) {
      const d = date || booking.date;
      const t = time || booking.time;
      const existing = await Booking.findOne({ date: d, time: t, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ message: 'That time slot is already taken.', field: 'time' });
      }
    }

    // Update only provided fields
    if (name)    booking.name    = name;
    if (email)   booking.email   = email;
    if (date)    booking.date    = date;
    if (time)    booking.time    = time;
    if (service) booking.service = service;
    if (message !== undefined) booking.message = message;
    if (status)  booking.status  = status;

    await booking.save();

    res.json({ message: 'Booking updated successfully.', booking });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That time slot is already taken.', field: 'time' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    console.error('Update booking error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ── DELETE /api/bookings/:id  (protected) ─
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ message: 'Booking deleted successfully.' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};