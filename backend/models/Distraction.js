const mongoose = require('mongoose');

const distractionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FocusSession'
  },
  type: {
    type: String,
    enum: ['phone', 'social_media', 'website', 'notification', 'person', 'noise', 'thought', 'other'],
    required: true
  },
  source: {
    type: String,
    trim: true,
    maxlength: [100, 'Source cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for efficient queries
distractionSchema.index({ user: 1, timestamp: -1 });
distractionSchema.index({ user: 1, type: 1, timestamp: -1 });

module.exports = mongoose.model('Distraction', distractionSchema);