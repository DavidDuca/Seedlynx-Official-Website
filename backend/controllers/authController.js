// =========================================
// controllers/authController.js
// =========================================
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const Admin  = require('../models/Admin');

const JWT_SECRET  = process.env.JWT_SECRET  || 'seedlynx_secret_dev_key';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: { id: admin._id, username: admin.username },
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// GET /api/auth/me  (protected)
exports.me = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    res.json({ admin });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};