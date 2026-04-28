const nodemailer = require('nodemailer');
const Task = require('../models/Task');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendReminderEmail = async (to, task) => {
  try {
    await transporter.sendMail({
      from: `"Daily Planner" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⏰ Reminder: ${task.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;background:#1e1e2e;color:#cdd6f4;padding:24px;border-radius:12px;">
          <h2 style="color:#cba6f7;">📅 Task Reminder</h2>
          <p>Your task is coming up soon:</p>
          <div style="background:#313244;padding:16px;border-radius:8px;border-left:4px solid #cba6f7;">
            <h3 style="margin:0 0 8px;color:#f5c2e7;">${task.title}</h3>
            ${task.description ? `<p style="margin:0 0 8px;">${task.description}</p>` : ''}
            <p style="margin:0;font-size:13px;color:#a6adc8;">
              📁 ${task.category.toUpperCase()} &nbsp;|&nbsp; 
              🔥 ${task.priority.toUpperCase()}
              ${task.scheduledAt ? ` &nbsp;|&nbsp; 🕐 ${new Date(task.scheduledAt).toLocaleTimeString()}` : ''}
            </p>
          </div>
          <p style="margin-top:16px;font-size:12px;color:#6c7086;">
            This reminder was sent by your Personalized Daily Planner.
          </p>
        </div>
      `,
    });
    console.log(`📧 Reminder sent for task: ${task.title}`);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

exports.checkAndSendReminders = async () => {
  try {
    const now   = new Date();
    const soon  = new Date(now.getTime() + 5 * 60 * 1000); // 5 min lookahead

    const tasks = await Task.find({
      reminderAt:  { $gte: now, $lte: soon },
      reminderSent: false,
      status:      { $nin: ['completed', 'cancelled'] },
    }).populate('user', 'email preferences');

    for (const task of tasks) {
      if (task.user?.email) {
        await sendReminderEmail(task.user.email, task);
        task.reminderSent = true;
        await task.save();
      }
    }
  } catch (err) {
    console.error('Reminder check error:', err.message);
  }
};
