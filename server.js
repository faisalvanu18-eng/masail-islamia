const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

const masailRoutes = require('./routes/masailRoutes');
const questionRoutes = require('./routes/questionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────────────────────────
   DB
   ───────────────────────────────────────────── */
connectDB();

/* ─────────────────────────────────────────────
   MIDDLEWARE
   ───────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─────────────────────────────────────────────
   STATIC FILES
   ───────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, 'public')));

/* IMPORTANT:
   your actual folder is "upload", not "uploads"
   so serve it correctly
*/
app.use('/upload', express.static(path.join(__dirname, 'upload')));

/* ─────────────────────────────────────────────
   API ROUTES
   ───────────────────────────────────────────── */
app.use('/api/masail', masailRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/books', bookRoutes);

/* ─────────────────────────────────────────────
   HEALTH ROUTE
   ───────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Masail Islamia API is running',
    time: new Date().toISOString()
  });
});

/* ─────────────────────────────────────────────
   PAGE ROUTES
   ───────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/books', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'books.html'));
});

app.get('/books.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'books.html'));
});

app.get('/category', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'category.html'));
});

app.get('/category.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'category.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

/* ─────────────────────────────────────────────
   404 FOR API
   ───────────────────────────────────────────── */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/* ─────────────────────────────────────────────
   FALLBACK FOR FRONTEND
   ───────────────────────────────────────────── */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ─────────────────────────────────────────────
   START
   ───────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📘 API Health: http://localhost:${PORT}/api/health`);
});