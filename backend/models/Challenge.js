const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  type: {
    type: String,
    enum: ['focus_streak', 'distraction_limit', 'time_goal', 'habit_break'],
    required: true
  },
  duration: {
    type: Number,
    required: true // in days
  },
  target: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['sessions', 'minutes', 'hours', 'distractions'],
      required: true
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed', 'paused'],
    default: 'active'
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    dailyLog: [{
      date: {
        type: Date,
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      achieved: {
        type: Boolean,
        default: false
      }
    }]
  }
}, {
  timestamps: true
});

// Index for efficient queries
challengeSchema.index({ user: 1, status: 1, endDate: -1 });

// Calculate progress percentage
challengeSchema.methods.getProgressPercentage = function() {
  return Math.round((this.progress.current / this.target.value) * 100);
};

// Check if challenge is completed
challengeSchema.methods.checkCompletion = function() {
  if (this.progress.current >= this.target.value) {
    this.status = 'completed';
    return true;
  }
  return false;
};

module.exports = mongoose.model('Challenge', challengeSchema);