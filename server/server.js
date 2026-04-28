const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dailyplanner')
  .then(() => {
    console.log('✅ MongoDB connected');
    // Start reminder cron job (every minute)
    cron.schedule('* * * * *', async () => {
      const { checkAndSendReminders } = require('./services/reminderService');
      await checkAndSendReminders();
    });
  })
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
