const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Book = require('../models/book');

/* GET all published books */
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
        { authorUrdu: { $regex: search, $options: 'i' } },
        { authorEnglish: { $regex: search, $options: 'i' } }
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

/* DOWNLOAD book */
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

    let fileUrl = String(book.fileUrl).trim();

    // External file
    if (/^https?:\/\//i.test(fileUrl)) {
      book.downloadCount = (book.downloadCount || 0) + 1;
      await book.save();

      return res.json({
        success: true,
        url: fileUrl
      });
    }

    // Normalize old /uploads path to /upload
    if (fileUrl.startsWith('/uploads/')) {
      fileUrl = fileUrl.replace('/uploads/', '/upload/');
    }

    if (!fileUrl.startsWith('/upload/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book file path'
      });
    }

    const relativePath = fileUrl.replace(/^\/+/, '');
    const filePath = path.join(__dirname, '..', relativePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Book file does not exist on server'
      });
    }

    book.downloadCount = (book.downloadCount || 0) + 1;
    await book.save();

    return res.json({
      success: true,
      url: fileUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* GET book by ID */
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