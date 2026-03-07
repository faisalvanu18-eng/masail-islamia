const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const nodemailer = require('nodemailer');


// ─────────────────────────────────────────────
// Email Transporter
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// ─────────────────────────────────────────────
// POST - Submit Ask Fatwa Question
// POST /api/questions
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {

  try {

    const {
      name,
      email,
      phone,
      topic,
      questionText
    } = req.body;


    // Basic validation
    if (!name || !email || !phone || !questionText) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone and question are required.'
      });
    }


    // Save question
    const question = await Question.create({
      name,
      email,
      phone,
      topic,
      questionText
    });


    // ─────────────────────────
    // Send email to user
    // ─────────────────────────
    try {

      await transporter.sendMail({

        from: process.env.EMAIL_FROM,
        to: email,

        subject: 'Your Question Received — Masail Islamia',

        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f5f0e8;padding:30px;border-radius:12px">

          <div style="background:#0d2b1a;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px">
            <h2 style="color:#e8c97a;margin:0">مسائل اسلامیہ</h2>
            <p style="color:#c9a84c;margin:5px 0 0;font-size:12px">MASAIL ISLAMIA</p>
          </div>

          <p>Dear <strong>${name}</strong>,</p>

          <p>
          Your question has been received successfully.
          It will be reviewed by <strong>Hazrat Mufti Rafiq Purkar Madni</strong>.
          </p>

          <p>
          The reply will be sent to your email and may also appear
          on the website as a Daily Masail.
          </p>

          <div style="background:#fff;padding:16px;border-radius:8px;margin:15px 0">

          <p style="font-size:12px;color:#777">YOUR QUESTION</p>

          <p style="direction:rtl;text-align:right">
          ${questionText}
          </p>

          </div>

          <p style="font-size:13px">
          📞 +91 9322576336 <br>
          📧 faisalvanu18@gmail.com
          </p>

          <hr>

          <p style="font-size:11px;color:#999;text-align:center">
          © Masail Islamia
          </p>

        </div>
        `
      });

    } catch (emailError) {

      console.log("User email failed:", emailError.message);

    }


    // ─────────────────────────
    // Notify Admin
    // ─────────────────────────
    try {

      await transporter.sendMail({

        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_USER,

        subject: `New Question Received from ${name}`,

        html: `
        <h3>New Question Submitted</h3>

        <p><strong>Name:</strong> ${name}</p>

        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Phone:</strong> ${phone}</p>

        <p><strong>Topic:</strong> ${topic || 'Not specified'}</p>

        <p><strong>Question:</strong></p>

        <div style="direction:rtl;text-align:right;background:#f4f4f4;padding:12px;border-radius:6px">
        ${questionText}
        </div>

        <hr>

        <p>Login to Admin Dashboard to review this question.</p>
        `
      });

    } catch (adminMailError) {

      console.log("Admin email failed:", adminMailError.message);

    }


    // ─────────────────────────
    // Response
    // ─────────────────────────
    res.status(201).json({

      success: true,

      message: "Question submitted successfully",

      data: {
        id: question._id
      }

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});


module.exports = router;