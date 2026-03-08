const express = require('express');
const path = require('path');
const fs = require('fs');
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
   DOWNLOAD book — returns JSON { success, url }
   for BOTH local and external files so the
   frontend can open/download consistently.
   /api/books/download/:id
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

    // Increment download count
    book.downloadCount = (book.downloadCount || 0) + 1;
    await book.save();

    const fileUrl = String(book.fileUrl).trim();

    // External URL — return as-is
    if (/^https?:\/\//i.test(fileUrl)) {
      return res.json({
        success: true,
        url: fileUrl
      });
    }

    // Local uploaded file — verify it exists then return a public URL
    if (fileUrl.startsWith('/uploads/') || fileUrl.startsWith('/upload/')) {
      const relativePath = fileUrl.replace(/^\/+/, '');
      const filePath = path.join(__dirname, '..', relativePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Book file does not exist on server'
        });
      }

      // Return the public URL so the browser can download it directly
      return res.json({
        success: true,
        url: fileUrl   // e.g. "/uploads/books/filename.pdf"
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid book file path'
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