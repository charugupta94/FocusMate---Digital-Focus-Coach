const express = require('express');
const { body, validationResult } = require('express-validator');
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/challenges
// @desc    Create a new challenge
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').trim().isLength({ min: 1, max: 300 }).withMessage('Description must be between 1 and 300 characters'),
  body('type').isIn(['focus_streak', 'distraction_limit', 'time_goal', 'habit_break']).withMessage('Invalid challenge type'),
  body('duration').isInt({ min: 1, max: 365 }).withMessage('Duration must be between 1 and 365 days'),
  body('target.value').isInt({ min: 1 }).withMessage('Target value must be a positive integer'),
  body('target.unit').isIn(['sessions', 'minutes', 'hours', 'distractions']).withMessage('Invalid target unit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { title, description, type, duration, target } = req.body;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    const challenge = new Challenge({
      user: req.user.id,
      title,
      description,
      type,
      duration,
      target,
      startDate,
      endDate
    });

    await challenge.save();

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/challenges
// @desc    Get user's challenges
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    const challenges = await Challenge.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Challenge.countDocuments(query);

    // Add progress percentage to each challenge
    const challengesWithProgress = challenges.map(challenge => ({
      ...challenge.toObject(),
      progressPercentage: challenge.getProgressPercentage()
    }));

    res.json({
      challenges: challengesWithProgress,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/challenges/:id/progress
// @desc    Update challenge progress
// @access  Private
router.put('/:id/progress', auth, [
  body('value').isNumeric().withMessage('Progress value must be a number'),
  body('date').optional().isISO8601().withMessage('Date must be in ISO format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { value, date } = req.body;
    const challengeId = req.params.id;

    const challenge = await Challenge.findOne({ _id: challengeId, user: req.user.id });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Update current progress
    challenge.progress.current += value;

    // Add to daily log
    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    const existingLogIndex = challenge.progress.dailyLog.findIndex(
      log => log.date.getTime() === logDate.getTime()
    );

    if (existingLogIndex >= 0) {
      challenge.progress.dailyLog[existingLogIndex].value += value;
    } else {
      challenge.progress.dailyLog.push({
        date: logDate,
        value: value,
        achieved: false
      });
    }

    // Check if challenge is completed
    if (challenge.checkCompletion()) {
      challenge.status = 'completed';
    }

    await challenge.save();

    res.json({
      message: 'Challenge progress updated',
      challenge: {
        ...challenge.toObject(),
        progressPercentage: challenge.getProgressPercentage()
      }
    });
  } catch (error) {
    console.error('Update challenge progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/challenges/:id/status
// @desc    Update challenge status
// @access  Private
router.put('/:id/status', auth, [
  body('status').isIn(['active', 'completed', 'failed', 'paused']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { status } = req.body;
    const challengeId = req.params.id;

    const challenge = await Challenge.findOne({ _id: challengeId, user: req.user.id });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    challenge.status = status;
    await challenge.save();

    res.json({
      message: 'Challenge status updated',
      challenge
    });
  } catch (error) {
    console.error('Update challenge status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/challenges/:id
// @desc    Delete a challenge
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    await Challenge.findByIdAndDelete(req.params.id);

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;