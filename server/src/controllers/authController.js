const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });

// POST /auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, password, role } = req.body;

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash: password, // pre-save hook hashes it
      role,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshTokenRaw = generateRefreshToken(user._id);
    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');

    const decoded = jwt.decode(refreshTokenRaw);
    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(decoded.exp * 1000),
    });

    return res.status(201).json({
      accessToken,
      refreshToken: refreshTokenRaw,
      user,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshTokenRaw = generateRefreshToken(user._id);
    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');

    const decoded = jwt.decode(refreshTokenRaw);
    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(decoded.exp * 1000),
    });

    // Return user without passwordHash
    const userObj = user.toJSON();

    return res.status(200).json({
      accessToken,
      refreshToken: refreshTokenRaw,
      user: userObj,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/refresh
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const storedToken = await RefreshToken.findOne({ tokenHash, user: decoded.id });
    if (!storedToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (storedToken.expiresAt < new Date()) {
      await storedToken.deleteOne();
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    const newAccessToken = generateAccessToken(decoded.id);
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// POST /auth/logout
const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(200).json({ message: 'Logged out' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await RefreshToken.deleteOne({ tokenHash });
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, refresh, logout };
