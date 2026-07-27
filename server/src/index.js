require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const personalRoutes = require('./routes/personal');
const teacherMaterialRoutes = require('./routes/teacherMaterials');
const sectionRoutes = require('./routes/sections');
const sectionContentRoutes = require('./routes/sectionContent');
const { sectionNoticeRouter, teacherNoticeRouter } = require('./routes/notices');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const bookRoutes = require('./routes/books');
const jobRoutes = require('./routes/jobs');
const metaRoutes = require('./routes/meta');
const { startCleanupJob } = require('./jobs/cleanupJob');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(helmet());

// CORS: allow the configured client origin(s), plus any localhost origin while
// in development. Vite may serve on 5173, 5174, 5175… if an earlier instance
// already holds the default port, and a shifted dev port must NOT silently
// break every request with a CORS rejection (which surfaces as "login failed"
// with no useful error). CLIENT_URL may be a comma-separated list.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Non-browser clients (curl, server-to-server) send no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, accept any localhost / 127.0.0.1 origin on any port.
    if (
      process.env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/personal', personalRoutes);
app.use('/teacher-materials', teacherMaterialRoutes);
app.use('/sections', sectionRoutes);
app.use('/sections/:id', sectionContentRoutes);
app.use('/sections/:id/notices', sectionNoticeRouter);
app.use('/notices', teacherNoticeRouter);
app.use('/notifications', notificationRoutes);
app.use('/admin', adminRoutes);
app.use('/books', bookRoutes);
app.use('/jobs', jobRoutes);
app.use('/meta', metaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  // Kick off the unverified-account/section cleanup scheduler.
  startCleanupJob();
});
