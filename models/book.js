const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  titleUrdu: {
    type: String,
    required: [true, 'Urdu title is required'],
    trim: true
  },

  titleEnglish: {
    type: String,
    required: [true, 'English title is required'],
    trim: true
  },

  authorUrdu: {
    type: String,
    required: [true, 'Author Urdu name is required'],
    trim: true
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },

  fileName: {
    type: String,
    required: [true, 'File name is required']
  },

  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },

  fileSize: {
    type: Number,
    default: 0
  },

  mimeType: {
    type: String,
    default: 'application/pdf'
  },

  downloadCount: {
    type: Number,
    default: 0
  },

  isPublished: {
    type: Boolean,
    default: true,
    index: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);