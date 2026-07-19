const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, refresh, logout } = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('identifier').notEmpty().withMessage('Email or Phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
