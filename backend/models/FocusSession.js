const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['pomodoro', 'shortBreak', 'longBreak', 'custom'],
    required: true
  },
  plannedDuration: {
    type: Number,
    required: true // in minutes
  },
  actualDuration: {
    type: Number,
    required: true // in minutes
  },
  completed: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  task: {
    type: String,
    trim: true,
    maxlength: [200, 'Task description cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  distractions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distraction'
  }],
  mood: {
    type: String,
    enum: ['very_focused', 'focused', 'neutral', 'distracted', 'very_distracted'],
    default: 'neutral'
  },
  productivity: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true
});

// Index for efficient queries
focusSessionSchema.index({ user: 1, createdAt: -1 });
focusSessionSchema.index({ user: 1, type: 1, createdAt: -1 });

// Calculate completion percentage
focusSessionSchema.methods.getCompletionPercentage = function() {
  return Math.round((this.actualDuration / this.plannedDuration) * 100);
};

module.exports = mongoose.model('FocusSession', focusSessionSchema);