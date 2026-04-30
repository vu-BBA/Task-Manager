const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Only load dotenv in non-production (local development)
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

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/analytics',require('./routes/analytics'));
app.use('/api/templates',require('./routes/templates'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/ml',       require('./routes/ml'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Debug endpoint to check environment variables
app.get('/api/debug', (req, res) => {
  res.json({ 
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasMongoUri: !!process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL || 'not set'
  });
});

// MongoDB Connection
let cached = { conn: null, promise: null };

async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    }).then((mongoose) => {
      console.log('✅ MongoDB connected');
      return mongoose;
    }).catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      cached.promise = null;
      throw err;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// Connect on startup for non-serverless
if (require.main === module) {
  connectToDatabase();
}

// Middleware to ensure DB connection (for serverless)
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Export for Vercel serverless
module.exports = app;

// Start server locally (not in serverless environment)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
}
