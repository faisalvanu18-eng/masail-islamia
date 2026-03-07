const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({

  // User Name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },

  // Email
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  // Phone number
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: 20
  },

  // Topic or category
  topic: {
    type: String,
    default: 'Other',
    index: true
  },

  // Question text (Urdu)
  questionText: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },

  // Admin reply
  replyText: {
    type: String,
    default: ''
  },

  // Question Status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'answered', 'published'],
    default: 'pending',
    index: true
  },

  // Email sent
  replySent: {
    type: Boolean,
    default: false
  },

  // Reply sent time
  replySentAt: {
    type: Date,
    default: null
  },

  // Converted to masail
  convertedToPost: {
    type: Boolean,
    default: false
  },

  // Linked Masail ID
  masailPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Masail',
    default: null
  },

  // Internal admin notes
  adminNotes: {
    type: String,
    default: ''
  }

},{
  timestamps: true
});


// Index for faster admin filtering
questionSchema.index({
  createdAt: -1,
  status: 1
});


module.exports = mongoose.model('Question', questionSchema);