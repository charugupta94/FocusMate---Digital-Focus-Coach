const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profileImage: {
    type: String,
    default: ''
  },
  preferences: {
    pomodoroLength: {
      type: Number,
      default: 25 // minutes
    },
    shortBreakLength: {
      type: Number,
      default: 5 // minutes
    },
    longBreakLength: {
      type: Number,
      default: 15 // minutes
    },
    sessionsBeforeLongBreak: {
      type: Number,
      default: 4
    },
    autoStartBreaks: {
      type: Boolean,
      default: false
    },
    autoStartPomodoros: {
      type: Boolean,
      default: false
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalFocusTime: {
      type: Number,
      default: 0 // in minutes
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    totalDistractions: {
      type: Number,
      default: 0
    }
  },
  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  lastActiveDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate daily focus score
userSchema.methods.calculateDailyFocusScore = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // This would need to be calculated based on today's sessions
  // For now, return a placeholder calculation
  return Math.min(100, Math.max(0, (this.stats.totalFocusTime / 480) * 100)); // Based on 8 hours target
};

module.exports = mongoose.model('User', userSchema);