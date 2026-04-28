const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/analytics',require('./routes/analytics'));
app.use('/api/templates',require('./routes/templates'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/ml',       require('./routes/ml'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// MongoDB Connection (cache connection)
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dailyplanner');
  cachedDb = mongoose.connection;
}

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Export for Vercel serverless
module.exports = app;
