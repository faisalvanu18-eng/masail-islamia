const mongoose = require('mongoose');

const masailSchema = new mongoose.Schema({

  // Masail Number (001,002 etc)
  masailNumber: {
    type: String,
    unique: true
  },

  // Urdu Title
  titleUrdu: {
    type: String,
    required: [true, 'Urdu title is required'],
    trim: true
  },

  // Category
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Namaz','Wazu','Roza','Zakat','Hajj','Nikah',
      'Talaq','Halal-Haram','Business','Inheritance',
      'Aqeedah','Dua-Dhikr','Judiciary','Children',
      'Women','Health','Education','Jihad','Will-Gift',
      'Buying-Selling','Slaughter','Funeral','Hijab',
      'Modern','Technology','Banking','Contracts',
      'Travel','Festivals','Quran','Hadith','Ramadan',
      'Charity','Household','Illness','Political','Other'
    ],
    default: 'Other',
    index: true
  },

  // Question (Urdu)
  questionUrdu: {
    type: String,
    required: [true, 'Question is required']
  },

  // Answer (Urdu)
  answerUrdu: {
    type: String,
    required: [true, 'Answer is required']
  },

  // References
  reference: {
    type: String,
    default: ''
  },

  // Madhab
  madhab: {
    type: String,
    default: 'Shafi'
  },

  // Publish Date
  publishedDate: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Published status
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },

  // Featured masail
  isFeatured: {
    type: Boolean,
    default: false
  },

  // View Counter
  views: {
    type: Number,
    default: 0
  }

},{
  timestamps: true
});


// Text Search
masailSchema.index({
  titleUrdu: 'text',
  questionUrdu: 'text',
  answerUrdu: 'text'
});


// Auto Generate Masail Number
masailSchema.pre('save', async function(next){

  if(!this.masailNumber){

    const lastMasail = await mongoose
      .model('Masail')
      .findOne({})
      .sort({ createdAt: -1 });

    if(lastMasail && lastMasail.masailNumber){
      const nextNumber = parseInt(lastMasail.masailNumber) + 1;
      this.masailNumber = String(nextNumber).padStart(3,'0');
    } else {
      this.masailNumber = '001';
    }

  }

  next();
});


module.exports = mongoose.model('Masail', masailSchema);