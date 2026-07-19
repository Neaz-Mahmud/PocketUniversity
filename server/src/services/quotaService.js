const PersonalFile = require('../models/PersonalFile');

// Quotas in bytes
const QUOTAS = {
  student: 500 * 1024 * 1024,  // 500 MB
  teacher: 1 * 1024 * 1024 * 1024, // 1 GB
};

// Presigned upload URLs are issued with a 1-hour expiry (see r2Service).
// A 'pending' PersonalFile whose presign has expired without being confirmed
// is an abandoned upload attempt — safe to drop so it doesn't lock up quota forever.
const PENDING_TTL_MS = 60 * 60 * 1000;

const expireStalePending = async (userId) => {
  const cutoff = new Date(Date.now() - PENDING_TTL_MS);
  await PersonalFile.deleteMany({ owner: userId, status: 'pending', createdAt: { $lt: cutoff } });
};

/**
 * Get total used quota for a user (sum of active + still-pending personal files).
 * Pending files must count too — otherwise calling presign repeatedly before
 * confirming lets a user reserve far more storage than their quota allows.
 */
const getUsedQuota = async (userId) => {
  await expireStalePending(userId);
  const result = await PersonalFile.aggregate([
    { $match: { owner: userId, status: { $in: ['pending', 'active'] } } },
    { $group: { _id: null, total: { $sum: '$fileSize' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Check if adding newFileSize would exceed the quota for the user's role.
 * Throws an error if quota would be exceeded.
 */
const checkQuota = async (userId, newFileSize, role) => {
  const limit = QUOTAS[role] || QUOTAS.student;
  const used = await getUsedQuota(userId);
  if (used + newFileSize > limit) {
    const usedMB = (used / (1024 * 1024)).toFixed(1);
    const limitMB = (limit / (1024 * 1024)).toFixed(1);
    throw Object.assign(new Error(`Storage quota exceeded (${usedMB} MB used of ${limitMB} MB limit)`), {
      status: 413,
      code: 'QUOTA_EXCEEDED',
    });
  }
};

/**
 * Get quota info for a user.
 */
const getQuotaInfo = async (userId, role) => {
  const limit = QUOTAS[role] || QUOTAS.student;
  const used = await getUsedQuota(userId);
  return { used, limit, available: limit - used };
};

module.exports = { getUsedQuota, checkQuota, getQuotaInfo, QUOTAS };
