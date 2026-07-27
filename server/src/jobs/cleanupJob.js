// Auto-deletion of unverified accounts and sections whose 7-day grace window
// has elapsed without a verification request. Runs on a lightweight setInterval
// (no external scheduler dependency): once shortly after boot, then periodically.
//
// An account/section is only ever on the clock while `deletionDueAt` is set;
// submitting a verification request clears it, so anyone with a pending or
// verified status is never touched here.
const User = require('../models/User');
const Section = require('../models/Section');
const { deleteUserCascade, deleteSectionCascade } = require('../services/accountCleanup');
const { purgeExpiredListings } = require('../controllers/bookController');

const RUN_EVERY_MS = 6 * 60 * 60 * 1000; // every 6 hours
const BOOT_DELAY_MS = 60 * 1000; // wait a minute after startup

const runCleanup = async () => {
  const now = new Date();
  try {
    const dueUsers = await User.find({
      role: { $in: ['student', 'teacher'] },
      deletionDueAt: { $ne: null, $lte: now },
    }, '_id email');
    for (const u of dueUsers) {
      await deleteUserCascade(u._id);
      console.log(`🧹 Deleted unverified account past grace: ${u.email}`);
    }

    const dueSections = await Section.find({
      deletionDueAt: { $ne: null, $lte: now },
    }, '_id uniqueId');
    for (const s of dueSections) {
      await deleteSectionCascade(s._id);
      console.log(`🧹 Deleted unverified section past grace: ${s.uniqueId}`);
    }

    // Book listings past their 60-day life are removed outright (photos too).
    const purgedListings = await purgeExpiredListings();

    if (dueUsers.length || dueSections.length || purgedListings) {
      console.log(`🧹 Cleanup done — ${dueUsers.length} accounts, ${dueSections.length} sections, ${purgedListings} expired listings removed.`);
    }
  } catch (err) {
    console.error('Cleanup job error:', err);
  }
};

const startCleanupJob = () => {
  setTimeout(runCleanup, BOOT_DELAY_MS);
  setInterval(runCleanup, RUN_EVERY_MS);
  console.log('🧹 Verification cleanup job scheduled (every 6h).');
};

module.exports = { startCleanupJob, runCleanup };
