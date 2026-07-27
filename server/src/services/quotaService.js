const PersonalFile = require('../models/PersonalFile');
const TeacherMaterialFile = require('../models/TeacherMaterialFile');

const MB = 1024 * 1024;
const GB = 1024 * MB;

// Storage quotas, in bytes, keyed by role then verification state.
//  - student: 50 MB unverified → 150 MB verified
//  - teacher: 50 MB unverified → 2 GB verified (COMBINED personal + shared material)
//  - admin:   generous flat allowance
const USER_QUOTAS = {
  student: { unverified: 50 * MB, verified: 150 * MB },
  teacher: { unverified: 50 * MB, verified: 2 * GB },
  admin: { unverified: 20 * GB, verified: 20 * GB },
};

// Section storage: 100 MB unverified → 3 GB once the CR's ID card is approved.
const SECTION_QUOTAS = {
  unverified: 100 * MB,
  verified: 3 * GB,
};

const isVerified = (user) => user?.verification?.status === 'verified';

/** Storage limit (bytes) for a user, based on role + verification state. */
const getUserLimit = (user) => {
  const tier = USER_QUOTAS[user.role] || USER_QUOTAS.student;
  return isVerified(user) ? tier.verified : tier.unverified;
};

/** Storage limit (bytes) for a section, based on verification state. */
const getSectionLimit = (section) =>
  section?.verification?.status === 'verified' ? SECTION_QUOTAS.verified : SECTION_QUOTAS.unverified;

// Presigned upload URLs are issued with a 1-hour expiry (see r2Service).
// A 'pending' file whose presign has expired without being confirmed is an
// abandoned upload attempt — safe to drop so it doesn't lock up quota forever.
const PENDING_TTL_MS = 60 * 60 * 1000;

const expireStalePending = async (userId) => {
  const cutoff = new Date(Date.now() - PENDING_TTL_MS);
  await PersonalFile.deleteMany({ owner: userId, status: 'pending', createdAt: { $lt: cutoff } });
  await TeacherMaterialFile.deleteMany({ owner: userId, status: 'pending', createdAt: { $lt: cutoff } });
};

const sumFileSize = async (Model, userId) => {
  const result = await Model.aggregate([
    { $match: { owner: userId, status: { $in: ['pending', 'active'] } } },
    { $group: { _id: null, total: { $sum: '$fileSize' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Total used quota for a user (sum of active + still-pending files).
 * For teachers this COMBINES personal storage and shared teacher-material
 * storage, matching the combined 50 MB / 2 GB allowance. Pending files count
 * too — otherwise repeated presigns before confirming would over-reserve.
 * Accepts a user document (needs role to know whether to include materials).
 */
const getUsedQuota = async (user) => {
  const userId = user._id || user;
  await expireStalePending(userId);
  let total = await sumFileSize(PersonalFile, userId);
  if (user.role === 'teacher') {
    total += await sumFileSize(TeacherMaterialFile, userId);
  }
  return total;
};

/**
 * Throw a 413 if adding newFileSize would exceed the user's quota.
 * @param {Object} user  full user document (role + verification)
 */
const checkQuota = async (user, newFileSize) => {
  const limit = getUserLimit(user);
  const used = await getUsedQuota(user);
  if (used + newFileSize > limit) {
    const usedMB = (used / MB).toFixed(1);
    const limitMB = (limit / MB).toFixed(1);
    throw Object.assign(new Error(`Storage quota exceeded (${usedMB} MB used of ${limitMB} MB limit)`), {
      status: 413,
      code: 'QUOTA_EXCEEDED',
    });
  }
};

/** Quota summary for a user: { used, limit, available, verified }. */
const getQuotaInfo = async (user) => {
  const limit = getUserLimit(user);
  const used = await getUsedQuota(user);
  return { used, limit, available: limit - used, verified: isVerified(user) };
};

module.exports = {
  getUsedQuota,
  checkQuota,
  getQuotaInfo,
  getUserLimit,
  getSectionLimit,
  USER_QUOTAS,
  SECTION_QUOTAS,
};
