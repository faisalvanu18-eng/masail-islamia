const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },

  email: {
    type: String,
    default: 'faisalvanu18@gmail.com',
    trim: true,
    lowercase: true
  },

  role: {
    type: String,
    enum: ['superadmin', 'admin', 'editor'],
    default: 'admin'
  },

  lastLogin: {
    type: Date,
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });


// Hash password before save
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


// Compare entered password with hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);