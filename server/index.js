const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const validateEnv = require('./config/validateEnv');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const runNotificationCron = require('./jobs/notificationCron');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Database Connection
validateEnv();
connectDB();

// Routes
app.use('/api/habits', require('./routes/habits'));
app.use('/api/completions', require('./routes/completions'));
app.use('/api/tuition', require('./routes/tuitionRoutes'));
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/nutrition', require('./routes/nutritionRoutes'));
app.use('/api/v1/prayer', require('./routes/prayerRoutes'));
app.use('/api/v1/sleep', require('./routes/sleepRoutes'));
app.use('/api/v1/study', require('./routes/studyRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => {
  res.send('Ultimate Life Habit Tracker API is running');
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  runNotificationCron();
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT in server/.env.`);
    process.exit(1);
  }
  console.error('Server startup error:', error.message);
  process.exit(1);
});

app.use(notFound);
app.use(errorHandler);
