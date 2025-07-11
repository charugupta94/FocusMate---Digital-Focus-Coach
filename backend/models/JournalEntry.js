const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FocusSession'
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Content cannot exceed 1000 characters']
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'bad', 'terrible'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  insights: [{
    type: String,
    trim: true,
    maxlength: [200, 'Insight cannot exceed 200 characters']
  }],
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
journalEntrySchema.index({ user: 1, date: -1 });
journalEntrySchema.index({ user: 1, mood: 1, date: -1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);