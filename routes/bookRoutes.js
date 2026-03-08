const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const path = require('path');
const fs = require('fs');


// ─────────────────────────────────────────────
// GET all published books
// /api/books
// /api/books?category=Namaz
// /api/books?search=fiqh
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {

    const { category, search } = req.query;

    const query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { titleUrdu:   { $regex: search, $options: 'i' } },
        { titleEnglish:{ $regex: search, $options: 'i' } },
        { authorUrdu:  { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: books.length,
      data: books
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});


// ─────────────────────────────────────────────
// IMPORTANT: /download/:id MUST come BEFORE /:id
// otherwise Express matches "download" as an ID
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Download book — streams file directly so
// browser downloads it instead of opening it
// /api/books/download/:id
// ─────────────────────────────────────────────
router.get('/download/:id', async (req, res) => {
  try {

    const book = await Book.findById(req.params.id);

    if (!book || !book.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Increment download count
    book.downloadCount += 1;
    await book.save();

    // Build absolute file path from the stored relative URL
    // fileUrl is typically like '/uploads/books/filename.pdf'
    const relativePath = book.fileUrl.startsWith('/')
      ? book.fileUrl
      : `/${book.fileUrl}`;

    // Try root-level /uploads first, then /public/uploads as fallback
    let absolutePath = path.join(__dirname, '..', relativePath);

    if (!fs.existsSync(absolutePath)) {
      absolutePath = path.join(__dirname, '..', 'public', relativePath);
    }

    // Check file exists
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Get a clean filename for the download dialog
    const fileName = path.basename(absolutePath);

    // Set headers to FORCE download (not open in browser)
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Stream the file to the client
    const fileStream = fs.createReadStream(absolutePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error reading file' });
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});


// ─────────────────────────────────────────────
// GET book by ID
// /api/books/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {

    const book = await Book.findById(req.params.id);

    if (!book || !book.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: book
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});


module.exports = router;