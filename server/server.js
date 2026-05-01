const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check (no DB needed)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'OK', db: dbStatus, timestamp: new Date() });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasMongoUri: !!process.env.MONGO_URI,
    hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
    hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL || 'not set',
    port: process.env.PORT || 8080,
    dbReadyState: mongoose.connection.readyState
  });
});

// MongoDB Connection (lazy)
async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;
  
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
}

// Connect to DB in background (don't block server start)
connectToDatabase();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ml', require('./routes/ml'));

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('⚠️  GOOGLE_API_KEY not set - AI features will be disabled');
  }
});
