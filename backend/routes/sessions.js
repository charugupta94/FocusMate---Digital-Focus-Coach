const express = require('express');
const { body, validationResult } = require('express-validator');
const FocusSession = require('../models/FocusSession');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/sessions
// @desc    Create a new focus session
// @access  Private
router.post('/', auth, [
  body('type').isIn(['pomodoro', 'shortBreak', 'longBreak', 'custom']).withMessage('Invalid session type'),
  body('plannedDuration').isInt({ min: 1, max: 480 }).withMessage('Planned duration must be between 1 and 480 minutes'),
  body('task').optional().trim().isLength({ max: 200 }).withMessage('Task description cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { type, plannedDuration, task } = req.body;
    const startTime = new Date();

    const session = new FocusSession({
      user: req.user.id,
      type,
      plannedDuration,
      actualDuration: 0, // Will be updated when session ends
      startTime,
      endTime: startTime, // Will be updated when session ends
      task: task || ''
    });

    await session.save();

    res.status(201).json({
      message: 'Focus session started',
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/sessions/:id/complete
// @desc    Complete a focus session
// @access  Private
router.put('/:id/complete', auth, [
  body('actualDuration').isInt({ min: 0, max: 480 }).withMessage('Actual duration must be between 0 and 480 minutes'),
  body('completed').isBoolean().withMessage('Completed must be a boolean'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('mood').optional().isIn(['very_focused', 'focused', 'neutral', 'distracted', 'very_distracted']).withMessage('Invalid mood'),
  body('productivity').optional().isInt({ min: 1, max: 5 }).withMessage('Productivity must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { actualDuration, completed, notes, mood, productivity } = req.body;
    const sessionId = req.params.id;

    const session = await FocusSession.findOne({ _id: sessionId, user: req.user.id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update session
    session.actualDuration = actualDuration;
    session.completed = completed;
    session.endTime = new Date();
    if (notes) session.notes = notes;
    if (mood) session.mood = mood;
    if (productivity) session.productivity = productivity;

    await session.save();

    // Update user stats if it's a focus session (not a break)
    if (session.type === 'pomodoro' || session.type === 'custom') {
      const user = await User.findById(req.user.id);
      user.stats.totalFocusTime += actualDuration;
      user.stats.totalSessions += 1;
      
      // Update streak (simplified logic - in production, this would be more complex)
      if (completed) {
        user.stats.currentStreak += 1;
        if (user.stats.currentStreak > user.stats.longestStreak) {
          user.stats.longestStreak = user.stats.currentStreak;
        }
      }
      
      await user.save();
    }

    res.json({
      message: 'Session completed successfully',
      session
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sessions
// @desc    Get user's focus sessions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    
    const query = { user: req.user.id };
    
    if (type) {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sessions = await FocusSession.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('distractions');

    const total = await FocusSession.countDocuments(query);

    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sessions/today
// @desc    Get today's sessions
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await FocusSession.find({
      user: req.user.id,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ createdAt: -1 }).populate('distractions');

    res.json({ sessions });
  } catch (error) {
    console.error('Get today sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Delete a focus session
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await FocusSession.findByIdAndDelete(req.params.id);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;