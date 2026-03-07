require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

// ── Connect Database ──
connectDB();

const app = express();

// ── Middleware ──
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'null'
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded files ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ──
app.use('/api/masail', require('./routes/masailRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Masail Islamia API is running',
    time: new Date()
  });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// ── Start server ──
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📖 API Health: http://localhost:${PORT}/api/health`);

  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const adminExists = await Admin.findOne({ username });

    if (!adminExists) {
      await Admin.create({
        username,
        password: process.env.ADMIN_PASSWORD || 'admin123',
        email: 'faisalvanu18@gmail.com',
        role: 'superadmin',
      });

      console.log('✅ Default admin created');
      console.log(`👤 Username: ${username}`);
      console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
      console.log('⚠️ Please change password after first login');
    }
  } catch (error) {
    console.log('Admin seed skipped or failed:', error.message);
  }
});