// One-off script to create (or promote) the platform super-admin.
//
//   node src/scripts/seedAdmin.js
//
// Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME / ADMIN_PHONE from the
// environment (.env). If a user with ADMIN_EMAIL already exists, they are
// promoted to admin; otherwise a new admin account is created. Safe to re-run.
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Platform Admin';
  const phone = process.env.ADMIN_PHONE || '0000000000';

  if (!email || !password) {
    console.error('✖ Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env before running this script.');
    process.exit(1);
  }

  await connectDB();

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    user.deletionDueAt = null;
    user.verification.status = 'verified';
    await user.save();
    console.log(`✔ Existing user ${email} promoted to admin.`);
  } else {
    user = await User.create({
      name,
      email,
      phone,
      passwordHash: password, // hashed by pre-save hook
      role: 'admin',
      verification: { status: 'verified' },
      deletionDueAt: null,
    });
    console.log(`✔ Admin account created: ${email}`);
  }

  console.log('   You can now log in with these credentials.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
