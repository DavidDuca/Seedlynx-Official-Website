// =========================================
// SEEDLYNX — server.js
// =========================================
require('dotenv').config();

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');

const authRoutes    = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static frontend (optional) ────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/bookings', bookingRoutes);

// ── Health Check ──────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── SPA Fallback ─────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ message: 'Route not found' });
  }
});

// ── Connect MongoDB ───────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/seedlynx';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(' MongoDB connected:', MONGO_URI);

    // Seed default admin if not exists
    const Admin = require('./models/Admin');
    const bcrypt = require('bcryptjs');
    const existing = await Admin.findOne({ username: 'admin' });
    if (!existing) {
      const hashed = await bcrypt.hash('admin123', 12);
      await Admin.create({ username: 'admin', password: hashed });
      console.log(' Default admin created — username: admin | password: admin123');
      console.log('    Change this password in production!');
    }

    app.listen(PORT, () => {
      console.log(` Seedlynx server running at http://localhost:${PORT}`);
      console.log(` Admin dashboard: http://localhost:${PORT}/admin/`);
    });
  })
  .catch(err => {
    console.error(' MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;