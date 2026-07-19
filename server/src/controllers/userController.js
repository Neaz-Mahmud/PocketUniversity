const User = require('../models/User');
const { getQuotaInfo } = require('../services/quotaService');
const { generatePresignedUploadUrl } = require('../services/r2Service');
const { v4: uuidv4 } = require('uuid');

// GET /users/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const quota = await getQuotaInfo(req.user._id, req.user.role);
    return res.json({ user, quota });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /users/me
const updateMe = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /users/me/avatar/presign
const presignAvatarUpload = async (req, res) => {
  try {
    const { mimeType } = req.body;
    if (!mimeType) return res.status(400).json({ message: 'mimeType is required' });

    // Use a fixed key prefix for avatars to overwrite previous ones or just use uuid
    const ext = mimeType.split('/')[1] || 'jpg';
    const fileKey = `avatars/${req.user._id}/${uuidv4()}.${ext}`;

    const presignedUrl = await generatePresignedUploadUrl(fileKey, mimeType);
    return res.json({ fileKey, presignedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /users/me/avatar/confirm
const confirmAvatarUpload = async (req, res) => {
  try {
    const { fileKey } = req.body;
    if (!fileKey) return res.status(400).json({ message: 'fileKey is required' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicKey: fileKey },
      { new: true }
    );
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /users/search?q= (admin only generally, but protected is fine)
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [{ email: regex }, { phone: regex }],
    }).select('name email phone role profilePicKey');

    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMe, updateMe, presignAvatarUpload, confirmAvatarUpload, searchUsers };
