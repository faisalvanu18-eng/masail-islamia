const express = require('express');
const path = require('path');
const router = express.Router();
const Book = require('../models/book');

/* ─────────────────────────────────────────────
   GET all published books
   /api/books
   /api/books?category=Namaz
   /api/books?search=fiqh
   ───────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    const query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { titleUrdu: { $regex: search, $options: 'i' } },
        { titleEnglish: { $regex: search, $options: 'i' } },
        { authorUrdu: { $regex: search, $options: 'i' } }
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

/* ─────────────────────────────────────────────
   IMPORTANT: /download/:id MUST come BEFORE /:id
   otherwise Express matches "download" as an ID
   ───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   DOWNLOAD book file directly
   /api/books/download/:id
   Forces download instead of opening in browser
   ───────────────────────────────────────────── */
router.get('/download/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book || !book.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (!book.fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Book file URL not found'
      });
    }

    book.downloadCount = (book.downloadCount || 0) + 1;
    await book.save();

    const cleanFileName =
      (book.titleEnglish || book.titleUrdu || 'book')
        .replace(/[<>:"/\\|?*]+/g, '')
        .trim() + '.pdf';

    // If stored fileUrl is like /upload/books/file.pdf
    if (book.fileUrl.startsWith('/upload/')) {
      const filePath = path.join(__dirname, '..', book.fileUrl.replace(/^\//, ''));

      return res.download(filePath, cleanFileName, (err) => {
        if (err) {
          console.error('Download error:', err.message);
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: 'Unable to download file'
            });
          }
        }
      });
    }

    // If full external URL is saved instead
    return res.json({
      success: true,
      url: book.fileUrl
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ─────────────────────────────────────────────
   GET book by ID
   /api/books/:id
   ───────────────────────────────────────────── */
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