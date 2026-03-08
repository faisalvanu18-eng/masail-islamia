const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');

const Admin = require('../models/Admin');
const Masail = require('../models/Masail');
const Question = require('../models/Question');
const Book = require('../models/book');
const { protect } = require('../middleware/auth');

/* ─────────────────────────────────────────────
   CLOUDINARY
   ───────────────────────────────────────────── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ─────────────────────────────────────────────
   MULTER (PDF ONLY)
   ───────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

/* ─────────────────────────────────────────────
   EMAIL TRANSPORTER
   ───────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */
function generateToken(adminId) {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
}

async function uploadPdfToCloudinary(file) {
  const safeName = file.originalname
    .replace(/\.[^/.]+$/, '')
    .replace(/[^\w\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const publicId = `masail-islamia/books/${Date.now()}-${safeName}`;

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'upload',
        public_id: publicId,
        format: 'pdf',
        use_filename: true,
        unique_filename: false,
        overwrite: false
      },
      (error, uploadResult) => {
        if (error) return reject(error);
        resolve(uploadResult);
      }
    );

    stream.end(file.buffer);
  });

  return result;
}

function getCloudinaryRawDownloadUrl(secureUrl) {
  if (!secureUrl || !secureUrl.includes('/upload/')) return secureUrl;
  return secureUrl.replace('/upload/', '/upload/fl_attachment/');
}

/* ══════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════ */

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or username and password are required'
      });
    }

    const query = email ? { email } : { username };
    const admin = await Admin.findOne(query).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/admin/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

/* ══════════════════════════════════════════════
   DASHBOARD STATS
   ══════════════════════════════════════════════ */
router.get('/stats', protect, async (req, res) => {
  try {
    const [
      totalMasail,
      publishedMasail,
      unpublishedMasail,
      totalQuestions,
      pendingQuestions,
      answeredQuestions,
      totalBooks
    ] = await Promise.all([
      Masail.countDocuments(),
      Masail.countDocuments({ isPublished: true }),
      Masail.countDocuments({ isPublished: false }),
      Question.countDocuments(),
      Question.countDocuments({ status: 'pending' }),
      Question.countDocuments({ status: 'answered' }),
      Book.countDocuments()
    ]);

    const recentQuestions = await Question.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name topic status createdAt');

    const recentMasail = await Masail.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('masailNumber titleUrdu category isPublished createdAt');

    res.json({
      success: true,
      data: {
        totalMasail,
        publishedMasail,
        unpublishedMasail,
        totalQuestions,
        pendingQuestions,
        answeredQuestions,
        totalBooks,
        recentQuestions,
        recentMasail
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   MASAIL MANAGEMENT
   ══════════════════════════════════════════════ */
router.get('/masail', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const query = {};

    if (status === 'published') query.isPublished = true;
    if (status === 'unpublished') query.isPublished = false;
    if (category) query.category = category;

    if (search) {
      query.$or = [
        { titleUrdu: { $regex: search, $options: 'i' } },
        { titleEnglish: { $regex: search, $options: 'i' } },
        { questionUrdu: { $regex: search, $options: 'i' } },
        { answerUrdu: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (currentPage - 1) * perPage;

    const total = await Masail.countDocuments(query);
    const list = await Masail.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    res.json({
      success: true,
      total,
      page: currentPage,
      pages: Math.ceil(total / perPage),
      data: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/masail/:id', protect, async (req, res) => {
  try {
    const masail = await Masail.findById(req.params.id);
    if (!masail) {
      return res.status(404).json({ success: false, message: 'Masail not found' });
    }
    res.json({ success: true, data: masail });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/masail', protect, async (req, res) => {
  try {
    const masail = await Masail.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Masail created successfully',
      data: masail
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/masail/:id', protect, async (req, res) => {
  try {
    const masail = await Masail.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!masail) {
      return res.status(404).json({ success: false, message: 'Masail not found' });
    }

    res.json({
      success: true,
      message: 'Masail updated successfully',
      data: masail
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/masail/:id', protect, async (req, res) => {
  try {
    const masail = await Masail.findById(req.params.id);
    if (!masail) {
      return res.status(404).json({ success: false, message: 'Masail not found' });
    }

    await masail.deleteOne();

    res.json({
      success: true,
      message: 'Masail deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/masail/:id/feature', protect, async (req, res) => {
  try {
    await Masail.updateMany({}, { isFeatured: false });

    const masail = await Masail.findByIdAndUpdate(
      req.params.id,
      { isFeatured: true },
      { new: true }
    );

    if (!masail) {
      return res.status(404).json({ success: false, message: 'Masail not found' });
    }

    res.json({
      success: true,
      message: 'Featured masail updated successfully',
      data: masail
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   QUESTION MANAGEMENT
   ══════════════════════════════════════════════ */
router.get('/questions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { questionText: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (currentPage - 1) * perPage;

    const total = await Question.countDocuments(query);
    const list = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    res.json({
      success: true,
      total,
      page: currentPage,
      pages: Math.ceil(total / perPage),
      data: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/questions/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('masailPostId');
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/questions/:id/reply', protect, async (req, res) => {
  try {
    const { replyText, adminNotes } = req.body;

    if (!replyText) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    question.replyText = replyText;
    question.adminNotes = adminNotes || question.adminNotes;
    question.status = 'answered';
    question.replySent = true;
    question.replySentAt = new Date();
    await question.save();

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: question.email,
        subject: 'Reply to Your Question — Masail Islamia',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f0e8;padding:30px;border-radius:12px;">
            <div style="background:#0d2b1a;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">
              <h2 style="color:#e8c97a;margin:0;">مسائل اسلامیہ</h2>
              <p style="color:#c9a84c;margin:5px 0 0;font-size:12px;">MASAIL ISLAMIA</p>
            </div>
            <p>Dear <strong>${question.name}</strong>,</p>
            <p>Your question has been answered by <strong>Hazrat Mufti Rafiq Purkar Madni</strong>.</p>
            <div style="background:#fff;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="font-size:12px;color:#777;margin:0 0 8px;">YOUR QUESTION</p>
              <p style="direction:rtl;text-align:right;margin:0;">${question.questionText}</p>
            </div>
            <div style="background:#f0fff4;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="font-size:12px;color:#2d6e47;margin:0 0 8px;">ANSWER — جواب</p>
              <p style="direction:rtl;text-align:right;margin:0;">${replyText}</p>
            </div>
            <p style="font-size:13px">📞 +91 9322576336 <br>📧 faisalvanu18@gmail.com</p>
            <hr>
            <p style="font-size:11px;color:#999;text-align:center;">© Masail Islamia</p>
          </div>
        `
      });
    } catch (mailError) {
      console.log('Reply email failed:', mailError.message);
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: question
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/questions/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'reviewed', 'answered', 'published'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Question status updated',
      data: question
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/questions/:id/notes', protect, async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { adminNotes: adminNotes || '' },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Notes updated successfully',
      data: question
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/questions/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await question.deleteOne();

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   BOOK MANAGEMENT
   ══════════════════════════════════════════════ */
router.get('/books', protect, async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/books/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/books', protect, upload.single('bookFile'), async (req, res) => {
  try {
    const { titleUrdu, titleEnglish, authorUrdu, authorEnglish, category, isPublished } = req.body;

    if (!titleUrdu || !titleEnglish || !authorUrdu || !category) {
      return res.status(400).json({
        success: false,
        message: 'titleUrdu, titleEnglish, authorUrdu and category are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    const uploadResult = await uploadPdfToCloudinary(req.file);
    const finalUrl = getCloudinaryRawDownloadUrl(uploadResult.secure_url);

    const book = await Book.create({
      titleUrdu,
      titleEnglish,
      authorUrdu,
      authorEnglish: authorEnglish || '',
      category,
      fileName: req.file.originalname,
      fileUrl: finalUrl,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      isPublished: String(isPublished) === 'false' ? false : true
    });

    res.status(201).json({
      success: true,
      message: 'Book uploaded successfully',
      data: book
    });
  } catch (error) {
    console.error('Book upload error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/books/:id', protect, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: book
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/books/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(book.cloudinaryPublicId, {
          resource_type: 'raw'
        });
      } catch (cloudErr) {
        console.log('Cloudinary delete failed (non-critical):', cloudErr.message);
      }
    }

    await book.deleteOne();

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════
   ADMIN PASSWORD CHANGE
   ══════════════════════════════════════════════ */
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const admin = await Admin.findById(req.admin._id).select('+password');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isMatch = await admin.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;