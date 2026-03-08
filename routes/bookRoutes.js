const express = require('express');
const router = express.Router();
const Book = require('../models/book');


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
// Download book — increment count & return URL
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

    res.json({
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