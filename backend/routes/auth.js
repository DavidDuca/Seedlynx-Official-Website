// =========================================
// routes/auth.js
// =========================================
const router = require('express').Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me  (requires token)
router.get('/me', protect, authController.me);

module.exports = router;